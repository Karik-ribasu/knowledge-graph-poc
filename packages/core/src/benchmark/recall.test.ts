import { describe, expect, it } from "vitest";
import { pathsMatch, recallAtK, summarizeRecall } from "./recall.js";

describe("recallAtK", () => {
  it("matches expected corpus paths in top-K", () => {
    const results = [
      { path: "corpus/market/foo.md" },
      { path: "corpus/business/bar.md" },
    ];
    expect(recallAtK(results, ["corpus/business/bar.md"], 10)).toBe(true);
    expect(recallAtK(results, ["corpus/technical/missing.md"], 10)).toBe(false);
  });
});

describe("pathsMatch", () => {
  it("matches suffix and prefix path variants", () => {
    expect(pathsMatch("corpus/a.md", "a.md")).toBe(true);
    expect(pathsMatch("a.md", "corpus/a.md")).toBe(true);
    expect(pathsMatch("corpus\\a.md", "corpus/a.md")).toBe(true);
  });
});

describe("summarizeRecall", () => {
  it("returns zero recall for empty rows", () => {
    expect(summarizeRecall([]).recallAt10).toBe(0);
  });

  it("computes recall@10 ratio", () => {
    const summary = summarizeRecall([
      { query: "q1", facet: "general", hit: true, topPaths: [] },
      { query: "q2", facet: "general", hit: false, topPaths: [] },
    ]);
    expect(summary.recallAt10).toBe(0.5);
  });
});
