import type { EdgeType, GraphExpansionResult } from "@kg/core";
import type { Pool } from "pg";

export class PostgresGraphExpansionStore {
  constructor(private readonly pool: Pool) {}

  async expand(params: {
    seedNodeIds: string[];
    hops: number;
    edgeTypes?: readonly EdgeType[];
  }): Promise<GraphExpansionResult> {
    const hops = Math.min(Math.max(params.hops, 1), 2);
    const seeds = params.seedNodeIds.filter(Boolean);
    if (seeds.length === 0) {
      return { seeds: [], hops, nodes: [], edges: [] };
    }

    const edgeTypes = params.edgeTypes?.length ? [...params.edgeTypes] : null;

    const nodeRows = await this.pool.query<{
      node_id: string;
      node_type: string;
      label: string | null;
      properties: Record<string, unknown>;
      hop: number;
    }>(
      `
      WITH RECURSIVE walk AS (
        SELECT s.seed_id AS current_id, 0 AS depth
        FROM unnest($1::text[]) AS s(seed_id)

        UNION

        SELECT
          CASE WHEN e.source_id = w.current_id THEN e.target_id ELSE e.source_id END,
          w.depth + 1
        FROM walk w
        JOIN edges e ON e.source_id = w.current_id OR e.target_id = w.current_id
        WHERE w.depth < $2
          AND ($3::text[] IS NULL OR e.edge_type = ANY($3))
      ),
      reached AS (
        SELECT current_id AS node_id, MIN(depth) AS hop
        FROM walk
        GROUP BY current_id
      )
      SELECT n.node_id, n.node_type, n.label, n.properties, r.hop
      FROM reached r
      JOIN nodes n ON n.node_id = r.node_id
      ORDER BY r.hop, n.node_id
      `,
      [seeds, hops, edgeTypes],
    );

    const edgeRows = await this.pool.query<{
      edge_id: string;
      source_id: string;
      target_id: string;
      edge_type: string;
      properties: Record<string, unknown>;
      hop: number;
    }>(
      `
      WITH RECURSIVE walk AS (
        SELECT s.seed_id AS current_id, 0 AS depth
        FROM unnest($1::text[]) AS s(seed_id)

        UNION

        SELECT
          CASE WHEN e.source_id = w.current_id THEN e.target_id ELSE e.source_id END,
          w.depth + 1
        FROM walk w
        JOIN edges e ON e.source_id = w.current_id OR e.target_id = w.current_id
        WHERE w.depth < $2
          AND ($3::text[] IS NULL OR e.edge_type = ANY($3))
      ),
      reached AS (
        SELECT current_id AS node_id, MIN(depth) AS hop
        FROM walk
        GROUP BY current_id
      )
      SELECT DISTINCT ON (e.edge_id)
        e.edge_id,
        e.source_id,
        e.target_id,
        e.edge_type,
        e.properties,
        GREATEST(rn_s.hop, rn_t.hop) AS hop
      FROM edges e
      JOIN reached rn_s ON rn_s.node_id = e.source_id
      JOIN reached rn_t ON rn_t.node_id = e.target_id
      WHERE ($3::text[] IS NULL OR e.edge_type = ANY($3))
      ORDER BY e.edge_id, GREATEST(rn_s.hop, rn_t.hop)
      `,
      [seeds, hops, edgeTypes],
    );

    return {
      seeds,
      hops,
      nodes: nodeRows.rows.map((row) => ({
        nodeId: row.node_id,
        nodeType: row.node_type,
        label: row.label,
        properties: row.properties ?? {},
        hop: row.hop,
      })),
      edges: edgeRows.rows.map((row) => ({
        edgeId: row.edge_id,
        sourceId: row.source_id,
        targetId: row.target_id,
        edgeType: row.edge_type,
        properties: row.properties ?? {},
        hop: row.hop,
      })),
    };
  }

  async resolveDocIdFromPath(path: string): Promise<string | null> {
    const result = await this.pool.query<{ doc_id: string }>(
      `SELECT doc_id FROM documents WHERE path = $1`,
      [path],
    );
    return result.rows[0]?.doc_id ?? null;
  }
}
