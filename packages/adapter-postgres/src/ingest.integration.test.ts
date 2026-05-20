import { join } from "node:path";
import { ingestWorkspace } from "@kg/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPool } from "./client.js";
import { startIntegrationDb, type IntegrationDbHandle } from "./integration-db.js";
import {
  countChunksWithoutProvenance,
  getGraphCounts,
  PostgresGraphStore,
} from "./repositories/graph-repository.js";

const repoRoot = join(import.meta.dirname, "../../..");

describe("ingest corpus (integration)", () => {
  let db: IntegrationDbHandle;

  beforeAll(async () => {
    db = await startIntegrationDb();
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it("ingests corpus with P0 graph counts and full provenance", async () => {
    const pool = createPool(db.databaseUrl);
    const store = new PostgresGraphStore(pool);

    try {
      const stats = await ingestWorkspace({
        workspaceRoot: repoRoot,
        corpusDir: join(repoRoot, "corpus"),
        store,
      });

      expect(stats.documentsProcessed).toBeGreaterThanOrEqual(20);
      expect(stats.chunksWritten).toBeGreaterThan(0);
      expect(stats.gtmNodesWritten).toBeGreaterThan(0);
      expect(stats.gtmEdgesWritten).toBeGreaterThan(0);

      const counts = await getGraphCounts(pool);
      expect(counts.documents).toBeGreaterThanOrEqual(20);
      expect(counts.chunks).toBeGreaterThan(0);
      expect(counts.containsEdges).toBeGreaterThan(0);
      expect(counts.linksToEdges).toBeGreaterThan(0);
      expect(counts.nodes).toBeGreaterThanOrEqual(counts.documents);

      const missingProvenance = await countChunksWithoutProvenance(pool);
      expect(missingProvenance).toBe(0);

      const provenanceSample = await pool.query<{ chunk_id: string; path: string; heading: string }>(
        `SELECT c.chunk_id, d.path, c.heading
         FROM chunks c
         JOIN documents d ON d.doc_id = c.doc_id
         LIMIT 5`,
      );
      expect(provenanceSample.rows.every((r) => r.path && r.heading)).toBe(true);

      const second = await ingestWorkspace({
        workspaceRoot: repoRoot,
        corpusDir: join(repoRoot, "corpus"),
        store,
      });
      expect(second.documentsSkipped).toBe(counts.documents);
    } finally {
      await pool.end();
    }
  }, 120_000);
});
