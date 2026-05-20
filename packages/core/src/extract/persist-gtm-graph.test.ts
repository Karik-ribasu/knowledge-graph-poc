import { describe, expect, it } from "vitest";
import type { EdgeRecord, NodeRecord } from "../domain/types.js";
import type { GraphStore } from "../ports/graph-store.js";
import { persistGtmGraph } from "./persist-gtm-graph.js";

class MemoryGraphStore implements GraphStore {
  nodes: NodeRecord[] = [];
  edges: EdgeRecord[] = [];

  async findDocumentByPath(): Promise<null> {
    return null;
  }
  async upsertDocument(): Promise<void> {}
  async deleteDocumentGraph(): Promise<void> {}
  async upsertSection(): Promise<void> {}
  async upsertChunk(): Promise<void> {}
  async upsertNode(node: NodeRecord): Promise<void> {
    this.nodes.push(node);
  }
  async upsertEdge(edge: EdgeRecord): Promise<void> {
    this.edges.push(edge);
  }
}

describe("persistGtmGraph", () => {
  it("creates relation endpoint nodes when missing from entities", async () => {
    const store = new MemoryGraphStore();
    await persistGtmGraph(store, "doc-rel", {
      entities: [],
      relations: [
        {
          edgeType: "competesWith",
          sourceType: "Product",
          sourceName: "A",
          targetType: "Competitor",
          targetName: "B",
          properties: {},
        },
      ],
    });
    expect(store.nodes.length).toBeGreaterThanOrEqual(2);
    expect(store.edges.some((e) => e.edgeType === "competesWith")).toBe(true);
  });

  it("upserts entities, mentions, and relation edges", async () => {
    const store = new MemoryGraphStore();
    const stats = await persistGtmGraph(store, "doc-abc", {
      entities: [
        { nodeType: "Product", name: "NexusFlow", properties: { source_doc_id: "doc-abc" } },
      ],
      relations: [
        {
          edgeType: "competesWith",
          sourceType: "Product",
          sourceName: "NexusFlow",
          targetType: "Competitor",
          targetName: "Notion AI",
          properties: {},
        },
      ],
    });

    expect(stats.gtmNodesWritten).toBeGreaterThan(0);
    expect(stats.gtmEdgesWritten).toBeGreaterThan(0);
    expect(store.edges.some((e) => e.edgeType === "mentions")).toBe(true);
    expect(store.edges.some((e) => e.edgeType === "competesWith")).toBe(true);

    const dupStats = await persistGtmGraph(store, "doc-dup", {
      entities: [
        { nodeType: "Product", name: "A", properties: {} },
        { nodeType: "Product", name: "A", properties: {} },
      ],
      relations: [],
    });
    expect(dupStats.gtmNodesWritten).toBe(1);
  });
});
