export interface RecallEvalHit {
  path: string;
}

/** True if any expected path appears in the top-K result paths. */
export function recallAtK(
  results: readonly RecallEvalHit[],
  expectedPaths: readonly string[],
  k: number,
): boolean {
  const top = results.slice(0, k);
  return expectedPaths.some((expected) => top.some((hit) => pathsMatch(hit.path, expected)));
}

export function pathsMatch(resultPath: string, expectedPath: string): boolean {
  const normalizedResult = resultPath.replace(/\\/g, "/");
  const normalizedExpected = expectedPath.replace(/\\/g, "/");
  return (
    normalizedResult === normalizedExpected ||
    normalizedResult.endsWith(`/${normalizedExpected}`) ||
    normalizedExpected.endsWith(`/${normalizedResult}`)
  );
}

export interface RecallBenchmarkRow {
  query: string;
  facet: string;
  hit: boolean;
  topPaths: string[];
}

export interface RecallBenchmarkSummary {
  total: number;
  hits: number;
  recallAt10: number;
  rows: RecallBenchmarkRow[];
}

export function summarizeRecall(rows: readonly RecallBenchmarkRow[]): RecallBenchmarkSummary {
  const hits = rows.filter((row) => row.hit).length;
  const total = rows.length;
  return {
    total,
    hits,
    recallAt10: total === 0 ? 0 : hits / total,
    rows: [...rows],
  };
}
