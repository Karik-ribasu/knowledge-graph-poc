import { describe, expect, it, vi } from "vitest";
import { HashEmbeddingProvider } from "../embeddings/hash-embedding-provider.js";
import type { GraphExpansionStore } from "../graph/graph-expansion.js";
import type { SearchStore } from "../ports/search-store.js";
import { buildContextPack } from "./pack-builder.js";
import type { Brief } from "./schema.js";
import { PACK_SECTION_IDS } from "./sections.js";
const brief: Brief = {
  product: "NexusFlow",
  audience: "Revenue Ops",
  goal: "Demo",
  tone: "Confiante",
  constraints: [],
  locale: "pt-BR",
};

type MockHit = {
  chunkId: string;
  docId: string;
  path: string;
  heading: string;
  text: string;
};

function mockSearchStore(
  hitsByQuery: Record<string, MockHit[]>,
  fallback: MockHit[] = [],
): SearchStore {
  return {
    searchDense: vi.fn(async () => []),
    searchLexical: vi.fn(async (query: string, limit: number) => {
      const key = Object.keys(hitsByQuery).find(
        (k) => query.toLowerCase().includes(k.toLowerCase()) || k === query,
      );
      const hits = key ? hitsByQuery[key]! : fallback;
      return hits.slice(0, limit).map((h, i) => ({
        ...h,
        score: 1 - i * 0.1,
      }));
    }),
  };
}

describe("PackBuilder", () => {
  it("assembles sections with provenance and dedups globally", async () => {
    const shared = {
      chunkId: "chunk-shared",
      docId: "doc-1",
      path: "corpus/business/proposta-valor.md",
      heading: "## Valor",
      text: "Proposta única",
    };

    const heroHit = {
      chunkId: "chunk-hero",
      docId: "doc-2",
      path: "corpus/business/visao.md",
      heading: "## Hero",
      text: "Headline forte",
    };

    const store = mockSearchStore(
      {
        "proposta de valor": [shared],
        headline: [heroHit, shared],
        nexusflow: [heroHit, shared],
      },
      [shared],
    );

    const pack = await buildContextPack({
      brief,
      embeddingProvider: new HashEmbeddingProvider(),
      searchStore: store,
      tokenBudget: 4000,
      hitsPerQuery: 5,
      artifactsOnly: false,
    });

    expect(pack.brief.product).toBe("NexusFlow");
    expect(pack.sections.hero.chunks.length).toBeGreaterThan(0);
    expect(pack.sections.hero.chunks[0]).toMatchObject({
      doc_id: expect.any(String),
      path: expect.stringContaining("corpus/"),
      heading: expect.any(String),
    });

    const allChunkIds = PACK_SECTION_IDS.flatMap((id) =>
      pack.sections[id].chunks.map((c) => c.chunk_id),
    );
    expect(new Set(allChunkIds).size).toBe(allChunkIds.length);
    expect(pack.meta.facets_covered.length).toBeGreaterThan(0);
    expect(pack.meta.token_estimate).toBeGreaterThan(0);
  });

  it("filters search hits by facet docTypes", async () => {
    const store = mockSearchStore({
      "preços planos tiers NexusFlow": [
        {
          chunkId: "biz",
          docId: "d1",
          path: "corpus/business/pricing.md",
          heading: "P",
          text: "business pricing",
        },
        {
          chunkId: "tech",
          docId: "d2",
          path: "corpus/technical/infra.md",
          heading: "T",
          text: "technical only",
        },
      ],
    });

    const pack = await buildContextPack({
      brief,
      embeddingProvider: new HashEmbeddingProvider(),
      searchStore: store,
      tokenBudget: 8000,
      artifactsOnly: false,
    });

    const pricingPaths = pack.sections.pricing.chunks.map((c) => c.path);
    expect(pricingPaths.every((p) => p.includes("corpus/business/"))).toBe(true);
  });

  it("runs a single global graph expansion when store provided", async () => {
    const expansion: GraphExpansionStore = {
      expand: vi.fn(async () => ({
        seeds: ["doc-1"],
        hops: 2,
        nodes: [
          {
            nodeId: "doc-1",
            nodeType: "Document",
            label: null,
            properties: {},
            hop: 0,
          },
          {
            nodeId: "entity:ProofPoint:case-a",
            nodeType: "ProofPoint",
            label: "Case ACME 40% faster",
            properties: {},
            hop: 1,
          },
        ],
        edges: [],
      })),
    };

    const store = mockSearchStore({
      cases: [
        {
          chunkId: "proof-1",
          docId: "doc-proof",
          path: "corpus/market/cases.md",
          heading: "## Case",
          text: "ACME reduziu tempo em 40%",
        },
      ],
      "Case ACME": [
        {
          chunkId: "proof-1",
          docId: "doc-proof",
          path: "corpus/market/cases.md",
          heading: "## Case",
          text: "ACME reduziu tempo em 40%",
        },
      ],
    });

    const pack = await buildContextPack({
      brief,
      embeddingProvider: new HashEmbeddingProvider(),
      searchStore: store,
      graphExpansion: expansion,
      artifactsOnly: false,
    });

    expect(expansion.expand).toHaveBeenCalledTimes(1);
    expect(pack.meta.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it("artifactsOnly excludes corpus paths", async () => {
    const store = mockSearchStore({
      tagline: [
        {
          chunkId: "art-1",
          docId: "a1",
          path: "artifacts/artifacts/add-venture/agents/value-proposition-designer/vol-3-value-proposition.md",
          heading: "Tagline",
          text: "Inteligência antes do apito.",
        },
        {
          chunkId: "corpus-1",
          docId: "c1",
          path: "corpus/business/visao.md",
          heading: "Hero",
          text: "NexusFlow headline",
        },
      ],
    });

    const b4uBrief: Brief = {
      product: "B4U.bet",
      audience: "Torcedores BR",
      goal: "Waitlist",
      tone: "Editorial",
      constraints: [],
      locale: "pt-BR",
    };

    const pack = await buildContextPack({
      brief: b4uBrief,
      embeddingProvider: new HashEmbeddingProvider(),
      searchStore: store,
      tokenBudget: 4000,
      artifactsOnly: true,
    });

    expect(pack.meta.source).toBe("artifacts");
    const paths = pack.sections.hero.chunks.map((c) => c.path);
    expect(paths.every((p) => p.startsWith("artifacts/artifacts/"))).toBe(true);
    expect(paths.some((p) => p.includes("corpus/"))).toBe(false);
  });
});
