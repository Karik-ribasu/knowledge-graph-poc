import { beforeEach, describe, expect, it, vi } from "vitest";

const mockExtractor = vi.fn(async (_text: string) => ({
  data: new Float32Array(1024).fill(0.1),
}));

vi.mock("@xenova/transformers", () => ({
  pipeline: vi.fn(async () => mockExtractor),
}));

describe("TransformersEmbeddingProvider", () => {
  beforeEach(() => {
    vi.resetModules();
    mockExtractor.mockClear();
  });

  it("embeds with mocked Xenova pipeline", async () => {
    const { createTransformersEmbeddingProvider } = await import("./index.js");
    const provider = createTransformersEmbeddingProvider();
    const vectors = await provider.embed(["hello", "world"]);
    expect(vectors).toHaveLength(2);
    expect(vectors[0]).toHaveLength(1024);
    expect(mockExtractor).toHaveBeenCalled();
  });

  it("throws when dimension mismatches", async () => {
    mockExtractor.mockResolvedValueOnce({ data: new Float32Array(8).fill(0) });
    const { createTransformersEmbeddingProvider } = await import("./index.js");
    const provider = createTransformersEmbeddingProvider();
    await expect(provider.embed(["x"])).rejects.toThrow(/dimension/i);
  });
});
