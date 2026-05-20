import type {
  ChunkRecord,
  DocumentRecord,
  EdgeRecord,
  GraphStore,
  NodeRecord,
  SectionRecord,
} from "@kg/core";
import type { Pool } from "pg";

export class PostgresGraphStore implements GraphStore {
  constructor(private readonly pool: Pool) {}

  async findDocumentByPath(path: string): Promise<{ docId: string; contentHash: string } | null> {
    const result = await this.pool.query<{ doc_id: string; content_hash: string }>(
      `SELECT doc_id, content_hash FROM documents WHERE path = $1`,
      [path],
    );
    const row = result.rows[0];
    if (!row?.content_hash) return null;
    return { docId: row.doc_id, contentHash: row.content_hash };
  }

  async upsertDocument(doc: DocumentRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO documents (doc_id, path, doc_type, title, content_hash, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (doc_id) DO UPDATE SET
         path = EXCLUDED.path,
         doc_type = EXCLUDED.doc_type,
         title = EXCLUDED.title,
         content_hash = EXCLUDED.content_hash,
         updated_at = NOW()`,
      [doc.docId, doc.path, doc.docType, doc.title, doc.contentHash],
    );
  }

  async deleteDocumentGraph(docId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `DELETE FROM edges
         WHERE properties->>'source_doc_id' = $1
            OR source_id = $1 OR target_id = $1
            OR source_id IN (SELECT section_id FROM sections WHERE doc_id = $1)
            OR target_id IN (SELECT chunk_id FROM chunks WHERE doc_id = $1)
            OR source_id IN (SELECT chunk_id FROM chunks WHERE doc_id = $1)`,
        [docId],
      );
      await client.query(
        `DELETE FROM nodes
         WHERE properties->>'source_doc_id' = $1
            OR node_id = $1
            OR node_id IN (SELECT section_id FROM sections WHERE doc_id = $1)
            OR node_id IN (SELECT chunk_id FROM chunks WHERE doc_id = $1)`,
        [docId],
      );
      await client.query(`DELETE FROM chunks WHERE doc_id = $1`, [docId]);
      await client.query(`DELETE FROM sections WHERE doc_id = $1`, [docId]);
      await client.query(`DELETE FROM documents WHERE doc_id = $1`, [docId]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async upsertSection(section: SectionRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO sections (section_id, doc_id, heading, level, ordinal)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (section_id) DO UPDATE SET
         heading = EXCLUDED.heading,
         level = EXCLUDED.level,
         ordinal = EXCLUDED.ordinal`,
      [section.sectionId, section.docId, section.heading, section.level, section.ordinal],
    );
  }

  async upsertChunk(chunk: ChunkRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO chunks (chunk_id, doc_id, section_id, heading, text, token_count, search_vector)
       VALUES (
         $1, $2, $3, $4, $5, $6,
         setweight(to_tsvector('portuguese', coalesce($4, '')), 'A') ||
         setweight(to_tsvector('portuguese', $5), 'B')
       )
       ON CONFLICT (chunk_id) DO UPDATE SET
         section_id = EXCLUDED.section_id,
         heading = EXCLUDED.heading,
         text = EXCLUDED.text,
         token_count = EXCLUDED.token_count,
         search_vector =
           setweight(to_tsvector('portuguese', coalesce(EXCLUDED.heading, '')), 'A') ||
           setweight(to_tsvector('portuguese', EXCLUDED.text), 'B')`,
      [
        chunk.chunkId,
        chunk.docId,
        chunk.sectionId,
        chunk.heading,
        chunk.text,
        chunk.tokenCount,
      ],
    );
  }

  async upsertNode(node: NodeRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO nodes (node_id, node_type, label, properties)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (node_id) DO UPDATE SET
         node_type = EXCLUDED.node_type,
         label = EXCLUDED.label,
         properties = EXCLUDED.properties`,
      [node.nodeId, node.nodeType, node.label, JSON.stringify(node.properties)],
    );
  }

  async upsertEdge(edge: EdgeRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO edges (edge_id, source_id, target_id, edge_type, properties)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (edge_id) DO UPDATE SET
         source_id = EXCLUDED.source_id,
         target_id = EXCLUDED.target_id,
         edge_type = EXCLUDED.edge_type,
         properties = EXCLUDED.properties`,
      [
        edge.edgeId,
        edge.sourceId,
        edge.targetId,
        edge.edgeType,
        JSON.stringify(edge.properties ?? {}),
      ],
    );
  }
}

export interface GraphCounts {
  documents: number;
  sections: number;
  chunks: number;
  nodes: number;
  edges: number;
  containsEdges: number;
  linksToEdges: number;
}

export async function getGraphCounts(pool: Pool): Promise<GraphCounts> {
  const [documents, sections, chunks, nodes, edges, containsEdges, linksToEdges] =
    await Promise.all([
      pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM documents`),
      pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM sections`),
      pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM chunks`),
      pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM nodes`),
      pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM edges`),
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM edges WHERE edge_type = 'contains'`,
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM edges WHERE edge_type = 'linksTo'`,
      ),
    ]);

  const read = (result: { rows: { count: string }[] }): number =>
    Number.parseInt(result.rows[0]?.count ?? "0", 10);

  return {
    documents: read(documents),
    sections: read(sections),
    chunks: read(chunks),
    nodes: read(nodes),
    edges: read(edges),
    containsEdges: read(containsEdges),
    linksToEdges: read(linksToEdges),
  };
}

/** Chunks missing path (via documents) or heading fail provenance check. */
export async function countChunksWithoutProvenance(pool: Pool): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM chunks c
     LEFT JOIN documents d ON d.doc_id = c.doc_id
     WHERE d.path IS NULL OR c.heading IS NULL OR TRIM(c.heading) = ''`,
  );
  return Number.parseInt(result.rows[0]?.count ?? "0", 10);
}
