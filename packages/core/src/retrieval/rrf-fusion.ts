export const DEFAULT_RRF_K = 60;

export interface RrfRankedItem {
  id: string;
}

export interface RrfFusionResult {
  id: string;
  score: number;
}

/**
 * Reciprocal Rank Fusion: score(d) = sum_i 1 / (k + rank_i(d)).
 * Ranks are 1-based within each list.
 */
export function rrfFusion(
  rankedLists: ReadonlyArray<readonly RrfRankedItem[]>,
  options?: { k?: number; topK?: number },
): RrfFusionResult[] {
  const k = options?.k ?? DEFAULT_RRF_K;
  const topK = options?.topK;
  const scores = new Map<string, number>();

  for (const list of rankedLists) {
    for (let index = 0; index < list.length; index += 1) {
      const item = list[index];
      if (!item) continue;
      const rank = index + 1;
      const increment = 1 / (k + rank);
      scores.set(item.id, (scores.get(item.id) ?? 0) + increment);
    }
  }

  const fused = [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((left, right) => right.score - left.score);

  if (topK !== undefined) {
    return fused.slice(0, topK);
  }
  return fused;
}
