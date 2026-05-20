#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  createPool,
  PostgresChunkIndexStore,
  PostgresGraphStore,
  PostgresSearchStore,
  runMigrations,
} from "@kg/adapter-postgres";
import {
  hybridSearch,
  indexChunks,
  ingestWorkspace,
  parseBenchmarkJsonl,
  recallAtK,
  summarizeRecall,
} from "@kg/core";
import { resolveEmbeddingProvider } from "./embedding-provider.js";

function parseProviderArg(argv: readonly string[]): string | undefined {
  const index = argv.indexOf("--provider");
  if (index === -1) return undefined;
  return argv[index + 1];
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for benchmark:recall");
  }

  const workspaceRoot = resolve(process.env.KG_WORKSPACE ?? process.cwd());
  const providerName = parseProviderArg(process.argv);
  const embeddingProvider = resolveEmbeddingProvider(providerName);

  await runMigrations("up", databaseUrl);
  const pool = createPool(databaseUrl);
  const store = new PostgresGraphStore(pool);
  const indexStore = new PostgresChunkIndexStore(pool);
  const searchStore = new PostgresSearchStore(pool);

  try {
    await ingestWorkspace({
      workspaceRoot,
      corpusDir: join(workspaceRoot, "corpus"),
      store,
    });

    await indexChunks({
      indexStore,
      embeddingProvider,
      unindexedOnly: true,
    });

    const benchmarkPath = join(workspaceRoot, "benchmark", "queries.jsonl");
    const content = await readFile(benchmarkPath, "utf-8");
    const queries = parseBenchmarkJsonl(content);

    const rows = [];
    for (const item of queries) {
      const hits = await hybridSearch({
        query: item.query,
        embeddingProvider,
        searchStore,
      });
      const topPaths = hits.map((hit) => hit.path);
      rows.push({
        query: item.query,
        facet: item.facet,
        hit: recallAtK(hits, item.expected_paths, 10),
        topPaths,
      });
    }

    const summary = summarizeRecall(rows);
    console.log(
      JSON.stringify(
        {
          ok: true,
          provider: embeddingProvider.modelId,
          recallAt10: summary.recallAt10,
          hits: summary.hits,
          total: summary.total,
          rows: summary.rows,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

await main();
