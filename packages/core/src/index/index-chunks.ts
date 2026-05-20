import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import type { ChunkIndexStore } from "../ports/chunk-index-store.js";

export interface IndexChunksOptions {
  indexStore: ChunkIndexStore;
  embeddingProvider: EmbeddingProvider;
  batchSize?: number;
  unindexedOnly?: boolean;
}

export interface IndexChunksStats {
  chunksIndexed: number;
  batches: number;
}

export async function indexChunks(options: IndexChunksOptions): Promise<IndexChunksStats> {
  const batchSize = options.batchSize ?? 16;
  const chunks = await options.indexStore.listChunksForIndexing({
    unindexedOnly: options.unindexedOnly ?? true,
  });

  let chunksIndexed = 0;
  let batches = 0;

  for (let offset = 0; offset < chunks.length; offset += batchSize) {
    const batch = chunks.slice(offset, offset + batchSize);
    if (batch.length === 0) continue;

    const texts = batch.map((chunk) => chunk.text);
    const vectors = await options.embeddingProvider.embed(texts);

    if (vectors.length !== batch.length) {
      throw new Error(
        `Embedding count mismatch: expected ${String(batch.length)}, got ${String(vectors.length)}`,
      );
    }

    await options.indexStore.upsertEmbeddings(
      batch.map((chunk, index) => ({
        chunkId: chunk.chunkId,
        embedding: vectors[index] ?? [],
        model: options.embeddingProvider.modelId,
      })),
    );

    chunksIndexed += batch.length;
    batches += 1;
  }

  return { chunksIndexed, batches };
}
