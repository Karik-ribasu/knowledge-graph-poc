import type { HybridSearchHit } from "./types.js";

/** Keep the highest-scoring chunk per document (POC default: 1 chunk per doc). */
export function dedupByDocId(
  hits: readonly HybridSearchHit[],
  maxPerDoc = 1,
): HybridSearchHit[] {
  const perDoc = new Map<string, HybridSearchHit[]>();

  for (const hit of hits) {
    const existing = perDoc.get(hit.docId) ?? [];
    existing.push(hit);
    perDoc.set(hit.docId, existing);
  }

  const result: HybridSearchHit[] = [];
  for (const group of perDoc.values()) {
    const sorted = [...group].sort((left, right) => right.rrfScore - left.rrfScore);
    result.push(...sorted.slice(0, maxPerDoc));
  }

  return result.sort((left, right) => right.rrfScore - left.rrfScore);
}
