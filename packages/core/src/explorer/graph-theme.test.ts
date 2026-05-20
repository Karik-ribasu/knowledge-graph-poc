import { describe, expect, it } from "vitest";
import {
  computeLinkWidth,
  computeNodeVal,
  edgeColor,
  isDashedEdge,
  nodeColor,
} from "./graph-theme.js";

describe("graph-theme", () => {
  it("assigns palette colors by node and edge type", () => {
    expect(nodeColor("Document")).toBe("#3b82f6");
    expect(nodeColor("Competitor")).toBe("#ef4444");
    expect(nodeColor("Unknown")).toBe("#64748b");
    expect(edgeColor("mentions")).toBe("#a855f7");
    expect(isDashedEdge("mentions")).toBe(true);
    expect(isDashedEdge("contains")).toBe(false);
  });

  it("computes val with Document degree bonus", () => {
    const chunkVal = computeNodeVal(3, "Chunk");
    const docVal = computeNodeVal(3, "Document");
    expect(docVal).toBeGreaterThan(chunkVal);
    expect(computeNodeVal(0, "Product")).toBe(4);
  });

  it("computes link width from weight", () => {
    expect(computeLinkWidth(1)).toBeCloseTo(1 + Math.log(2));
    expect(computeLinkWidth()).toBeCloseTo(1 + Math.log(2));
  });
});
