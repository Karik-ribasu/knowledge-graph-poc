export interface SearchFilters {
  docType?: string;
  /** Artifact pipeline modules (opportunity, add-venture, brand-aid). */
  module?: readonly string[];
  /** Only chunks whose document path starts with this prefix (e.g. artifacts/artifacts/). */
  pathPrefix?: string;
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
