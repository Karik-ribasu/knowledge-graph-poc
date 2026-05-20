export interface SearchFilters {
  docType?: string;
}

export interface RankedSearchHit {
  chunkId: string;
  docId: string;
  path: string;
  heading: string;
  text: string;
  score: number;
}

export interface HybridSearchHit extends RankedSearchHit {
  rrfScore: number;
}
