import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXPANSION_EDGE_TYPES,
  GTM_EDGE_TYPES,
  GTM_NODE_TYPES,
  isGtmEdgeType,
  isGtmNodeType,
} from "./ontology.js";

describe("ontology", () => {
  it("validates GTM types and exposes expansion whitelist", () => {
    expect(isGtmNodeType("Product")).toBe(true);
    expect(isGtmNodeType("Unknown")).toBe(false);
    expect(isGtmEdgeType("mentions")).toBe(true);
    expect(isGtmEdgeType("invalid")).toBe(false);
    expect(DEFAULT_EXPANSION_EDGE_TYPES).toContain("linksTo");
    expect(GTM_NODE_TYPES.length).toBeGreaterThan(5);
    expect(GTM_EDGE_TYPES).toContain("competesWith");
  });
});
