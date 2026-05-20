import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPool, pingDatabase } from "./client.js";
import { startIntegrationDb, type IntegrationDbHandle } from "./integration-db.js";
import { runMigrations } from "./migrate.js";

describe("postgres adapter (integration)", () => {
  let db: IntegrationDbHandle;

  beforeAll(async () => {
    db = await startIntegrationDb();
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it("connects and pings database", async () => {
    const pool = createPool(db.databaseUrl);
    try {
      expect(await pingDatabase(pool)).toBe(true);
    } finally {
      await pool.end();
    }
  });

  it.skipIf(process.env.KG_TEST_USE_EXTERNAL_DB === "1")(
    "runs migrations up and down",
    async () => {
    const databaseUrl = db.databaseUrl;
    await runMigrations("up", databaseUrl);

    const pool = createPool(databaseUrl);
    try {
      const tables = await pool.query<{ tablename: string }>(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents'`,
      );
      expect(tables.rows).toHaveLength(1);

      const ext = await pool.query<{ extname: string }>(
        `SELECT extname FROM pg_extension WHERE extname = 'vector'`,
      );
      expect(ext.rows).toHaveLength(1);

      const hnsw = await pool.query<{ indexname: string }>(
        `SELECT indexname FROM pg_indexes
         WHERE schemaname = 'public' AND indexname = 'idx_chunk_embeddings_hnsw'`,
      );
      expect(hnsw.rows).toHaveLength(1);

      const gtmNodeTypeIdx = await pool.query<{ indexname: string }>(
        `SELECT indexname FROM pg_indexes
         WHERE schemaname = 'public' AND indexname = 'idx_nodes_node_type'`,
      );
      expect(gtmNodeTypeIdx.rows).toHaveLength(1);
    } finally {
      await pool.end();
    }

    await runMigrations("down", databaseUrl);
    await runMigrations("down", databaseUrl);
    await runMigrations("down", databaseUrl);

    const poolAfter = createPool(databaseUrl);
    try {
      const tables = await poolAfter.query<{ tablename: string }>(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents'`,
      );
      expect(tables.rows).toHaveLength(0);
    } finally {
      await poolAfter.end();
    }
  },
    120_000,
  );
});
