import { join } from "node:path";
import { createEntityExtractor, docIdFromPath, ingestWorkspace } from "@kg/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPool } from "./client.js";
import { startIntegrationDb, type IntegrationDbHandle } from "./integration-db.js";
import { PostgresGraphReadRepository } from "./repositories/graph-read-repository.js";
import { PostgresGraphStore } from "./repositories/graph-repository.js";

const repoRoot = join(import.meta.dirname, "../../..");

describe("PostgresGraphReadRepository (integration)", () => {
  let db: IntegrationDbHandle;

  beforeAll(async () => {
    db = await startIntegrationDb();
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it("returns snapshot, node detail, and search after corpus ingest", async () => {
    const pool = createPool(db.databaseUrl);
    const store = new PostgresGraphStore(pool);
    const graphRead = new PostgresGraphReadRepository(pool, {
      maxNodes: 500,
      maxEdges: 1000,
    });

    try {
      await ingestWorkspace({
        workspaceRoot: repoRoot,
        corpusDir: join(repoRoot, "corpus"),
        store,
        entityExtractor: createEntityExtractor("rules"),
      });

      const snapshot = await graphRead.getSnapshot({
        nodeTypes: ["Document", "Competitor", "Product"],
      });
      expect(snapshot.nodes.length).toBeGreaterThan(0);
      expect(snapshot.nodes.every((n) => n.val > 0 && n.color)).toBe(true);

      const competidoresPath = "corpus/market/competidores.md";
      const docId = docIdFromPath(competidoresPath);
      const expanded = await graphRead.getSnapshot({
        seed: docId,
        hops: 1,
        nodeTypes: ["Document", "Competitor", "Product", "Chunk"],
      });
      expect(expanded.nodes.some((n) => n.id === docId)).toBe(true);

      const detail = await graphRead.getNodeDetail(docId);
      expect(detail).not.toBeNull();
      expect(detail?.node.type).toBe("Document");
      expect(detail?.relatedDocuments.length).toBeGreaterThan(0);

      const hits = await graphRead.searchNodes("competidor", 5);
      expect(hits.length).toBeGreaterThan(0);
    } finally {
      await pool.end();
    }
  }, 120_000);
});
