import { join } from "node:path";
import {
  createEntityExtractor,
  docIdFromPath,
  entityIdFromParts,
  ingestWorkspace,
  slugify,
} from "@kg/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPool } from "./client.js";
import { startIntegrationDb, type IntegrationDbHandle } from "./integration-db.js";
import { PostgresGraphExpansionStore } from "./repositories/graph-expansion-repository.js";
import { PostgresGraphStore } from "./repositories/graph-repository.js";

const repoRoot = join(import.meta.dirname, "../../..");

describe("GTM graph (integration)", () => {
  let db: IntegrationDbHandle;

  beforeAll(async () => {
    db = await startIntegrationDb();
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it("ingests GTM entities and expands from competidores doc", async () => {
    const pool = createPool(db.databaseUrl);
    const store = new PostgresGraphStore(pool);
    const expansion = new PostgresGraphExpansionStore(pool);

    try {
      const stats = await ingestWorkspace({
        workspaceRoot: repoRoot,
        corpusDir: join(repoRoot, "corpus"),
        store,
        entityExtractor: createEntityExtractor("rules"),
      });

      expect(stats.gtmNodesWritten).toBeGreaterThan(0);
      expect(stats.gtmEdgesWritten).toBeGreaterThan(0);

      const competitorCount = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM nodes WHERE node_type = 'Competitor'`,
      );
      expect(Number.parseInt(competitorCount.rows[0]?.count ?? "0", 10)).toBeGreaterThan(0);

      const competidoresPath = "corpus/market/competidores.md";
      const docId = docIdFromPath(competidoresPath);
      const expanded = await expansion.expand({
        seedNodeIds: [docId],
        hops: 2,
      });

      expect(expanded.nodes.length).toBeGreaterThan(1);
      expect(
        expanded.nodes.some(
          (n) => n.nodeType === "Competitor" || n.nodeType === "Product" || n.nodeType === "File",
        ),
      ).toBe(true);

      const notionId = entityIdFromParts("Competitor", "Notion AI", slugify);
      const entityExpand = await expansion.expand({
        seedNodeIds: [notionId],
        hops: 1,
      });
      expect(entityExpand.nodes.some((n) => n.nodeId === notionId)).toBe(true);
    } finally {
      await pool.end();
    }
  }, 120_000);
});
