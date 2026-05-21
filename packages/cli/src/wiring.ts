import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { stdin as input } from "node:process";
import {
  createPool,
  getGraphCounts,
  PostgresChunkIndexStore,
  PostgresGraphExpansionStore,
  PostgresGraphStore,
  PostgresSearchStore,
  runMigrations,
  type GraphCounts,
} from "@kg/adapter-postgres";
import {
  DEFAULT_EXPANSION_EDGE_TYPES,
  buildContextPack,
  contextPackSchema,
  hybridSearch,
  indexChunks,
  ingestArtifacts,
  ingestWorkspace,
  parseBriefJson,
  type ArtifactIngestStats,
  parseExpansionSeed,
  createEntityExtractor,
  type Brief,
  type HybridSearchHit,
  type IngestStats,
  type IndexChunksStats,
} from "@kg/core";
import { resolveEmbeddingProvider } from "./embedding-provider.js";

export function resolveWorkspaceRoot(): string {
  const fromEnv = process.env.KG_WORKSPACE;
  return resolve(fromEnv ?? process.cwd());
}

export function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  return databaseUrl;
}

export function resolveCorpusDir(workspaceRoot: string, corpusArg?: string): string {
  const relative = corpusArg ?? "corpus";
  const corpusDir = resolve(workspaceRoot, relative);
  const normalizedRoot = resolve(workspaceRoot);
  if (!corpusDir.startsWith(normalizedRoot)) {
    throw new Error(`Corpus path must stay within KG_WORKSPACE: ${relative}`);
  }
  return corpusDir;
}

export function resolveArtifactsDir(workspaceRoot: string, artifactsArg?: string): string {
  const relative = artifactsArg ?? "artifacts/artifacts";
  const artifactsDir = resolve(workspaceRoot, relative);
  const normalizedRoot = resolve(workspaceRoot);
  if (!artifactsDir.startsWith(normalizedRoot)) {
    throw new Error(`Artifacts path must stay within KG_WORKSPACE: ${relative}`);
  }
  return artifactsDir;
}

export async function withDatabasePool<T>(
  fn: (pool: ReturnType<typeof createPool>) => Promise<T>,
  options?: { migrate?: boolean },
): Promise<T> {
  const databaseUrl = requireDatabaseUrl();
  if (options?.migrate !== false) {
    await runMigrations("up", databaseUrl);
  }
  const pool = createPool(databaseUrl);
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

export async function runIngestUseCase(corpusArg?: string): Promise<{
  workspaceRoot: string;
  corpusDir: string;
  stats: IngestStats;
}> {
  const workspaceRoot = resolveWorkspaceRoot();
  const corpusDir = resolveCorpusDir(workspaceRoot, corpusArg);

  const stats = await withDatabasePool(async (pool) => {
    const store = new PostgresGraphStore(pool);
    return ingestWorkspace({
      workspaceRoot,
      corpusDir,
      store,
      entityExtractor: createEntityExtractor(process.env.ENTITY_EXTRACTOR),
    });
  });

  return { workspaceRoot, corpusDir, stats };
}

export async function runIngestArtifactsUseCase(artifactsArg?: string): Promise<{
  workspaceRoot: string;
  artifactsDir: string;
  stats: ArtifactIngestStats;
}> {
  const workspaceRoot = resolveWorkspaceRoot();
  const artifactsDir = resolveArtifactsDir(workspaceRoot, artifactsArg);

  const stats = await withDatabasePool(async (pool) => {
    const store = new PostgresGraphStore(pool);
    return ingestArtifacts({
      workspaceRoot,
      artifactsDir,
      store,
    });
  });

  return { workspaceRoot, artifactsDir, stats };
}

export async function runIndexUseCase(providerName?: string): Promise<{
  provider: string;
  dimensions: number;
  stats: IndexChunksStats;
}> {
  const provider = resolveEmbeddingProvider(providerName);

  const stats = await withDatabasePool(async (pool) => {
    const indexStore = new PostgresChunkIndexStore(pool);
    return indexChunks({
      indexStore,
      embeddingProvider: provider,
      unindexedOnly: true,
    });
  });

  return {
    provider: provider.modelId,
    dimensions: provider.dimensions,
    stats,
  };
}

export interface SearchUseCaseResult {
  query: string;
  provider: string;
  filters: { docType?: string; module?: string[] };
  results: Array<{
    chunk_id: string;
    score: number;
    path: string;
    heading: string;
    snippet: string;
  }>;
}

export async function runSearchUseCase(
  query: string,
  options?: {
    docType?: string;
    module?: string[];
    providerName?: string;
    limit?: number;
  },
): Promise<SearchUseCaseResult> {
  const provider = resolveEmbeddingProvider(options?.providerName);
  const docType = options?.docType;
  const module = options?.module;

  const hits = await withDatabasePool(async (pool) => {
    const searchStore = new PostgresSearchStore(pool);
    return hybridSearch({
      query,
      embeddingProvider: provider,
      searchStore,
      filters:
        docType || (module && module.length > 0) ? { docType, module } : undefined,
      rrfTopK: options?.limit,
    });
  });

  const filters: SearchUseCaseResult["filters"] = {};
  if (docType) filters.docType = docType;
  if (module && module.length > 0) filters.module = module;

  return {
    query,
    provider: provider.modelId,
    filters,
    results: mapSearchHits(hits),
  };
}

function mapSearchHits(hits: HybridSearchHit[]): SearchUseCaseResult["results"] {
  return hits.map((hit) => ({
    chunk_id: hit.chunkId,
    score: hit.rrfScore,
    path: hit.path,
    heading: hit.heading,
    snippet: truncateSnippet(hit.text, 400),
  }));
}

function truncateSnippet(text: string, maxLen: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

export async function runExpandUseCase(
  fromRaw: string,
  options?: { hops?: number },
): Promise<Record<string, unknown>> {
  const hops = options?.hops ?? 2;
  if (!Number.isFinite(hops) || hops < 1 || hops > 2) {
    throw new Error("hops must be 1 or 2");
  }

  const workspaceRoot = resolveWorkspaceRoot();

  return withDatabasePool(async (pool) => {
    const expansionStore = new PostgresGraphExpansionStore(pool);
    const seed = parseExpansionSeed(fromRaw);
    let seedNodeIds: string[] = [];

    if (seed.kind === "doc") {
      const candidates = [
        seed.id,
        seed.id.endsWith(".md") ? seed.id : `${seed.id}.md`,
        `corpus/market/${seed.id}.md`,
        `corpus/business/${seed.id}.md`,
        `corpus/technical/${seed.id}.md`,
      ];
      for (const path of candidates) {
        const docId = await expansionStore.resolveDocIdFromPath(path);
        if (docId) {
          seedNodeIds = [docId];
          break;
        }
      }
      if (seedNodeIds.length === 0) {
        seedNodeIds = [seed.id];
      }
    } else {
      seedNodeIds = [seed.id];
    }

    const result = await expansionStore.expand({
      seedNodeIds,
      hops,
      edgeTypes: DEFAULT_EXPANSION_EDGE_TYPES,
    });

    return {
      ok: true,
      workspaceRoot,
      from: fromRaw,
      seedNodeIds,
      ...result,
    };
  });
}

export async function runPackUseCase(
  brief: Brief,
  providerName?: string,
  options?: { artifactsOnly?: boolean },
): Promise<{ pack: ReturnType<typeof contextPackSchema.parse>; meta: Record<string, unknown> }> {
  const provider = resolveEmbeddingProvider(providerName);

  const pack = await withDatabasePool(async (pool) => {
    const searchStore = new PostgresSearchStore(pool);
    const graphExpansion = new PostgresGraphExpansionStore(pool);
    return buildContextPack({
      brief,
      embeddingProvider: provider,
      searchStore,
      graphExpansion,
      hitsPerQuery: 10,
      artifactsOnly: options?.artifactsOnly !== false,
    });
  });

  contextPackSchema.parse(pack);

  return {
    pack,
    meta: {
      provider: provider.modelId,
      facets_covered: pack.meta.facets_covered,
      token_estimate: pack.meta.token_estimate,
      duration_ms: pack.meta.duration_ms,
    },
  };
}

export async function runStatsUseCase(): Promise<GraphCounts & { chunks_missing_embeddings?: number }> {
  return withDatabasePool(async (pool) => {
    const counts = await getGraphCounts(pool);
    const indexStore = new PostgresChunkIndexStore(pool);
    const chunksMissingEmbeddings = await indexStore.countMissingEmbeddings();
    return {
      ...counts,
      chunks_missing_embeddings: chunksMissingEmbeddings,
    };
  });
}

export async function loadBriefFromJson(raw: unknown): Promise<Brief> {
  return parseBriefJson(raw);
}

export async function loadBriefFromFile(path: string): Promise<Brief> {
  const raw = await readFile(resolve(path), "utf8");
  return parseBriefJson(JSON.parse(raw) as unknown);
}

export async function readStdinUtf8(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of input) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}
