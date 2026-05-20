import type {
  ChunkEmbeddingRecord,
  ChunkForIndexing,
  ChunkIndexStore,
} from "@kg/core";
import type { Pool } from "pg";

function vectorLiteral(values: readonly number[]): string {
  return `[${values.map((value) => String(value)).join(",")}]`;
}

export class PostgresChunkIndexStore implements ChunkIndexStore {
  constructor(private readonly pool: Pool) {}

  async listChunksForIndexing(options?: { unindexedOnly?: boolean }): Promise<ChunkForIndexing[]> {
    const unindexedOnly = options?.unindexedOnly ?? true;
    const result = await this.pool.query<{
      chunk_id: string;
      text: string;
      heading: string;
    }>(
      unindexedOnly
        ? `SELECT c.chunk_id, c.text, c.heading
           FROM chunks c
           LEFT JOIN chunk_embeddings ce ON ce.chunk_id = c.chunk_id
           WHERE ce.chunk_id IS NULL
           ORDER BY c.chunk_id`
        : `SELECT c.chunk_id, c.text, c.heading
           FROM chunks c
           ORDER BY c.chunk_id`,
    );

    return result.rows.map((row) => ({
      chunkId: row.chunk_id,
      text: row.text,
      heading: row.heading,
    }));
  }

  async upsertEmbeddings(records: readonly ChunkEmbeddingRecord[]): Promise<void> {
    if (records.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      for (const record of records) {
        await client.query(
          `INSERT INTO chunk_embeddings (chunk_id, embedding, model, created_at)
           VALUES ($1, $2::vector, $3, NOW())
           ON CONFLICT (chunk_id) DO UPDATE SET
             embedding = EXCLUDED.embedding,
             model = EXCLUDED.model,
             created_at = NOW()`,
          [record.chunkId, vectorLiteral(record.embedding), record.model],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async countMissingEmbeddings(): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM chunks c
       LEFT JOIN chunk_embeddings ce ON ce.chunk_id = c.chunk_id
       WHERE ce.chunk_id IS NULL`,
    );
    return Number.parseInt(result.rows[0]?.count ?? "0", 10);
  }
}
