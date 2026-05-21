import { describe, expect, it } from "vitest";
import {
  DEFAULT_NODE_VAL_K,
  computeLinkWidth,
  computeNodeVal,
  edgeColor,
  isDashedEdge,
  nodeColor,
} from "./graph-theme.js";

describe("graph-theme", () => {
  it("assigns palette colors by node and edge type", () => {
    expect(nodeColor("File")).toBe("#4fc3f7");
    expect(nodeColor("Folder")).toBe("#c5c5c5");
    expect(nodeColor("Competitor")).toBe("#ef4444");
    expect(nodeColor("Unknown")).toBe("#64748b");
    expect(edgeColor("mentions")).toBe("#a855f7");
    expect(isDashedEdge("mentions")).toBe(true);
    expect(isDashedEdge("contains")).toBe(false);
  });

  it("computes val with File degree bonus", () => {
    const chunkVal = computeNodeVal(3, "Chunk");
    const docVal = computeNodeVal(3, "File");
    expect(docVal).toBeGreaterThan(chunkVal);
    expect(computeNodeVal(0, "Product")).toBe(DEFAULT_NODE_VAL_K);
  });

  it("computes link width from weight", () => {
    expect(computeLinkWidth(1)).toBeCloseTo(0.55 + 0.2 * Math.log(2));
    expect(computeLinkWidth()).toBeCloseTo(0.55 + 0.2 * Math.log(2));
  });
});
