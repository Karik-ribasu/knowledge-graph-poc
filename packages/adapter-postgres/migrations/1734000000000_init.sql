-- Up Migration
CREATE EXTENSION IF NOT EXISTS vector;

-- Schema version tracking (node-pg-migrate uses pgmigrations table automatically)

-- Placeholder tables for Phase 1+ (full schema stubs)
CREATE TABLE IF NOT EXISTS documents (
  doc_id TEXT PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  doc_type TEXT,
  title TEXT,
  content_hash TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sections (
  section_id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
  heading TEXT NOT NULL,
  level INT NOT NULL DEFAULT 2,
  ordinal INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chunks (
  chunk_id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
  section_id TEXT REFERENCES sections(section_id) ON DELETE SET NULL,
  heading TEXT,
  text TEXT NOT NULL,
  token_count INT,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_search_vector ON chunks USING GIN (search_vector);

CREATE TABLE IF NOT EXISTS chunk_embeddings (
  chunk_id TEXT PRIMARY KEY REFERENCES chunks(chunk_id) ON DELETE CASCADE,
  embedding vector(1024),
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nodes (
  node_id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL,
  label TEXT,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS edges (
  edge_id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES nodes(node_id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES nodes(node_id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);
CREATE INDEX IF NOT EXISTS idx_edges_type ON edges(edge_type);

-- Down Migration
DROP TABLE IF EXISTS edges;
DROP TABLE IF EXISTS nodes;
DROP TABLE IF EXISTS chunk_embeddings;
DROP TABLE IF EXISTS chunks;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS documents;
DROP EXTENSION IF EXISTS vector;
