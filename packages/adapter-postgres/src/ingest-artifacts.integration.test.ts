import { join } from "node:path";
import { ingestArtifacts } from "@kg/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPool } from "./client.js";
import { startIntegrationDb, type IntegrationDbHandle } from "./integration-db.js";
import { PostgresGraphStore } from "./repositories/graph-repository.js";

const repoRoot = join(import.meta.dirname, "../../..");

describe("ingest artifacts (integration)", () => {
  let db: IntegrationDbHandle;

  beforeAll(async () => {
    db = await startIntegrationDb();
  }, 120_000);

  afterAll(async () => {
    await db?.stop();
  });

  it("ingests artifacts/artifacts with artifact nodes and edges", async () => {
    const pool = createPool(db.databaseUrl);
    const store = new PostgresGraphStore(pool);

    try {
      const stats = await ingestArtifacts({
        workspaceRoot: repoRoot,
        artifactsDir: join(repoRoot, "artifacts", "artifacts"),
        store,
      });

      expect(stats.artifactsProcessed).toBeGreaterThan(10);
      expect(stats.indexUnitsWritten).toBeGreaterThan(0);
      expect(stats.nodesWritten).toBeGreaterThan(stats.artifactsProcessed);
      expect(stats.edgesWritten).toBeGreaterThan(0);

      const artifactNodes = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM nodes WHERE node_type = 'Artifact'`,
      );
      expect(Number(artifactNodes.rows[0]?.count ?? 0)).toBeGreaterThan(10);

      const aggregates = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM edges WHERE edge_type = 'aggregates'`,
      );
      expect(Number(aggregates.rows[0]?.count ?? 0)).toBeGreaterThan(0);

      const materializes = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM edges WHERE edge_type = 'materializes'`,
      );
      expect(Number(materializes.rows[0]?.count ?? 0)).toBeGreaterThan(0);

      const second = await ingestArtifacts({
        workspaceRoot: repoRoot,
        artifactsDir: join(repoRoot, "artifacts", "artifacts"),
        store,
      });
      expect(second.artifactsSkipped).toBe(stats.artifactsProcessed);
    } finally {
      await pool.end();
    }
  }, 120_000);
});
