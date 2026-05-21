import { readdir, readFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";
import {
  artifactIdFromPath,
  chunkIdFromParts,
  contentHash,
  edgeIdFromParts,
  sectionIdFromParts,
} from "../domain/ids.js";
import type {
  ChunkRecord,
  DocumentRecord,
  EdgeRecord,
  NodeRecord,
  SectionRecord,
} from "../domain/types.js";
import type { GraphStore } from "../ports/graph-store.js";
import { estimateTokens } from "../chunk/tokens.js";
import {
  detectArtifactType,
  extractModule,
  imagePromptPathForPng,
  normalizeVolumeArtifactPath,
  type ArtifactType,
} from "./artifact-type.js";
import { parseDeliveryManifest, type DeliveryManifest } from "./delivery-manifest.js";
import { flattenedFieldsToIndexText, flattenJsonForIndex } from "./json-flatten.js";
import { parseImagePromptUnits } from "./image-prompt-units.js";
import { chunkVolMarkdownBySections } from "./vol-sections.js";

export interface ArtifactIngestStats {
  artifactsProcessed: number;
  artifactsSkipped: number;
  artifactsDeleted: number;
  indexUnitsWritten: number;
  nodesWritten: number;
  edgesWritten: number;
}

export interface IngestArtifactsOptions {
  workspaceRoot: string;
  artifactsDir: string;
  store: GraphStore;
}

const DELIVERY_NODE_PREFIX = "delivery:";
const MODULE_NODE_PREFIX = "module:";

const INDEXABLE_EXTENSIONS = new Set([".md", ".json", ".png"]);

async function walkArtifactFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkArtifactFiles(fullPath)));
    } else if (entry.isFile() && INDEXABLE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function deliveryNodeId(deliveryId: string): string {
  return `${DELIVERY_NODE_PREFIX}${deliveryId}`;
}

function moduleNodeId(module: string): string {
  return `${MODULE_NODE_PREFIX}${module}`;
}

function buildIndexUnits(
  artifactType: ArtifactType,
  raw: string,
  parsedJson?: unknown,
): Array<{ heading: string; text: string }> {
  switch (artifactType) {
    case "json":
    case "manifest": {
      const data = parsedJson ?? (JSON.parse(raw) as unknown);
      const fields = flattenJsonForIndex(data);
      return flattenedFieldsToIndexText(fields).map((text, index) => ({
        heading: `field:${index}`,
        text,
      }));
    }
    case "volume-md": {
      return chunkVolMarkdownBySections(raw).map((section) => ({
        heading: section.heading,
        text: section.body,
      }));
    }
    case "image-prompt": {
      const units = parseImagePromptUnits(raw);
      const out: Array<{ heading: string; text: string }> = [];
      if (units.frontmatterText) {
        out.push({ heading: "frontmatter", text: units.frontmatterText });
      }
      if (units.bodyText) {
        out.push({ heading: "prompt-body", text: units.bodyText });
      }
      return out;
    }
    case "markdown": {
      const trimmed = raw.trim();
      return trimmed.length > 0 ? [{ heading: "body", text: trimmed }] : [];
    }
    case "image":
      return [];
    default:
      return [];
  }
}

function resolveManifestMetadata(manifest: DeliveryManifest | null): {
  deliveryId: string | null;
  ventureId: string | null;
  opportunityId: string | null;
} {
  return {
    deliveryId: manifest?.deliveryId || null,
    ventureId: manifest?.ventureId || null,
    opportunityId: manifest?.opportunityId || null,
  };
}

export async function ingestArtifacts(options: IngestArtifactsOptions): Promise<ArtifactIngestStats> {
  const workspaceRoot = resolve(options.workspaceRoot);
  const artifactsDir = resolve(options.artifactsDir);
  const stats: ArtifactIngestStats = {
    artifactsProcessed: 0,
    artifactsSkipped: 0,
    artifactsDeleted: 0,
    indexUnitsWritten: 0,
    nodesWritten: 0,
    edgesWritten: 0,
  };

  const manifestPath = join(artifactsDir, "_meta", "delivery-manifest.json");
  let manifest: DeliveryManifest | null = null;
  try {
    const manifestRaw = await readFile(manifestPath, "utf-8");
    manifest = parseDeliveryManifest(JSON.parse(manifestRaw) as unknown);
  } catch {
    manifest = null;
  }

  const absolutePaths = await walkArtifactFiles(artifactsDir);
  const artifactPaths = new Map<string, string>();

  for (const absolutePath of absolutePaths) {
    const relPath = relative(workspaceRoot, absolutePath).replace(/\\/g, "/");
    artifactPaths.set(relPath, absolutePath);
  }

  const modulesSeen = new Set<string>();

  for (const absolutePath of absolutePaths) {
    const sourcePath = relative(workspaceRoot, absolutePath).replace(/\\/g, "/");
    const artifactId = artifactIdFromPath(sourcePath);
    const artifactType = detectArtifactType(sourcePath);
    const module = extractModule(sourcePath);
    if (module) modulesSeen.add(module);

    const isBinary = artifactType === "image";
    const raw = isBinary ? "" : await readFile(absolutePath, "utf-8");
    const hash = isBinary ? contentHash(sourcePath) : contentHash(raw);

    const existing = await options.store.findDocumentByPath(sourcePath);
    if (existing?.contentHash === hash) {
      stats.artifactsSkipped += 1;
      continue;
    }

    if (existing) {
      await options.store.deleteDocumentGraph(existing.docId);
      stats.artifactsDeleted += 1;
    }

    const meta = resolveManifestMetadata(manifest);
    let parsedJson: unknown;
    if (!isBinary && (artifactType === "json" || artifactType === "manifest")) {
      parsedJson = JSON.parse(raw) as unknown;
    }

    const doc: DocumentRecord = {
      docId: artifactId,
      path: sourcePath,
      docType: module ? `artifact:${module}` : "artifact",
      title: basename(sourcePath),
      contentHash: hash,
    };
    await options.store.upsertDocument(doc);

    const indexUnits = buildIndexUnits(artifactType, raw, parsedJson);
    let unitIndex = 0;
    for (const unit of indexUnits) {
      const sectionId = sectionIdFromParts(artifactId, unit.heading, unitIndex);
      const section: SectionRecord = {
        sectionId,
        docId: artifactId,
        heading: unit.heading,
        level: 2,
        ordinal: unitIndex,
      };
      await options.store.upsertSection(section);

      const chunk: ChunkRecord = {
        chunkId: chunkIdFromParts(artifactId, unit.heading, unitIndex),
        docId: artifactId,
        sectionId,
        heading: unit.heading,
        text: unit.text,
        tokenCount: estimateTokens(unit.text),
        path: sourcePath,
        startLine: 0,
        endLine: 0,
      };
      await options.store.upsertChunk(chunk);
      stats.indexUnitsWritten += 1;
      unitIndex += 1;
    }

    const artifactNode: NodeRecord = {
      nodeId: artifactId,
      nodeType: "Artifact",
      label: basename(sourcePath),
      properties: {
        artifact_id: artifactId,
        source_path: sourcePath,
        artifact_type: artifactType,
        module,
        delivery_id: meta.deliveryId,
        venture_id: meta.ventureId,
        opportunity_id: meta.opportunityId,
        content_hash: hash,
      },
    };
    await options.store.upsertNode(artifactNode);
    stats.nodesWritten += 1;

    if (module && module !== "_meta") {
      const modId = moduleNodeId(module);
      await options.store.upsertNode({
        nodeId: modId,
        nodeType: "Module",
        label: module,
        properties: { module },
      });
      stats.nodesWritten += 1;

      const partEdge: EdgeRecord = {
        edgeId: edgeIdFromParts(artifactId, modId, "partOfModule"),
        sourceId: artifactId,
        targetId: modId,
        edgeType: "partOfModule",
      };
      await options.store.upsertEdge(partEdge);
      stats.edgesWritten += 1;
    }

    if (meta.deliveryId) {
      const delId = deliveryNodeId(meta.deliveryId);
      await options.store.upsertNode({
        nodeId: delId,
        nodeType: "Delivery",
        label: manifest?.startupName ?? meta.deliveryId,
        properties: {
          delivery_id: meta.deliveryId,
          venture_id: meta.ventureId,
          opportunity_id: meta.opportunityId,
          delivered_at: manifest?.deliveredAt ?? null,
        },
      });
      stats.nodesWritten += 1;

      const deliveryEdge: EdgeRecord = {
        edgeId: edgeIdFromParts(artifactId, delId, "belongsToDelivery"),
        sourceId: artifactId,
        targetId: delId,
        edgeType: "belongsToDelivery",
      };
      await options.store.upsertEdge(deliveryEdge);
      stats.edgesWritten += 1;
    }

    stats.artifactsProcessed += 1;
  }

  if (manifest?.deliveryId) {
    const delId = deliveryNodeId(manifest.deliveryId);
    await options.store.upsertNode({
      nodeId: delId,
      nodeType: "Delivery",
      label: manifest.startupName ?? manifest.deliveryId,
      properties: {
        delivery_id: manifest.deliveryId,
        venture_id: manifest.ventureId,
        opportunity_id: manifest.opportunityId,
        delivered_at: manifest.deliveredAt,
        handoff_chain: manifest.handoffChain,
      },
    });
    stats.nodesWritten += 1;
  }

  for (const module of manifest?.modules ?? [...modulesSeen]) {
    if (module === "_meta") continue;
    const modId = moduleNodeId(module);
    await options.store.upsertNode({
      nodeId: modId,
      nodeType: "Module",
      label: module,
      properties: { module },
    });
    stats.nodesWritten += 1;
  }

  const dossierPath = "artifacts/artifacts/add-venture/agents/dossier-composer/venture-dossier.json";
  const dossierAbs = artifactPaths.get(dossierPath);
  if (dossierAbs) {
    const dossierRaw = await readFile(dossierAbs, "utf-8");
    const dossier = JSON.parse(dossierRaw) as {
      volume_artifacts?: Record<string, string>;
    };
    const dossierId = artifactIdFromPath(dossierPath);
    const volumeRefs = dossier.volume_artifacts ?? {};

    for (const ref of Object.values(volumeRefs)) {
      const targetPath = normalizeVolumeArtifactPath(ref);
      const targetId = artifactIdFromPath(targetPath);
      const edge: EdgeRecord = {
        edgeId: edgeIdFromParts(dossierId, targetId, "aggregates"),
        sourceId: dossierId,
        targetId,
        edgeType: "aggregates",
        properties: { ref },
      };
      await options.store.upsertEdge(edge);
      stats.edgesWritten += 1;
    }
  }

  for (const absolutePath of absolutePaths) {
    const sourcePath = relative(workspaceRoot, absolutePath).replace(/\\/g, "/");
    if (!sourcePath.toLowerCase().endsWith(".png")) continue;

    const pngId = artifactIdFromPath(sourcePath);
    const promptPath = imagePromptPathForPng(sourcePath);
    const promptId = artifactIdFromPath(promptPath);

    const edge: EdgeRecord = {
      edgeId: edgeIdFromParts(promptId, pngId, "materializes"),
      sourceId: promptId,
      targetId: pngId,
      edgeType: "materializes",
      properties: { prompt_path: promptPath },
    };
    await options.store.upsertEdge(edge);
    stats.edgesWritten += 1;
  }

  return stats;
}
