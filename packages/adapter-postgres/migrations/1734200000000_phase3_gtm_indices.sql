-- Up Migration: indexes for GTM graph queries (Phase 3)
CREATE INDEX IF NOT EXISTS idx_nodes_node_type ON nodes (node_type);
CREATE INDEX IF NOT EXISTS idx_nodes_source_doc ON nodes ((properties->>'source_doc_id'));
CREATE INDEX IF NOT EXISTS idx_edges_source_doc ON edges ((properties->>'source_doc_id'));

-- Down Migration
DROP INDEX IF EXISTS idx_edges_source_doc;
DROP INDEX IF EXISTS idx_nodes_source_doc;
DROP INDEX IF EXISTS idx_nodes_node_type;
