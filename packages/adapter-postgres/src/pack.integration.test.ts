import { join } from "node:path";
import {
  buildContextPack,
  contextPackSchema,
  HashEmbeddingProvider,
  indexChunks,
  ingestWorkspace,
  parseBriefJson,
} from "@kg/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPool } from "./client.js";
import { startIntegrationDb, type IntegrationDbHandle } from "./integration-db.js";
import { PostgresChunkIndexStore } from "./repositories/chunk-index-repository.js";
import { PostgresGraphExpansionStore } from "./repositories/graph-expansion-repository.js";
import { PostgresGraphStore } from "./repositories/graph-repository.js";
import { PostgresSearchStore } from "./repositories/search-repository.js";

const repoRoot = join(import.meta.dirname, "../../..");

const sampleBrief = {
  product: "NexusFlow",
  audience: "Revenue Ops enterprise",
  goal: "Agendar demo",
  tone: "Confiante, técnico-leve",
  constraints: [],
  locale: "pt-BR",
};

describe("buildContextPack (integration)", () => {
  let db: IntegrationDbHandle;

  beforeAll(async () => {
    db = await startIntegrationDb();
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it("returns schema-valid pack with corpus provenance", async () => {
    const pool = createPool(db.databaseUrl);
    const store = new PostgresGraphStore(pool);
    const searchStore = new PostgresSearchStore(pool);
    const graphExpansion = new PostgresGraphExpansionStore(pool);
    const embeddingProvider = new HashEmbeddingProvider();

    try {
      await ingestWorkspace({
        workspaceRoot: repoRoot,
        corpusDir: join(repoRoot, "corpus"),
        store,
      });

      await indexChunks({
        indexStore: new PostgresChunkIndexStore(pool),
        embeddingProvider,
        unindexedOnly: true,
      });

      const pack = await buildContextPack({
        brief: parseBriefJson(sampleBrief),
        embeddingProvider,
        searchStore,
        graphExpansion,
        hitsPerQuery: 10,
      });

      const parsed = contextPackSchema.parse(pack);
      expect(parsed.meta.facets_covered).toContain("value_prop");
      expect(parsed.sections.hero.chunks.length).toBeGreaterThan(0);
      expect(parsed.sections.value_prop.chunks[0]?.path.startsWith("corpus/")).toBe(true);
      expect(parsed.meta.duration_ms).toBeLessThan(120_000);
    } finally {
      await pool.end();
    }
  }, 180_000);
});
