import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import {
  attachLineRangesToChunks,
  type ChunkRecord,
  type CorpusReadPort,
  type CorpusTreeNode,
  type FileContentDTO,
  normalizeCorpusPath,
} from "@kg/core";
import type { Pool } from "pg";

interface FileRow {
  node_id: string;
  path: string;
  label: string | null;
}

interface FolderRow {
  node_id: string;
  path: string;
  label: string | null;
}

export class PostgresCorpusReadRepository implements CorpusReadPort {
  constructor(
    private readonly pool: Pool,
    private readonly workspaceRoot: string,
  ) {}

  async getTree(): Promise<CorpusTreeNode> {
    const [folders, files] = await Promise.all([
      this.pool.query<FolderRow>(
        `SELECT node_id, properties->>'path' AS path, label
         FROM nodes WHERE node_type = 'Folder'
         ORDER BY properties->>'path'`,
      ),
      this.pool.query<FileRow>(
        `SELECT node_id, properties->>'path' AS path, label
         FROM nodes WHERE node_type IN ('File', 'Document')
         ORDER BY properties->>'path'`,
      ),
    ]);

    const root: CorpusTreeNode = {
      name: "corpus",
      path: "",
      kind: "folder",
      children: [],
    };
    const nodeByPath = new Map<string, CorpusTreeNode>();
    nodeByPath.set("", root);

    for (const row of folders.rows) {
      if (!row.path) continue;
      const node: CorpusTreeNode = {
        name: basename(row.path) || row.path,
        path: row.path,
        kind: "folder",
        nodeId: row.node_id,
        children: [],
      };
      nodeByPath.set(row.path, node);
    }

    for (const row of files.rows) {
      if (!row.path) continue;
      const node: CorpusTreeNode = {
        name: basename(row.path),
        path: row.path,
        kind: "file",
        nodeId: row.node_id,
      };
      nodeByPath.set(row.path, node);
    }

    const allPaths = [...nodeByPath.keys()].filter((p) => p.length > 0).sort();
    for (const path of allPaths) {
      const node = nodeByPath.get(path);
      if (!node) continue;
      const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
      const parent = nodeByPath.get(parentPath) ?? root;
      if (!parent.children) parent.children = [];
      if (!parent.children.some((c) => c.path === path)) {
        parent.children.push(node);
      }
    }

    const sortNodes = (nodes: CorpusTreeNode[]): void => {
      nodes.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      for (const n of nodes) {
        if (n.children) sortNodes(n.children);
      }
    };
    if (root.children) sortNodes(root.children);

    return root;
  }

  async getFileByPath(path: string): Promise<FileContentDTO | null> {
    const normalized = normalizeCorpusPath(path);
    const fileResult = await this.pool.query<{
      node_id: string;
      doc_id: string;
      path: string;
      title: string | null;
      doc_type: string | null;
    }>(
      `
      SELECT n.node_id, d.doc_id, d.path, d.title, d.doc_type
      FROM nodes n
      JOIN documents d ON d.doc_id = n.node_id
      WHERE n.node_type IN ('File', 'Document')
        AND (d.path = $1 OR n.properties->>'path' = $1)
      LIMIT 1
      `,
      [normalized],
    );
    const row = fileResult.rows[0];
    if (!row) return null;

    const absPath = resolve(this.workspaceRoot, row.path);
    let rawMarkdown = "";
    try {
      rawMarkdown = await readFile(absPath, "utf-8");
    } catch {
      return null;
    }

    const chunksResult = await this.pool.query<{
      chunk_id: string;
      section_id: string;
      heading: string | null;
      text: string;
      token_count: number | null;
    }>(
      `
      SELECT c.chunk_id, c.section_id, c.heading, c.text, c.token_count
      FROM chunks c
      WHERE c.doc_id = $1
      ORDER BY c.chunk_id
      `,
      [row.doc_id],
    );

    const chunkRecords: ChunkRecord[] = chunksResult.rows.map((c) => ({
      chunkId: c.chunk_id,
      docId: row.doc_id,
      sectionId: c.section_id,
      heading: c.heading ?? "",
      text: c.text,
      tokenCount: c.token_count ?? 0,
      path: row.path,
      startLine: 1,
      endLine: 1,
    }));
    const anchored = attachLineRangesToChunks(chunkRecords, rawMarkdown);

    return {
      path: row.path,
      docId: row.doc_id,
      fileNodeId: row.node_id,
      rawMarkdown,
      title: row.title,
      docType: row.doc_type,
      chunks: anchored.map((c) => ({
        chunkId: c.chunkId,
        sectionId: c.sectionId,
        heading: c.heading,
        startLine: c.startLine ?? 1,
        endLine: c.endLine ?? 1,
      })),
    };
  }
}
