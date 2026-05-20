import { readdir, readFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";
import { contentHash, docIdFromPath, edgeIdFromParts } from "../domain/ids.js";
import type {
  DocumentRecord,
  EdgeRecord,
  IngestStats,
  NodeRecord,
} from "../domain/types.js";
import { chunkDocument } from "../chunk/chunker.js";
import { createEntityExtractor, type EntityExtractor } from "../extract/entity-extractor.js";
import { persistGtmGraph } from "../extract/persist-gtm-graph.js";
import { parseMarkdown } from "../parse/markdown-parser.js";
import type { IngestWorkspaceOptions } from "../ports/graph-store.js";

async function walkMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkMarkdownFiles(fullPath)));
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function slugToBasename(slug: string): string {
  const normalized = slug.trim().replace(/\.md$/i, "");
  return `${normalized}.md`;
}

export function buildPathIndex(markdownPaths: string[], workspaceRoot: string): Map<string, string> {
  const index = new Map<string, string>();
  for (const absolutePath of markdownPaths) {
    const rel = relative(workspaceRoot, absolutePath).replace(/\\/g, "/");
    const base = basename(absolutePath);
    index.set(base, rel);
    index.set(base.replace(/\.md$/i, ""), rel);
  }
  return index;
}

export function resolveWikilinkTarget(
  target: string,
  pathIndex: Map<string, string>,
): string | null {
  const asFile = slugToBasename(target);
  if (pathIndex.has(asFile)) return pathIndex.get(asFile) ?? null;
  const asSlug = target.replace(/\.md$/i, "");
  if (pathIndex.has(asSlug)) return pathIndex.get(asSlug) ?? null;
  return null;
}

export async function ingestWorkspace(options: IngestWorkspaceOptions): Promise<IngestStats> {
  const workspaceRoot = resolve(options.workspaceRoot);
  const corpusDir = resolve(options.corpusDir);
  const stats: IngestStats = {
    documentsProcessed: 0,
    documentsSkipped: 0,
    documentsDeleted: 0,
    sectionsWritten: 0,
    chunksWritten: 0,
    nodesWritten: 0,
    edgesWritten: 0,
    gtmNodesWritten: 0,
    gtmEdgesWritten: 0,
  };

  const entityExtractor: EntityExtractor =
    options.entityExtractor ?? createEntityExtractor("rules");

  const absolutePaths = await walkMarkdownFiles(corpusDir);
  const pathIndex = buildPathIndex(absolutePaths, workspaceRoot);
  const pendingLinks: Array<{ sourceDocId: string; sourcePath: string; targetSlug: string }> =
    [];

  for (const absolutePath of absolutePaths) {
    const relPath = relative(workspaceRoot, absolutePath).replace(/\\/g, "/");
    const raw = await readFile(absolutePath, "utf-8");
    const hash = contentHash(raw);
    const existing = await options.store.findDocumentByPath(relPath);

    if (existing?.contentHash === hash) {
      stats.documentsSkipped += 1;
      continue;
    }

    if (existing) {
      await options.store.deleteDocumentGraph(existing.docId);
      stats.documentsDeleted += 1;
    }

    const docId = docIdFromPath(relPath);
    const parsed = parseMarkdown(raw, { relativePath: relPath });
    const { sections, chunks } = chunkDocument(parsed, {
      docId,
      path: relPath,
    });

    const doc: DocumentRecord = {
      docId,
      path: relPath,
      docType: parsed.docType,
      title: parsed.title,
      contentHash: hash,
    };
    await options.store.upsertDocument(doc);
    stats.documentsProcessed += 1;

    const docNode: NodeRecord = {
      nodeId: docId,
      nodeType: "Document",
      label: parsed.title,
      properties: {
        path: relPath,
        doc_type: parsed.docType,
        ...parsed.frontmatter,
      },
    };
    await options.store.upsertNode(docNode);
    stats.nodesWritten += 1;

    for (const section of sections) {
      await options.store.upsertSection(section);
      stats.sectionsWritten += 1;

      const sectionNode: NodeRecord = {
        nodeId: section.sectionId,
        nodeType: "Section",
        label: section.heading,
        properties: { level: section.level, ordinal: section.ordinal },
      };
      await options.store.upsertNode(sectionNode);
      stats.nodesWritten += 1;

      const containsSection: EdgeRecord = {
        edgeId: edgeIdFromParts(docId, section.sectionId, "contains"),
        sourceId: docId,
        targetId: section.sectionId,
        edgeType: "contains",
      };
      await options.store.upsertEdge(containsSection);
      stats.edgesWritten += 1;
    }

    for (const chunk of chunks) {
      await options.store.upsertChunk(chunk);
      stats.chunksWritten += 1;

      const chunkNode: NodeRecord = {
        nodeId: chunk.chunkId,
        nodeType: "Chunk",
        label: chunk.heading,
        properties: {
          path: chunk.path,
          heading: chunk.heading,
          token_count: chunk.tokenCount,
        },
      };
      await options.store.upsertNode(chunkNode);
      stats.nodesWritten += 1;

      const containsChunk: EdgeRecord = {
        edgeId: edgeIdFromParts(chunk.sectionId, chunk.chunkId, "contains"),
        sourceId: chunk.sectionId,
        targetId: chunk.chunkId,
        edgeType: "contains",
      };
      await options.store.upsertEdge(containsChunk);
      stats.edgesWritten += 1;
    }

    const linkedTargets = new Set<string>();
    for (const link of parsed.wikilinks) {
      const edgeKey = `${relPath}::${link.target}`;
      if (linkedTargets.has(edgeKey)) continue;
      linkedTargets.add(edgeKey);
      pendingLinks.push({
        sourceDocId: docId,
        sourcePath: relPath,
        targetSlug: link.target,
      });
    }

    const extraction = await entityExtractor.extract(parsed, docId);
    const gtmStats = await persistGtmGraph(options.store, docId, extraction);
    stats.gtmNodesWritten += gtmStats.gtmNodesWritten;
    stats.gtmEdgesWritten += gtmStats.gtmEdgesWritten;
  }

  const linkedPairs = new Set<string>();
  for (const pending of pendingLinks) {
    const targetPath = resolveWikilinkTarget(pending.targetSlug, pathIndex);
    if (!targetPath || targetPath === pending.sourcePath) continue;

    const targetDoc = await options.store.findDocumentByPath(targetPath);
    if (!targetDoc) continue;

    const pairKey = `${pending.sourceDocId}->${targetDoc.docId}`;
    if (linkedPairs.has(pairKey)) continue;
    linkedPairs.add(pairKey);

    const linksTo: EdgeRecord = {
      edgeId: edgeIdFromParts(pending.sourceDocId, targetDoc.docId, "linksTo"),
      sourceId: pending.sourceDocId,
      targetId: targetDoc.docId,
      edgeType: "linksTo",
      properties: { target_slug: pending.targetSlug },
    };
    await options.store.upsertEdge(linksTo);
    stats.edgesWritten += 1;
  }

  return stats;
}
