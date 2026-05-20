import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";
import type { EmbeddingProvider } from "@kg/core";
import { DEFAULT_EMBEDDING_DIMENSIONS } from "@kg/core";

export const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

export type OpenAiEmbeddingConfig = {
  apiKey?: string;
  model?: string;
  dimensions?: number;
};

export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly modelId: string;
  readonly dimensions: number;
  private readonly apiKey: string | undefined;

  constructor(config: OpenAiEmbeddingConfig = {}) {
    this.modelId = config.model ?? OPENAI_EMBEDDING_MODEL;
    this.dimensions = config.dimensions ?? DEFAULT_EMBEDDING_DIMENSIONS;
    this.apiKey = config.apiKey ?? process.env.OPENAI_API_KEY;
  }

  get configured(): boolean {
    return Boolean(this.apiKey);
  }

  async embed(texts: readonly string[]): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is required for OpenAI embeddings");
    }

    const openai = createOpenAI({ apiKey: this.apiKey });
    const { embeddings } = await embedMany({
      model: openai.embedding(this.modelId, { dimensions: this.dimensions }),
      values: [...texts],
    });

    return embeddings;
  }
}

export function createOpenAiEmbeddingProvider(
  config: OpenAiEmbeddingConfig = {},
): OpenAiEmbeddingProvider {
  return new OpenAiEmbeddingProvider(config);
}
