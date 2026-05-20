import { describe, expect, it } from "vitest";
import type { RrfRankedItem } from "./rrf-fusion.js";
import { rrfFusion } from "./rrf-fusion.js";

describe("rrfFusion", () => {
  it("fuses two ranked lists with k=60", () => {
    const dense = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const lexical = [{ id: "b" }, { id: "d" }, { id: "a" }];

    const fused = rrfFusion([dense, lexical], { k: 60, topK: 4 });

    expect(fused[0]?.id).toBe("b");
    expect(fused.map((item) => item.id)).toContain("a");
    expect(fused.map((item) => item.id)).toContain("d");
  });

  it("ignores undefined slots in ranked lists", () => {
    const sparse: RrfRankedItem[] = [];
    sparse[1] = { id: "a" };
    const fused = rrfFusion([sparse], { k: 60 });
    expect(fused).toEqual([{ id: "a", score: expect.any(Number) }]);
  });

  it("prefers items appearing in both lists", () => {
    const listA = [{ id: "x" }, { id: "y" }];
    const listB = [{ id: "y" }, { id: "z" }];

    const fused = rrfFusion([listA, listB], { k: 60 });
    expect(fused[0]?.id).toBe("y");
  });
});
