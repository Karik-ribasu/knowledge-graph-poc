import { describe, expect, it } from "vitest";
import type { ChunkForIndexing, ChunkIndexStore } from "../ports/chunk-index-store.js";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import { indexChunks } from "./index-chunks.js";

describe("indexChunks", () => {
  it("embeds batches and upserts vectors", async () => {
    const chunks: ChunkForIndexing[] = [
      { chunkId: "c1", text: "one", heading: "H1" },
      { chunkId: "c2", text: "two", heading: "H2" },
    ];

    const upserted: number[] = [];
    const indexStore: ChunkIndexStore = {
      async listChunksForIndexing() {
        return chunks;
      },
      async upsertEmbeddings(records) {
        upserted.push(records.length);
      },
      async countMissingEmbeddings() {
        return 0;
      },
    };

    const embeddingProvider: EmbeddingProvider = {
      modelId: "mock",
      dimensions: 2,
      async embed(texts) {
        return texts.map((_, i) => [i, i + 1]);
      },
    };

    const stats = await indexChunks({
      indexStore,
      embeddingProvider,
    });

    expect(stats.chunksIndexed).toBe(2);
    expect(stats.batches).toBe(1);
    expect(upserted).toEqual([2]);
  });

  it("indexes with unindexedOnly=false", async () => {
    const chunks: ChunkForIndexing[] = [{ chunkId: "c1", text: "one", heading: "H" }];
    const indexStore: ChunkIndexStore = {
      async listChunksForIndexing(options) {
        expect(options?.unindexedOnly).toBe(false);
        return chunks;
      },
      async upsertEmbeddings() {},
      async countMissingEmbeddings() {
        return 0;
      },
    };
    const stats = await indexChunks({
      indexStore,
      embeddingProvider: {
        modelId: "m",
        dimensions: 2,
        async embed(texts) {
          return texts.map(() => [0, 1]);
        },
      },
      unindexedOnly: false,
    });
    expect(stats.chunksIndexed).toBe(1);
  });

  it("returns zero stats when no chunks need indexing", async () => {
    const indexStore: ChunkIndexStore = {
      async listChunksForIndexing() {
        return [];
      },
      async upsertEmbeddings() {},
      async countMissingEmbeddings() {
        return 0;
      },
    };
    const stats = await indexChunks({
      indexStore,
      embeddingProvider: {
        modelId: "mock",
        dimensions: 2,
        async embed() {
          return [];
        },
      },
    });
    expect(stats).toEqual({ chunksIndexed: 0, batches: 0 });
  });

  it("throws on embedding count mismatch", async () => {
    const indexStore: ChunkIndexStore = {
      async listChunksForIndexing() {
        return [{ chunkId: "c1", text: "one", heading: "H" }];
      },
      async upsertEmbeddings() {},
      async countMissingEmbeddings() {
        return 1;
      },
    };

    const embeddingProvider: EmbeddingProvider = {
      modelId: "mock",
      dimensions: 2,
      async embed() {
        return [];
      },
    };

    await expect(
      indexChunks({ indexStore, embeddingProvider }),
    ).rejects.toThrow(/mismatch/i);
  });
});
