import { createOpenAiEmbeddingProvider } from "@kg/adapter-embeddings-openai";
import { createTransformersEmbeddingProvider } from "@kg/adapter-embeddings-transformers";
import { HashEmbeddingProvider, type EmbeddingProvider } from "@kg/core";

export type EmbeddingProviderName = "hash" | "transformers" | "openai";

export function resolveEmbeddingProvider(name?: string): EmbeddingProvider {
  const selected = (name ?? process.env.EMBEDDING_PROVIDER ?? "hash").toLowerCase();

  switch (selected as EmbeddingProviderName) {
    case "hash":
      return new HashEmbeddingProvider();
    case "transformers":
      return createTransformersEmbeddingProvider();
    case "openai": {
      const provider = createOpenAiEmbeddingProvider();
      if (!provider.configured) {
        throw new Error("OPENAI_API_KEY is required when --provider openai");
      }
      return provider;
    }
    default:
      throw new Error(`Unknown embedding provider: ${selected}`);
  }
}
