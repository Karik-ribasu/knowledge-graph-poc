import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import type {
  ChunkRecord,
  DocumentRecord,
  EdgeRecord,
  NodeRecord,
  SectionRecord,
} from "../domain/types.js";
import type { GraphStore } from "../ports/graph-store.js";
import { ingestWorkspace } from "./ingest-workspace.js";

class InMemoryGraphStore implements GraphStore {
  documents = new Map<string, DocumentRecord>();
  sections = new Map<string, SectionRecord>();
  chunks = new Map<string, ChunkRecord>();
  nodes = new Map<string, NodeRecord>();
  edges = new Map<string, EdgeRecord>();

  async findDocumentByPath(path: string): Promise<{ docId: string; contentHash: string } | null> {
    for (const doc of this.documents.values()) {
      if (doc.path === path) {
        return { docId: doc.docId, contentHash: doc.contentHash };
      }
    }
    return null;
  }

  async upsertDocument(doc: DocumentRecord): Promise<void> {
    this.documents.set(doc.docId, doc);
  }

  async deleteDocumentGraph(docId: string): Promise<void> {
    this.documents.delete(docId);
    for (const [id, s] of this.sections) {
      if (s.docId === docId) this.sections.delete(id);
    }
    for (const [id, c] of this.chunks) {
      if (c.docId === docId) this.chunks.delete(id);
    }
    for (const [id, n] of this.nodes) {
      const sourceDocId = n.properties.source_doc_id;
      if (
        n.nodeId === docId ||
        sourceDocId === docId ||
        this.chunks.has(n.nodeId) ||
        this.sections.has(n.nodeId)
      ) {
        this.nodes.delete(id);
      }
    }
    for (const [id, e] of this.edges) {
      const sourceDocId = e.properties?.source_doc_id;
      if (e.sourceId === docId || e.targetId === docId || sourceDocId === docId) {
        this.edges.delete(id);
      }
    }
  }

  async upsertSection(section: SectionRecord): Promise<void> {
    this.sections.set(section.sectionId, section);
  }

  async upsertChunk(chunk: ChunkRecord): Promise<void> {
    this.chunks.set(chunk.chunkId, chunk);
  }

  async upsertNode(node: NodeRecord): Promise<void> {
    this.nodes.set(node.nodeId, node);
  }

  async upsertEdge(edge: EdgeRecord): Promise<void> {
    this.edges.set(edge.edgeId, edge);
  }
}

describe("ingestWorkspace", () => {
  it("walks workspace and upserts idempotently", async () => {
    const root = await mkdtemp(join(tmpdir(), "kg-ingest-"));
    const corpus = join(root, "corpus", "business");
    await mkdir(corpus, { recursive: true });
    const filePath = join(corpus, "a.md");
    await writeFile(
      filePath,
      `---
doc_type: business
title: Doc A
---
# Doc A

## One
Content with [[b]].

## Two
More.
`,
      "utf-8",
    );
    await writeFile(
      join(root, "corpus", "business", "b.md"),
      `---
doc_type: business
title: Doc B
---
# Doc B

## Only
Linked back [[a]].
`,
      "utf-8",
    );

    const store = new InMemoryGraphStore();
    const first = await ingestWorkspace({
      workspaceRoot: root,
      corpusDir: join(root, "corpus"),
      store,
    });
    expect(first.documentsProcessed).toBe(2);
    expect(first.chunksWritten).toBeGreaterThan(0);
    expect([...store.edges.values()].some((e) => e.edgeType === "linksTo")).toBe(true);

    const second = await ingestWorkspace({
      workspaceRoot: root,
      corpusDir: join(root, "corpus"),
      store,
    });
    expect(second.documentsSkipped).toBe(2);
    expect(second.documentsProcessed).toBe(0);

    await writeFile(filePath, `${await readFile(filePath, "utf-8")}\n\nUpdated.`, "utf-8");
    const third = await ingestWorkspace({
      workspaceRoot: root,
      corpusDir: join(root, "corpus"),
      store,
    });
    expect(third.documentsProcessed).toBe(1);
    expect(third.documentsDeleted).toBe(1);
  });

  it("resolves wikilinks by slug basename", async () => {
    const root = await mkdtemp(join(tmpdir(), "kg-wikilink-"));
    const corpus = join(root, "corpus", "business");
    await mkdir(corpus, { recursive: true });
    await writeFile(
      join(corpus, "target-doc.md"),
      `---
doc_type: business
title: Target
---
# Target
`,
      "utf-8",
    );
    await writeFile(
      join(corpus, "source.md"),
      `---
doc_type: business
title: Source
---
# Source

[[target-doc]]
`,
      "utf-8",
    );

    const store = new InMemoryGraphStore();
    await ingestWorkspace({
      workspaceRoot: root,
      corpusDir: join(root, "corpus"),
      store,
    });
    expect([...store.edges.values()].some((e) => e.edgeType === "linksTo")).toBe(true);
  });

  it("resolves wikilinks using slug without extension", async () => {
    const root = await mkdtemp(join(tmpdir(), "kg-slug-link-"));
    const corpus = join(root, "corpus", "business");
    await mkdir(corpus, { recursive: true });
    await writeFile(
      join(corpus, "my-target.md"),
      `---
doc_type: business
title: Target
---
# Target
`,
      "utf-8",
    );
    await writeFile(
      join(corpus, "source-slug.md"),
      `---
doc_type: business
title: Source
---
# Source

[[my-target]]
`,
      "utf-8",
    );

    const store = new InMemoryGraphStore();
    await ingestWorkspace({
      workspaceRoot: root,
      corpusDir: join(root, "corpus"),
      store,
    });
    expect([...store.edges.values()].some((e) => e.edgeType === "linksTo")).toBe(true);
  });
});
