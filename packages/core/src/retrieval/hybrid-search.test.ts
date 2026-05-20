import { describe, expect, it, vi } from "vitest";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import type { SearchStore } from "../ports/search-store.js";
import { hybridSearch } from "./hybrid-search.js";
import type { RankedSearchHit } from "./types.js";

const mockEmbedding: EmbeddingProvider = {
  modelId: "mock",
  dimensions: 4,
  async embed(texts) {
    return texts.map(() => [0.1, 0.2, 0.3, 0.4]);
  },
};

function ranked(id: string, docId: string, score: number): RankedSearchHit {
  return {
    chunkId: id,
    docId,
    path: `corpus/${docId}.md`,
    heading: "H",
    text: "body",
    score,
  };
}

describe("hybridSearch", () => {
  it("fuses dense and lexical lists with RRF and dedups by doc", async () => {
    const searchStore: SearchStore = {
      async searchDense() {
        return [ranked("a1", "doc-a", 0.9), ranked("b1", "doc-b", 0.8)];
      },
      async searchLexical() {
        return [ranked("a2", "doc-a", 0.7), ranked("c1", "doc-c", 0.6)];
      },
    };

    const hits = await hybridSearch({
      query: "pricing",
      embeddingProvider: mockEmbedding,
      searchStore,
      rrfTopK: 3,
    });

    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.rrfScore > 0)).toBe(true);
  });

  it("skips fused ids missing from hit map", async () => {
    const rrf = await import("./rrf-fusion.js");
    const spy = vi.spyOn(rrf, "rrfFusion").mockReturnValue([{ id: "missing", score: 0.9 }]);
    const hits = await hybridSearch({
      query: "q",
      embeddingProvider: mockEmbedding,
      searchStore: {
        async searchDense() {
          return [];
        },
        async searchLexical() {
          return [];
        },
      },
    });
    expect(hits).toEqual([]);
    spy.mockRestore();
  });

  it("throws when embedding provider returns no vector", async () => {
    const emptyEmbed: EmbeddingProvider = {
      modelId: "empty",
      dimensions: 4,
      async embed() {
        return [];
      },
    };

    await expect(
      hybridSearch({
        query: "x",
        embeddingProvider: emptyEmbed,
        searchStore: {
          async searchDense() {
            return [];
          },
          async searchLexical() {
            return [];
          },
        },
      }),
    ).rejects.toThrow(/no vector/i);
  });
});
