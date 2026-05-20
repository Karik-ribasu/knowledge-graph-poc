import { describe, expect, it } from "vitest";
import { HashEmbeddingProvider } from "./hash-embedding-provider.js";

describe("HashEmbeddingProvider", () => {
  it("returns deterministic L2-normalized vectors of configured dimension", async () => {
    const provider = new HashEmbeddingProvider({ dimensions: 1024 });
    const [first, second, other] = await provider.embed([
      "proposta de valor",
      "proposta de valor",
      "outro texto",
    ]);

    expect(first).toHaveLength(1024);
    expect(second).toEqual(first);
    expect(other).not.toEqual(first);

    const norm = Math.sqrt(first!.reduce((sum, value) => sum + value * value, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it("supports custom model id", async () => {
    const provider = new HashEmbeddingProvider({ modelId: "hash-test" });
    expect(provider.modelId).toBe("hash-test");
  });
});
