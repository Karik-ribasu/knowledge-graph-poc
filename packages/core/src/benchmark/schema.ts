import { z } from "zod";

/** Facets used by Context Pack / landing planner (Phase 4). */
export const benchmarkFacetSchema = z.enum([
  "positioning",
  "persona",
  "pain",
  "differentiation",
  "proof",
  "pricing",
  "technical",
  "competitive",
  "onboarding",
  "general",
]);

export type BenchmarkFacet = z.infer<typeof benchmarkFacetSchema>;

export const benchmarkQuerySchema = z.object({
  query: z.string().min(1),
  expected_paths: z.array(z.string().min(1)).min(1),
  facet: benchmarkFacetSchema,
  notes: z.string().optional(),
});

export type BenchmarkQuery = z.infer<typeof benchmarkQuerySchema>;

export const benchmarkQueriesFileSchema = z.array(benchmarkQuerySchema).min(1);

/** Parse JSONL benchmark file (one JSON object per line, UTF-8). */
export function parseBenchmarkJsonl(content: string): BenchmarkQuery[] {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  const queries: BenchmarkQuery[] = [];
  for (const [index, line] of lines.entries()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`benchmark JSONL line ${String(index + 1)}: invalid JSON`);
    }
    const result = benchmarkQuerySchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`benchmark JSONL line ${String(index + 1)}: ${result.error.message}`);
    }
    queries.push(result.data);
  }

  return benchmarkQueriesFileSchema.parse(queries);
}
