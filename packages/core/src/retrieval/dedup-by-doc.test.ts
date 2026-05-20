import { describe, expect, it } from "vitest";
import { dedupByDocId } from "./dedup-by-doc.js";
import type { HybridSearchHit } from "./types.js";

function hit(docId: string, chunkId: string, rrfScore: number): HybridSearchHit {
  return {
    docId,
    chunkId,
    path: `corpus/${docId}.md`,
    heading: "H",
    text: "t",
    score: 0.5,
    rrfScore,
  };
}

describe("dedupByDocId", () => {
  it("keeps top chunks per document sorted by rrfScore", () => {
    const result = dedupByDocId(
      [hit("a", "c1", 0.2), hit("a", "c2", 0.9), hit("b", "c3", 0.5)],
      1,
    );
    expect(result).toHaveLength(2);
    expect(result[0]?.chunkId).toBe("c2");
    expect(result[1]?.chunkId).toBe("c3");
  });

  it("allows multiple chunks per doc when maxPerDoc > 1", () => {
    const result = dedupByDocId([hit("a", "c1", 0.2), hit("a", "c2", 0.9)], 2);
    expect(result).toHaveLength(2);
  });
});
