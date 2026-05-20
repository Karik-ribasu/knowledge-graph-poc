import { edgeIdFromParts, entityIdFromParts } from "../domain/ids.js";
import type {
  EdgeRecord,
  ExtractedEntity,
  ExtractedRelation,
  GtmExtractionResult,
  NodeRecord,
} from "../domain/types.js";
import type { GraphStore } from "../ports/graph-store.js";
import { slugify } from "./slug.js";

export interface PersistGtmGraphStats {
  gtmNodesWritten: number;
  gtmEdgesWritten: number;
}

function toNode(entity: ExtractedEntity): NodeRecord {
  return {
    nodeId: entityIdFromParts(entity.nodeType, entity.name, slugify),
    nodeType: entity.nodeType,
    label: entity.name,
    properties: {
      name: entity.name,
      ...entity.properties,
    },
  };
}

function toEdge(relation: ExtractedRelation): EdgeRecord {
  const sourceId = entityIdFromParts(relation.sourceType, relation.sourceName, slugify);
  const targetId = entityIdFromParts(relation.targetType, relation.targetName, slugify);
  return {
    edgeId: edgeIdFromParts(sourceId, targetId, relation.edgeType),
    sourceId,
    targetId,
    edgeType: relation.edgeType,
    properties: relation.properties,
  };
}

/** Upsert GTM entities/edges and link Document → entity via `mentions`. */
export async function persistGtmGraph(
  store: GraphStore,
  docId: string,
  extraction: GtmExtractionResult,
): Promise<PersistGtmGraphStats> {
  const stats: PersistGtmGraphStats = { gtmNodesWritten: 0, gtmEdgesWritten: 0 };
  const writtenNodes = new Set<string>();

  for (const entity of extraction.entities) {
    const node = toNode(entity);
    if (writtenNodes.has(node.nodeId)) continue;
    writtenNodes.add(node.nodeId);
    await store.upsertNode(node);
    stats.gtmNodesWritten += 1;

    const mentions: EdgeRecord = {
      edgeId: edgeIdFromParts(docId, node.nodeId, "mentions"),
      sourceId: docId,
      targetId: node.nodeId,
      edgeType: "mentions",
      properties: { source_doc_id: docId },
    };
    await store.upsertEdge(mentions);
    stats.gtmEdgesWritten += 1;
  }

  for (const relation of extraction.relations) {
    const sourceNode = toNode({
      nodeType: relation.sourceType,
      name: relation.sourceName,
      properties: { source_doc_id: docId },
    });
    const targetNode = toNode({
      nodeType: relation.targetType,
      name: relation.targetName,
      properties: { source_doc_id: docId },
    });

    if (!writtenNodes.has(sourceNode.nodeId)) {
      writtenNodes.add(sourceNode.nodeId);
      await store.upsertNode(sourceNode);
      stats.gtmNodesWritten += 1;
    }
    if (!writtenNodes.has(targetNode.nodeId)) {
      writtenNodes.add(targetNode.nodeId);
      await store.upsertNode(targetNode);
      stats.gtmNodesWritten += 1;
    }

    const edge = toEdge(relation);
    await store.upsertEdge(edge);
    stats.gtmEdgesWritten += 1;
  }

  return stats;
}
