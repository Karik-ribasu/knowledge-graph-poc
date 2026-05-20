import type { RankedSearchHit, SearchFilters, SearchStore } from "@kg/core";
import type { Pool } from "pg";

function vectorLiteral(values: readonly number[]): string {
  return `[${values.map((value) => String(value)).join(",")}]`;
}

export class PostgresSearchStore implements SearchStore {
  constructor(private readonly pool: Pool) {}

  async searchDense(
    queryVector: readonly number[],
    limit: number,
    filters?: SearchFilters,
  ): Promise<RankedSearchHit[]> {
    const params: unknown[] = [vectorLiteral(queryVector), limit];
    let filterSql = "";

    if (filters?.docType) {
      params.push(filters.docType);
      filterSql = ` AND d.doc_type = $${String(params.length)}`;
    }

    const result = await this.pool.query<{
      chunk_id: string;
      doc_id: string;
      path: string;
      heading: string;
      text: string;
      score: number;
    }>(
      `SELECT c.chunk_id, c.doc_id, d.path, c.heading, c.text,
              1 - (ce.embedding <=> $1::vector) AS score
       FROM chunk_embeddings ce
       JOIN chunks c ON c.chunk_id = ce.chunk_id
       JOIN documents d ON d.doc_id = c.doc_id
       WHERE ce.embedding IS NOT NULL${filterSql}
       ORDER BY ce.embedding <=> $1::vector
       LIMIT $2`,
      [...params],
    );

    return result.rows.map((row) => ({
      chunkId: row.chunk_id,
      docId: row.doc_id,
      path: row.path,
      heading: row.heading,
      text: row.text,
      score: Number(row.score),
    }));
  }

  async searchLexical(
    query: string,
    limit: number,
    filters?: SearchFilters,
  ): Promise<RankedSearchHit[]> {
    const params: unknown[] = [query, limit];
    let filterSql = "";

    if (filters?.docType) {
      params.push(filters.docType);
      filterSql = ` AND d.doc_type = $${String(params.length)}`;
    }

    const result = await this.pool.query<{
      chunk_id: string;
      doc_id: string;
      path: string;
      heading: string;
      text: string;
      score: number;
    }>(
      `SELECT c.chunk_id, c.doc_id, d.path, c.heading, c.text,
              ts_rank_cd(c.search_vector, plainto_tsquery('portuguese', $1)) AS score
       FROM chunks c
       JOIN documents d ON d.doc_id = c.doc_id
       WHERE c.search_vector @@ plainto_tsquery('portuguese', $1)${filterSql}
       ORDER BY score DESC
       LIMIT $2`,
      [...params],
    );

    return result.rows.map((row) => ({
      chunkId: row.chunk_id,
      docId: row.doc_id,
      path: row.path,
      heading: row.heading,
      text: row.text,
      score: Number(row.score),
    }));
  }
}

/** Refresh Portuguese tsvector for chunks (ingest or reindex). */
export async function updateChunkLexicalIndex(
  pool: Pool,
  chunkIds?: readonly string[],
): Promise<number> {
  if (chunkIds && chunkIds.length > 0) {
    const result = await pool.query(
      `UPDATE chunks
       SET search_vector =
         setweight(to_tsvector('portuguese', coalesce(heading, '')), 'A') ||
         setweight(to_tsvector('portuguese', text), 'B')
       WHERE chunk_id = ANY($1::text[])`,
      [chunkIds],
    );
    return result.rowCount ?? 0;
  }

  const result = await pool.query(
    `UPDATE chunks
     SET search_vector =
       setweight(to_tsvector('portuguese', coalesce(heading, '')), 'A') ||
       setweight(to_tsvector('portuguese', text), 'B')`,
  );
  return result.rowCount ?? 0;
}
