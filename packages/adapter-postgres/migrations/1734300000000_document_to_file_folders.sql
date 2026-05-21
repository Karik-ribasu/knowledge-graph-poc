-- Migrate legacy Document nodes to File; safe to re-run.
UPDATE nodes SET node_type = 'File' WHERE node_type = 'Document';
