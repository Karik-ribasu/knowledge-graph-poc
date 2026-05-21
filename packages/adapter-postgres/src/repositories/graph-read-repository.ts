import {
  computeNodeVal,
  decorateLink,
  decorateNode,
  type GraphLinkDTO,
  type GraphNodeDTO,
  type GraphReadPort,
  type GraphSearchHit,
  type GraphSnapshotDTO,
  type GraphSnapshotFilters,
  type NodeDetailDTO,
  type NodeDetailPort,
} from "@kg/core";
import type { Pool } from "pg";

interface NodeRow {
  node_id: string;
  node_type: string;
  label: string | null;
  properties: Record<string, unknown>;
}

interface EdgeRow {
  edge_id: string;
  source_id: string;
  target_id: string;
  edge_type: string;
  properties: Record<string, unknown>;
}

export class PostgresGraphReadRepository implements GraphReadPort, NodeDetailPort {
  constructor(
    private readonly pool: Pool,
    private readonly defaults: { maxNodes: number; maxEdges: number } = {
      maxNodes: 300,
      maxEdges: 600,
    },
  ) {}

  async getSnapshot(filters: GraphSnapshotFilters): Promise<GraphSnapshotDTO> {
    const maxNodes = filters.maxNodes ?? this.defaults.maxNodes;
    const maxEdges = filters.maxEdges ?? this.defaults.maxEdges;

    const nodeRows =
      filters.seed !== undefined
        ? await this.fetchExpansionNodes(filters.seed, filters.hops ?? 1, filters, maxNodes)
        : await this.fetchFilteredNodes(filters, maxNodes);

    const nodeIds = nodeRows.map((r) => r.node_id);
    if (nodeIds.length === 0) {
      return { nodes: [], links: [], meta: { nodeCount: 0, edgeCount: 0 } };
    }

    const degrees = await this.fetchDegrees(nodeIds);
    const nodes: GraphNodeDTO[] = nodeRows.map((row) => {
      const degree = degrees.get(row.node_id) ?? 0;
      const base = {
        id: row.node_id,
        label: row.label ?? row.node_id,
        type: row.node_type,
        val: computeNodeVal(degree, row.node_type),
      };
      return decorateNode(base);
    });

    const edgeRows = await this.fetchEdgesBetween(nodeIds, maxEdges);
    const links: GraphLinkDTO[] = edgeRows.map((row) => {
      const weight =
        typeof row.properties?.weight === "number" ? row.properties.weight : 1;
      return decorateLink({
        source: row.source_id,
        target: row.target_id,
        type: row.edge_type,
        weight,
      });
    });

    const truncated = nodeRows.length >= maxNodes || edgeRows.length >= maxEdges;

    return {
      nodes,
      links,
      meta: {
        nodeCount: nodes.length,
        edgeCount: links.length,
        ...(truncated ? { truncated: true } : {}),
      },
    };
  }

  async searchNodes(query: string, limit: number): Promise<GraphSearchHit[]> {
    const pattern = `%${query.trim()}%`;
    const result = await this.pool.query<{
      node_id: string;
      node_type: string;
      label: string | null;
    }>(
      `
      SELECT node_id, node_type, label
      FROM nodes
      WHERE label ILIKE $1
         OR properties->>'path' ILIKE $1
         OR properties->>'name' ILIKE $1
      ORDER BY
        CASE WHEN label ILIKE $1 THEN 0 ELSE 1 END,
        label NULLS LAST,
        node_id
      LIMIT $2
      `,
      [pattern, limit],
    );

    return result.rows.map((row) => ({
      id: row.node_id,
      label: row.label ?? row.node_id,
      type: row.node_type,
    }));
  }

  async getNodeDetail(nodeId: string): Promise<NodeDetailDTO | null> {
    const nodeResult = await this.pool.query<NodeRow>(
      `SELECT node_id, node_type, label, properties
       FROM nodes WHERE node_id = $1`,
      [nodeId],
    );
    const nodeRow = nodeResult.rows[0];
    if (!nodeRow) return null;

    const edgesResult = await this.pool.query<EdgeRow>(
      `SELECT edge_id, source_id, target_id, edge_type, properties
       FROM edges
       WHERE source_id = $1 OR target_id = $1
       ORDER BY edge_type, edge_id`,
      [nodeId],
    );

    const incidentEdges = edgesResult.rows.map((row) => ({
      edgeId: row.edge_id,
      sourceId: row.source_id,
      targetId: row.target_id,
      edgeType: row.edge_type,
      direction: row.source_id === nodeId ? ("outgoing" as const) : ("incoming" as const),
      properties: row.properties ?? {},
    }));

    const relatedChunks = await this.fetchRelatedChunks(nodeId, nodeRow.node_type);
    const relatedDocuments = await this.fetchRelatedDocuments(nodeId, nodeRow.node_type);

    return {
      node: {
        id: nodeRow.node_id,
        label: nodeRow.label ?? nodeRow.node_id,
        type: nodeRow.node_type,
        properties: nodeRow.properties ?? {},
      },
      incidentEdges,
      relatedChunks,
      relatedDocuments,
    };
  }

  private async fetchFilteredNodes(
    filters: GraphSnapshotFilters,
    maxNodes: number,
  ): Promise<NodeRow[]> {
    const nodeTypes = filters.nodeTypes?.length ? [...filters.nodeTypes] : null;
    const docType = filters.docType ?? null;

    const result = await this.pool.query<NodeRow>(
      `
      SELECT n.node_id, n.node_type, n.label, n.properties
      FROM nodes n
      LEFT JOIN documents d ON d.doc_id = n.node_id AND n.node_type IN ('File', 'Document')
      WHERE ($1::text[] IS NULL OR n.node_type = ANY($1))
        AND ($2::text IS NULL OR d.doc_type = $2 OR n.node_type NOT IN ('File', 'Document'))
      ORDER BY n.node_type, n.node_id
      LIMIT $3
      `,
      [nodeTypes, docType, maxNodes],
    );
    return result.rows;
  }

  private async fetchExpansionNodes(
    seed: string,
    hops: number,
    filters: GraphSnapshotFilters,
    maxNodes: number,
  ): Promise<NodeRow[]> {
    const boundedHops = Math.min(Math.max(hops, 0), 2);
    const nodeTypes = filters.nodeTypes?.length ? [...filters.nodeTypes] : null;
    const docType = filters.docType ?? null;

    const result = await this.pool.query<NodeRow & { hop: number }>(
      `
      WITH RECURSIVE walk AS (
        SELECT $1::text AS current_id, 0 AS depth
        UNION
        SELECT
          CASE WHEN e.source_id = w.current_id THEN e.target_id ELSE e.source_id END,
          w.depth + 1
        FROM walk w
        JOIN edges e ON e.source_id = w.current_id OR e.target_id = w.current_id
        WHERE w.depth < $2
      ),
      reached AS (
        SELECT current_id AS node_id, MIN(depth) AS hop
        FROM walk
        GROUP BY current_id
      )
      SELECT n.node_id, n.node_type, n.label, n.properties, r.hop
      FROM reached r
      JOIN nodes n ON n.node_id = r.node_id
      LEFT JOIN documents d ON d.doc_id = n.node_id AND n.node_type IN ('File', 'Document')
      WHERE ($3::text[] IS NULL OR n.node_type = ANY($3))
        AND ($4::text IS NULL OR d.doc_type = $4 OR n.node_type NOT IN ('File', 'Document'))
      ORDER BY r.hop, n.node_id
      LIMIT $5
      `,
      [seed, boundedHops, nodeTypes, docType, maxNodes],
    );
    return result.rows;
  }

  private async fetchDegrees(nodeIds: string[]): Promise<Map<string, number>> {
    if (nodeIds.length === 0) return new Map();

    const result = await this.pool.query<{ node_id: string; degree: string }>(
      `
      SELECT n.node_id,
        (
          SELECT COUNT(*)::text
          FROM edges e
          WHERE e.source_id = n.node_id OR e.target_id = n.node_id
        ) AS degree
      FROM unnest($1::text[]) AS n(node_id)
      `,
      [nodeIds],
    );

    const map = new Map<string, number>();
    for (const row of result.rows) {
      map.set(row.node_id, Number.parseInt(row.degree, 10));
    }
    return map;
  }

  private async fetchEdgesBetween(nodeIds: string[], maxEdges: number): Promise<EdgeRow[]> {
    const result = await this.pool.query<EdgeRow>(
      `
      SELECT edge_id, source_id, target_id, edge_type, properties
      FROM edges
      WHERE source_id = ANY($1::text[])
        AND target_id = ANY($1::text[])
      ORDER BY edge_type, edge_id
      LIMIT $2
      `,
      [nodeIds, maxEdges],
    );
    return result.rows.map((row) => ({
      ...row,
      properties: row.properties ?? {},
    }));
  }

  private async fetchRelatedChunks(
    nodeId: string,
    nodeType: string,
  ): Promise<NodeDetailDTO["relatedChunks"]> {
    if (nodeType === "Chunk") {
      const row = await this.pool.query<{
        chunk_id: string;
        doc_id: string;
        heading: string | null;
        text: string;
        path: string | null;
      }>(
        `
        SELECT c.chunk_id, c.doc_id, c.heading, c.text, d.path
        FROM chunks c
        LEFT JOIN documents d ON d.doc_id = c.doc_id
        WHERE c.chunk_id = $1
        `,
        [nodeId],
      );
      const chunk = row.rows[0];
      if (!chunk) return [];
      return [
        {
          chunkId: chunk.chunk_id,
          docId: chunk.doc_id,
          path: chunk.path,
          heading: chunk.heading,
          snippet: truncate(chunk.text, 500),
        },
      ];
    }

    if (nodeType === "Section") {
      const row = await this.pool.query<{
        chunk_id: string;
        doc_id: string;
        heading: string | null;
        text: string;
        path: string | null;
      }>(
        `
        SELECT c.chunk_id, c.doc_id, c.heading, c.text, d.path
        FROM chunks c
        LEFT JOIN documents d ON d.doc_id = c.doc_id
        WHERE c.section_id = $1
        ORDER BY c.chunk_id
        LIMIT 20
        `,
        [nodeId],
      );
      return row.rows.map((chunk) => ({
        chunkId: chunk.chunk_id,
        docId: chunk.doc_id,
        path: chunk.path,
        heading: chunk.heading,
        snippet: truncate(chunk.text, 400),
      }));
    }

    if (nodeType === "File" || nodeType === "Document") {
      const row = await this.pool.query<{
        chunk_id: string;
        doc_id: string;
        heading: string | null;
        text: string;
        path: string | null;
      }>(
        `
        SELECT c.chunk_id, c.doc_id, c.heading, c.text, d.path
        FROM chunks c
        JOIN documents d ON d.doc_id = c.doc_id
        WHERE c.doc_id = $1
        ORDER BY c.chunk_id
        LIMIT 30
        `,
        [nodeId],
      );
      return row.rows.map((chunk) => ({
        chunkId: chunk.chunk_id,
        docId: chunk.doc_id,
        path: chunk.path,
        heading: chunk.heading,
        snippet: truncate(chunk.text, 300),
      }));
    }

    const mentionChunks = await this.pool.query<{
      chunk_id: string;
      doc_id: string;
      heading: string | null;
      text: string;
      path: string | null;
    }>(
      `
      SELECT DISTINCT c.chunk_id, c.doc_id, c.heading, c.text, d.path
      FROM edges e
      JOIN chunks c ON c.chunk_id = e.source_id
      LEFT JOIN documents d ON d.doc_id = c.doc_id
      WHERE e.target_id = $1 AND e.edge_type = 'mentions'
      ORDER BY c.chunk_id
      LIMIT 15
      `,
      [nodeId],
    );

    return mentionChunks.rows.map((chunk) => ({
      chunkId: chunk.chunk_id,
      docId: chunk.doc_id,
      path: chunk.path,
      heading: chunk.heading,
      snippet: truncate(chunk.text, 400),
    }));
  }

  private async fetchRelatedDocuments(
    nodeId: string,
    nodeType: string,
  ): Promise<NodeDetailDTO["relatedDocuments"]> {
    if (nodeType === "File" || nodeType === "Document") {
      const row = await this.pool.query<{
        doc_id: string;
        path: string;
        title: string | null;
        doc_type: string | null;
      }>(
        `SELECT doc_id, path, title, doc_type FROM documents WHERE doc_id = $1`,
        [nodeId],
      );
      const doc = row.rows[0];
      if (!doc) return [];
      return [
        {
          docId: doc.doc_id,
          path: doc.path,
          title: doc.title,
          docType: doc.doc_type,
        },
      ];
    }

    const props = await this.pool.query<{ properties: Record<string, unknown> }>(
      `SELECT properties FROM nodes WHERE node_id = $1`,
      [nodeId],
    );
    const sourceDocId = props.rows[0]?.properties?.source_doc_id;
    if (typeof sourceDocId === "string") {
      const row = await this.pool.query<{
        doc_id: string;
        path: string;
        title: string | null;
        doc_type: string | null;
      }>(
        `SELECT doc_id, path, title, doc_type FROM documents WHERE doc_id = $1`,
        [sourceDocId],
      );
      const doc = row.rows[0];
      if (doc) {
        return [
          {
            docId: doc.doc_id,
            path: doc.path,
            title: doc.title,
            docType: doc.doc_type,
          },
        ];
      }
    }

    const viaChunks = await this.pool.query<{
      doc_id: string;
      path: string;
      title: string | null;
      doc_type: string | null;
    }>(
      `
      SELECT DISTINCT d.doc_id, d.path, d.title, d.doc_type
      FROM edges e
      JOIN chunks c ON c.chunk_id = e.source_id
      JOIN documents d ON d.doc_id = c.doc_id
      WHERE e.target_id = $1 AND e.edge_type = 'mentions'
      LIMIT 10
      `,
      [nodeId],
    );

    return viaChunks.rows.map((doc) => ({
      docId: doc.doc_id,
      path: doc.path,
      title: doc.title,
      docType: doc.doc_type,
    }));
  }
}

function truncate(text: string, maxLen: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}
