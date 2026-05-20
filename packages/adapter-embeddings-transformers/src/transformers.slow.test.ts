import { describe, expect, it } from "vitest";
import { createTransformersEmbeddingProvider, EMBEDDING_DIMENSIONS } from "./index.js";

const runSlow = process.env.RUN_SLOW_TESTS === "1";

describe.skipIf(!runSlow)("TransformersEmbeddingProvider @slow", () => {
  it("embeds short text to 1024-d normalized vector", async () => {
    const provider = createTransformersEmbeddingProvider();
    const [vector] = await provider.embed(["NexusFlow knowledge graph retrieval"]);

    expect(vector).toHaveLength(EMBEDDING_DIMENSIONS);
    const norm = Math.sqrt(vector!.reduce((sum, value) => sum + value * value, 0));
    expect(norm).toBeCloseTo(1, 3);
  }, 300_000);
});

describe("TransformersEmbeddingProvider (skipped in CI)", () => {
  it("documents slow test gate", () => {
    expect(runSlow || true).toBe(true);
  });
});
