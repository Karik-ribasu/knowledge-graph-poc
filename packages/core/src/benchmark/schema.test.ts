import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { benchmarkQuerySchema, parseBenchmarkJsonl } from "./schema.js";

const repoRoot = process.cwd();

describe("benchmarkQuerySchema", () => {
  it("accepts a valid query object", () => {
    const result = benchmarkQuerySchema.safeParse({
      query: "Qual a proposta de valor do NexusFlow?",
      expected_paths: ["corpus/business/visao-produto.md"],
      facet: "positioning",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty query", () => {
    const result = benchmarkQuerySchema.safeParse({
      query: "",
      expected_paths: ["corpus/x.md"],
      facet: "general",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid facet", () => {
    const result = benchmarkQuerySchema.safeParse({
      query: "test",
      expected_paths: ["corpus/x.md"],
      facet: "invalid_facet",
    });
    expect(result.success).toBe(false);
  });
});

describe("parseBenchmarkJsonl", () => {
  it("parses repository benchmark/queries.jsonl", () => {
    const content = readFileSync(join(repoRoot, "benchmark/queries.jsonl"), "utf-8");
    const queries = parseBenchmarkJsonl(content);
    expect(queries.length).toBeGreaterThanOrEqual(10);
    expect(queries.every((q) => q.expected_paths.length > 0)).toBe(true);
  });

  it("throws on invalid JSON line", () => {
    expect(() => parseBenchmarkJsonl("{ not json }")).toThrow(/invalid JSON/i);
  });

  it("throws on schema validation error", () => {
    const jsonl = '{"query":"","expected_paths":["a.md"],"facet":"general"}';
    expect(() => parseBenchmarkJsonl(jsonl)).toThrow(/line 1/i);
  });

  it("skips blank lines and comments", () => {
    const jsonl = `
# comment
{"query":"q1","expected_paths":["a.md"],"facet":"general"}

{"query":"q2","expected_paths":["b.md"],"facet":"persona"}
`;
    const queries = parseBenchmarkJsonl(jsonl);
    expect(queries).toHaveLength(2);
  });
});
