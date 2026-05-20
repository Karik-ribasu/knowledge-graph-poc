import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import type { SearchStore } from "../ports/search-store.js";
import { dedupByDocId } from "./dedup-by-doc.js";
import { rrfFusion } from "./rrf-fusion.js";
import type { HybridSearchHit, RankedSearchHit, SearchFilters } from "./types.js";

export const DEFAULT_DENSE_LIMIT = 50;
export const DEFAULT_LEXICAL_LIMIT = 50;
export const DEFAULT_RRF_TOP_K = 20;

export interface HybridSearchOptions {
  query: string;
  embeddingProvider: EmbeddingProvider;
  searchStore: SearchStore;
  filters?: SearchFilters;
  denseLimit?: number;
  lexicalLimit?: number;
  rrfTopK?: number;
  maxPerDoc?: number;
}

export async function hybridSearch(options: HybridSearchOptions): Promise<HybridSearchHit[]> {
  const denseLimit = options.denseLimit ?? DEFAULT_DENSE_LIMIT;
  const lexicalLimit = options.lexicalLimit ?? DEFAULT_LEXICAL_LIMIT;
  const rrfTopK = options.rrfTopK ?? DEFAULT_RRF_TOP_K;

  const [queryVector] = await options.embeddingProvider.embed([options.query]);

  if (!queryVector) {
    throw new Error("Embedding provider returned no vector for query");
  }

  const [denseHits, lexicalHits] = await Promise.all([
    options.searchStore.searchDense(queryVector, denseLimit, options.filters),
    options.searchStore.searchLexical(options.query, lexicalLimit, options.filters),
  ]);

  const hitById = new Map<string, RankedSearchHit>();
  for (const hit of [...denseHits, ...lexicalHits]) {
    hitById.set(hit.chunkId, hit);
  }

  const fused = rrfFusion(
    [
      denseHits.map((hit) => ({ id: hit.chunkId })),
      lexicalHits.map((hit) => ({ id: hit.chunkId })),
    ],
    { topK: rrfTopK },
  );

  const merged: HybridSearchHit[] = fused
    .map((item) => {
      const hit = hitById.get(item.id);
      if (!hit) return null;
      return {
        ...hit,
        rrfScore: item.score,
      };
    })
    .filter((hit): hit is HybridSearchHit => hit !== null);

  return dedupByDocId(merged, options.maxPerDoc ?? 1);
}
