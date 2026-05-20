export interface ChunkForIndexing {
  chunkId: string;
  text: string;
  heading: string;
}

export interface ChunkEmbeddingRecord {
  chunkId: string;
  embedding: readonly number[];
  model: string;
}

export interface ChunkIndexStore {
  listChunksForIndexing(options?: { unindexedOnly?: boolean }): Promise<ChunkForIndexing[]>;
  upsertEmbeddings(records: readonly ChunkEmbeddingRecord[]): Promise<void>;
  countMissingEmbeddings(): Promise<number>;
}
