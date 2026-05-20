import { estimateTokens } from "../chunk/tokens.js";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import type { SearchStore } from "../ports/search-store.js";
import type { GraphExpansionStore } from "../graph/graph-expansion.js";
import { DEFAULT_EXPANSION_EDGE_TYPES, isGtmNodeType } from "../graph/ontology.js";
import { hybridSearch, DEFAULT_RRF_TOP_K } from "../retrieval/hybrid-search.js";
import type { HybridSearchHit } from "../retrieval/types.js";
import { planFacets, type FacetSearchPlan } from "./facet-planner.js";
import {
  emptyPackSections,
  type Brief,
  type ContextPack,
  type PackSectionChunk,
} from "./schema.js";
import { PACK_SECTION_IDS, type PackSectionId } from "./sections.js";

export const DEFAULT_PACK_TOKEN_BUDGET = 6000;
export const DEFAULT_EXPANSION_HOPS = 2;
const MAX_GLOBAL_EXPANSION_QUERIES = 5;
const MAX_EXPANSION_SEEDS = 8;

export interface PackBuilderOptions {
  brief: Brief;
  embeddingProvider: EmbeddingProvider;
  searchStore: SearchStore;
  graphExpansion?: GraphExpansionStore;
  tokenBudget?: number;
  expansionHops?: number;
  hitsPerQuery?: number;
}

interface ScoredChunk {
  chunkId: string;
  docId: string;
  path: string;
  heading: string;
  text: string;
  score: number;
  sectionId: PackSectionId;
}

function hitToScored(hit: HybridSearchHit, sectionId: PackSectionId): ScoredChunk {
  return {
    chunkId: hit.chunkId,
    docId: hit.docId,
    path: hit.path,
    heading: hit.heading,
    text: hit.text,
    score: hit.rrfScore,
    sectionId,
  };
}

function mergeChunks(existing: ScoredChunk[], incoming: ScoredChunk[]): ScoredChunk[] {
  const byId = new Map(existing.map((c) => [c.chunkId, c]));
  for (const chunk of incoming) {
    const prev = byId.get(chunk.chunkId);
    if (!prev || chunk.score > prev.score) {
      byId.set(chunk.chunkId, chunk);
    }
  }
  return [...byId.values()].sort((a, b) => b.score - a.score);
}

function assembleSectionContent(chunks: readonly PackSectionChunk[]): string {
  return chunks
    .map((c) => c.text.trim())
    .filter((text) => text.length > 0)
    .join("\n\n");
}

function toSectionChunks(chunks: readonly ScoredChunk[]): PackSectionChunk[] {
  return chunks.map((c) => ({
    chunk_id: c.chunkId,
    doc_id: c.docId,
    path: c.path,
    heading: c.heading,
    text: c.text,
    score: c.score,
  }));
}

function applyTokenBudget(
  chunks: readonly ScoredChunk[],
  maxTokens: number,
): ScoredChunk[] {
  const selected: ScoredChunk[] = [];
  let used = 0;
  for (const chunk of chunks) {
    const tokens = estimateTokens(chunk.text);
    if (used + tokens > maxTokens && selected.length > 0) break;
    selected.push(chunk);
    used += tokens;
    if (used >= maxTokens) break;
  }
  return selected;
}

function sectionTokenBudget(totalBudget: number, plan: FacetSearchPlan): number {
  const weightSum = 100;
  return Math.max(80, Math.floor((totalBudget * plan.priority) / weightSum));
}

function pathMatchesDocTypes(path: string, docTypes: readonly string[]): boolean {
  if (docTypes.length === 0) return true;
  return docTypes.some((docType) => path.includes(`corpus/${docType}/`));
}

async function searchForPlan(
  plan: FacetSearchPlan,
  options: PackBuilderOptions,
): Promise<ScoredChunk[]> {
  const hitsPerQuery = options.hitsPerQuery ?? Math.max(5, Math.ceil(DEFAULT_RRF_TOP_K / plan.queries.length));
  let merged: ScoredChunk[] = [];

  for (const query of plan.queries) {
    const hits = await hybridSearch({
      query,
      embeddingProvider: options.embeddingProvider,
      searchStore: options.searchStore,
      rrfTopK: hitsPerQuery,
      maxPerDoc: 1,
    });
    const filtered =
      plan.docTypes.length > 0
        ? hits.filter((hit) => pathMatchesDocTypes(hit.path, plan.docTypes))
        : hits;

    merged = mergeChunks(
      merged,
      filtered.map((hit) => hitToScored(hit, plan.sectionId)),
    );
  }

  return merged;
}

async function collectGlobalExpansionQueries(
  sectionChunksByPlan: ReadonlyArray<{ plan: FacetSearchPlan; chunks: ScoredChunk[] }>,
  options: PackBuilderOptions,
): Promise<string[]> {
  const expansion = options.graphExpansion;
  if (!expansion) return [];

  const seedNodeIds = [
    ...new Set(
      sectionChunksByPlan.flatMap(({ chunks }) => chunks.map((c) => c.docId)),
    ),
  ].slice(0, MAX_EXPANSION_SEEDS);

  if (seedNodeIds.length === 0) return [];

  const result = await expansion.expand({
    seedNodeIds,
    hops: options.expansionHops ?? DEFAULT_EXPANSION_HOPS,
    edgeTypes: DEFAULT_EXPANSION_EDGE_TYPES,
  });

  const entityTypesWanted = new Set(
    sectionChunksByPlan.flatMap(({ plan }) => plan.entityTypes),
  );

  const extraQueries: string[] = [];
  for (const node of result.nodes) {
    if (node.hop === 0) continue;
    if (entityTypesWanted.size > 0 && !entityTypesWanted.has(node.nodeType)) continue;
    if (entityTypesWanted.size === 0 && !isGtmNodeType(node.nodeType)) continue;
    const label = node.label?.trim();
    if (label) extraQueries.push(label);
  }

  return [...new Set(extraQueries)].slice(0, MAX_GLOBAL_EXPANSION_QUERIES);
}

function assignExpansionHits(
  hits: readonly HybridSearchHit[],
  facetPlans: readonly FacetSearchPlan[],
  sectionChunks: Map<PackSectionId, ScoredChunk[]>,
): void {
  for (const hit of hits) {
    const matchingPlans = facetPlans.filter((plan) => pathMatchesDocTypes(hit.path, plan.docTypes));
    const targets = matchingPlans.length > 0 ? matchingPlans : facetPlans;

    for (const plan of targets) {
      const existing = sectionChunks.get(plan.sectionId) ?? [];
      sectionChunks.set(
        plan.sectionId,
        mergeChunks(existing, [hitToScored(hit, plan.sectionId)]),
      );
    }
  }
}

/**
 * Builds a structured ContextPack from a brief using hybrid search and optional graph expansion.
 */
export async function buildContextPack(options: PackBuilderOptions): Promise<ContextPack> {
  const started = Date.now();
  const tokenBudget = options.tokenBudget ?? DEFAULT_PACK_TOKEN_BUDGET;
  const facetPlans = planFacets(options.brief);
  const usedChunkIds = new Set<string>();
  const sections = emptyPackSections();
  const facetsCovered: string[] = [];

  const sectionChunks = new Map<PackSectionId, ScoredChunk[]>();
  const sectionChunksByPlan: Array<{ plan: FacetSearchPlan; chunks: ScoredChunk[] }> = [];

  for (const plan of facetPlans) {
    const chunks = await searchForPlan(plan, options);
    sectionChunks.set(plan.sectionId, chunks);
    sectionChunksByPlan.push({ plan, chunks });
  }

  const expansionQueries = await collectGlobalExpansionQueries(sectionChunksByPlan, options);
  for (const query of expansionQueries) {
    const hits = await hybridSearch({
      query,
      embeddingProvider: options.embeddingProvider,
      searchStore: options.searchStore,
      rrfTopK: options.hitsPerQuery ?? 8,
      maxPerDoc: 1,
    });
    assignExpansionHits(hits, facetPlans, sectionChunks);
  }

  for (const plan of facetPlans) {
    const rawChunks = (sectionChunks.get(plan.sectionId) ?? []).filter(
      (c) => !usedChunkIds.has(c.chunkId),
    );
    const budget = sectionTokenBudget(tokenBudget, plan);
    const selected = applyTokenBudget(rawChunks, budget);
    for (const chunk of selected) {
      usedChunkIds.add(chunk.chunkId);
    }

    const packChunks = toSectionChunks(selected);
    sections[plan.sectionId] = {
      content: assembleSectionContent(packChunks),
      chunks: packChunks,
    };

    if (packChunks.length > 0) {
      facetsCovered.push(plan.sectionId);
    }
  }

  const tokenEstimate = PACK_SECTION_IDS.reduce(
    (sum, id) => sum + estimateTokens(sections[id].content),
    0,
  );

  return {
    brief: options.brief,
    sections,
    meta: {
      token_estimate: tokenEstimate,
      facets_covered: facetsCovered,
      duration_ms: Date.now() - started,
    },
  };
}
