-- Up Migration: HNSW index for cosine similarity on embeddings
CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_hnsw
  ON chunk_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- Down Migration
DROP INDEX IF EXISTS idx_chunk_embeddings_hnsw;
