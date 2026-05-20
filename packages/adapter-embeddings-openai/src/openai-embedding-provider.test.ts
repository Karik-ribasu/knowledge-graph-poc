import { describe, expect, it } from "vitest";
import { createOpenAiEmbeddingProvider } from "./index.js";

describe("OpenAiEmbeddingProvider", () => {
  it("reports configured=false without API key", () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const provider = createOpenAiEmbeddingProvider();
    expect(provider.configured).toBe(false);

    if (previous) {
      process.env.OPENAI_API_KEY = previous;
    }
  });

  it("throws embed without API key", async () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const provider = createOpenAiEmbeddingProvider();
    await expect(provider.embed(["test"])).rejects.toThrow(/OPENAI_API_KEY/i);

    if (previous) {
      process.env.OPENAI_API_KEY = previous;
    }
  });

  it.skipIf(!process.env.OPENAI_API_KEY)("embeds when OPENAI_API_KEY is set", async () => {
    const provider = createOpenAiEmbeddingProvider();
    const [vector] = await provider.embed(["teste de embedding"]);
    expect(vector).toHaveLength(1024);
  });
});
