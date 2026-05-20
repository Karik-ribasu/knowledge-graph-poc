import type { RankedSearchHit, SearchFilters } from "../retrieval/types.js";

export interface SearchStore {
  searchDense(
    queryVector: readonly number[],
    limit: number,
    filters?: SearchFilters,
  ): Promise<RankedSearchHit[]>;

  searchLexical(query: string, limit: number, filters?: SearchFilters): Promise<RankedSearchHit[]>;
}
