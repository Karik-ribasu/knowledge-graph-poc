import { join } from "node:path";
import {
  HashEmbeddingProvider,
  hybridSearch,
  indexChunks,
  ingestWorkspace,
} from "@kg/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPool } from "./client.js";
import { startIntegrationDb, type IntegrationDbHandle } from "./integration-db.js";
import { PostgresGraphStore } from "./repositories/graph-repository.js";
import { PostgresChunkIndexStore } from "./repositories/chunk-index-repository.js";
import { PostgresSearchStore } from "./repositories/search-repository.js";

const repoRoot = join(import.meta.dirname, "../../..");

describe("hybrid search (integration)", () => {
  let db: IntegrationDbHandle;

  beforeAll(async () => {
    db = await startIntegrationDb();
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it("indexes corpus with hash embeddings and returns hybrid hits", async () => {
    const pool = createPool(db.databaseUrl);
    const store = new PostgresGraphStore(pool);
    const indexStore = new PostgresChunkIndexStore(pool);
    const searchStore = new PostgresSearchStore(pool);
    const embeddingProvider = new HashEmbeddingProvider();

    try {
      await ingestWorkspace({
        workspaceRoot: repoRoot,
        corpusDir: join(repoRoot, "corpus"),
        store,
      });

      const indexStats = await indexChunks({
        indexStore,
        embeddingProvider,
        unindexedOnly: true,
      });
      expect(indexStats.chunksIndexed).toBeGreaterThan(0);

      const lexicalOnly = await searchStore.searchLexical("proposta de valor", 5);
      expect(lexicalOnly.length).toBeGreaterThan(0);

      const hits = await hybridSearch({
        query: "Qual é a proposta de valor do NexusFlow?",
        embeddingProvider,
        searchStore,
      });

      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0]?.path).toMatch(/corpus\//);
      expect(new Set(hits.map((hit) => hit.docId)).size).toBe(hits.length);
    } finally {
      await pool.end();
    }
  }, 120_000);

  it("ranks lexical matches above unrelated chunks for exact term", async () => {
    const pool = createPool(db.databaseUrl);
    const store = new PostgresGraphStore(pool);
    const searchStore = new PostgresSearchStore(pool);

    try {
      await ingestWorkspace({
        workspaceRoot: repoRoot,
        corpusDir: join(repoRoot, "corpus"),
        store,
      });

      const hits = await searchStore.searchLexical("pgvector", 10);
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.some((hit) => hit.path.includes("postgres-pgvector"))).toBe(true);
    } finally {
      await pool.end();
    }
  }, 120_000);
});
