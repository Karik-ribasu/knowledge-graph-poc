import { describe, expect, it } from "vitest";
import { expandGraphInMemory, parseExpansionSeed } from "./graph-expansion.js";

describe("expandGraphInMemory", () => {
  const nodes = [
    { nodeId: "doc1", nodeType: "Document", label: "Doc", properties: {} },
    { nodeId: "prod1", nodeType: "Product", label: "NexusFlow", properties: {} },
    { nodeId: "comp1", nodeType: "Competitor", label: "Notion", properties: {} },
    { nodeId: "comp2", nodeType: "Competitor", label: "Guru", properties: {} },
  ];

  const edges = [
    {
      edgeId: "e1",
      sourceId: "doc1",
      targetId: "prod1",
      edgeType: "mentions",
    },
    {
      edgeId: "e2",
      sourceId: "prod1",
      targetId: "comp1",
      edgeType: "competesWith",
    },
    {
      edgeId: "e3",
      sourceId: "prod1",
      targetId: "comp2",
      edgeType: "competesWith",
    },
  ];

  it("expands 1 hop from document to product and competitors", () => {
    const result = expandGraphInMemory(nodes, edges, ["doc1"], 2);
    expect(result.nodes.map((n) => n.nodeId).sort()).toEqual(
      ["comp1", "comp2", "doc1", "prod1"].sort(),
    );
    expect(result.edges.length).toBeGreaterThanOrEqual(2);
  });

  it("parseExpansionSeed recognizes doc, entity, and raw ids", () => {
    expect(parseExpansionSeed("doc:abc")).toEqual({ kind: "doc", id: "abc" });
    expect(parseExpansionSeed("entity:Product:nexusflow")).toEqual({
      kind: "entity",
      id: "Product:nexusflow",
    });
    expect(parseExpansionSeed("raw-node")).toEqual({ kind: "node", id: "raw-node" });
  });

  it("filters by edge type and ignores unknown seeds", () => {
    const result = expandGraphInMemory(nodes, edges, ["missing", "doc1"], 2, ["mentions"]);
    expect(result.nodes.map((n) => n.nodeId)).toContain("doc1");
    expect(result.nodes.some((n) => n.nodeId === "comp1")).toBe(false);
  });

  it("limits to 1 hop when requested", () => {
    const result = expandGraphInMemory(nodes, edges, ["doc1"], 1);
    expect(result.nodes.map((n) => n.nodeId)).toContain("doc1");
    expect(result.nodes.map((n) => n.nodeId)).toContain("prod1");
    expect(result.nodes.some((n) => n.nodeId.startsWith("comp"))).toBe(false);
  });
});
