import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import type {
  ChunkRecord,
  DocumentRecord,
  EdgeRecord,
  NodeRecord,
  SectionRecord,
} from "../domain/types.js";
import type { GraphStore } from "../ports/graph-store.js";
import { ingestArtifacts } from "./ingest-artifacts.js";

class MemoryArtifactStore implements GraphStore {
  readonly documents = new Map<string, DocumentRecord & { contentHash: string }>();
  readonly chunks: ChunkRecord[] = [];
  readonly nodes: NodeRecord[] = [];
  readonly edges: EdgeRecord[] = [];

  async findDocumentByPath(path: string) {
    const doc = [...this.documents.values()].find((d) => d.path === path);
    return doc ? { docId: doc.docId, contentHash: doc.contentHash } : null;
  }

  async upsertDocument(doc: DocumentRecord): Promise<void> {
    this.documents.set(doc.docId, { ...doc, contentHash: doc.contentHash });
  }

  async deleteDocumentGraph(docId: string): Promise<void> {
    this.documents.delete(docId);
    for (let i = this.chunks.length - 1; i >= 0; i -= 1) {
      if (this.chunks[i]?.docId === docId) this.chunks.splice(i, 1);
    }
    for (let i = this.nodes.length - 1; i >= 0; i -= 1) {
      if (this.nodes[i]?.nodeId === docId) this.nodes.splice(i, 1);
    }
  }

  async upsertSection(_section: SectionRecord): Promise<void> {}

  async upsertChunk(chunk: ChunkRecord): Promise<void> {
    this.chunks.push(chunk);
  }

  async upsertNode(node: NodeRecord): Promise<void> {
    const idx = this.nodes.findIndex((n) => n.nodeId === node.nodeId);
    if (idx >= 0) this.nodes[idx] = node;
    else this.nodes.push(node);
  }

  async upsertEdge(edge: EdgeRecord): Promise<void> {
    const idx = this.edges.findIndex((e) => e.edgeId === edge.edgeId);
    if (idx >= 0) this.edges[idx] = edge;
    else this.edges.push(edge);
  }
}

describe("ingestArtifacts", () => {
  let root = "";

  afterEach(() => {
    root = "";
  });

  it("indexes json and volume markdown without agent nodes", async () => {
    root = await mkdtemp(join(tmpdir(), "kg-artifacts-"));
    const artifactsDir = join(root, "artifacts", "artifacts");
    await mkdir(join(artifactsDir, "_meta"), { recursive: true });
    await mkdir(join(artifactsDir, "opportunity", "agents", "scoring"), { recursive: true });
    await mkdir(join(artifactsDir, "add-venture", "agents", "analyst"), { recursive: true });
    await mkdir(join(artifactsDir, "add-venture", "agents", "dossier-composer"), {
      recursive: true,
    });

    await writeFile(
      join(artifactsDir, "_meta", "delivery-manifest.json"),
      JSON.stringify({
        delivery_id: "del-test",
        modules: ["opportunity", "add-venture"],
        venture: { venture_id: "v-1", opportunity_id: "opp-1" },
      }),
      "utf-8",
    );

    await writeFile(
      join(artifactsDir, "opportunity", "agents", "scoring", "opportunity-score.json"),
      JSON.stringify({ score: 82, rationale: "Strong market timing" }),
      "utf-8",
    );

    await writeFile(
      join(artifactsDir, "add-venture", "agents", "analyst", "vol-1-diagnosis.md"),
      "# Title\n\n## Why now\n\nTiming is right.\n\n## Problem\n\nFragmented tools.\n",
      "utf-8",
    );

    await writeFile(
      join(artifactsDir, "add-venture", "agents", "dossier-composer", "venture-dossier.json"),
      JSON.stringify({
        volume_artifacts: {
          vol_1: "artifacts/add-venture/agents/analyst/vol-1-diagnosis.md",
        },
      }),
      "utf-8",
    );

    const store = new MemoryArtifactStore();
    const stats = await ingestArtifacts({
      workspaceRoot: root,
      artifactsDir,
      store,
    });

    expect(stats.artifactsProcessed).toBeGreaterThanOrEqual(4);
    expect(stats.indexUnitsWritten).toBeGreaterThan(0);
    expect(store.nodes.every((n) => String(n.nodeType) !== "AgentRun")).toBe(true);
    expect(store.nodes.some((n) => n.nodeType === "Artifact")).toBe(true);
    expect(store.edges.some((e) => e.edgeType === "belongsToDelivery")).toBe(true);
    expect(store.edges.some((e) => e.edgeType === "aggregates")).toBe(true);
  });
});
