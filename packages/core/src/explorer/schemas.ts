import { z } from "zod";

export const graphNodeDtoSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  val: z.number().positive(),
  color: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

export const graphLinkDtoSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.string(),
  color: z.string().optional(),
  width: z.number().optional(),
});

export const graphSnapshotDtoSchema = z.object({
  nodes: z.array(graphNodeDtoSchema),
  links: z.array(graphLinkDtoSchema),
  meta: z
    .object({
      nodeCount: z.number().int().nonnegative(),
      edgeCount: z.number().int().nonnegative(),
      truncated: z.boolean().optional(),
    })
    .optional(),
});

export const incidentEdgeSchema = z.object({
  edgeId: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  edgeType: z.string(),
  direction: z.enum(["outgoing", "incoming"]),
  properties: z.record(z.unknown()).default({}),
});

export const relatedChunkSchema = z.object({
  chunkId: z.string(),
  docId: z.string(),
  path: z.string().nullable(),
  heading: z.string().nullable(),
  snippet: z.string(),
});

export const relatedDocumentSchema = z.object({
  docId: z.string(),
  path: z.string(),
  title: z.string().nullable(),
  docType: z.string().nullable(),
});

export const nodeDetailDtoSchema = z.object({
  node: z.object({
    id: z.string(),
    label: z.string(),
    type: z.string(),
    properties: z.record(z.unknown()).default({}),
  }),
  incidentEdges: z.array(incidentEdgeSchema),
  relatedChunks: z.array(relatedChunkSchema),
  relatedDocuments: z.array(relatedDocumentSchema),
});

export const graphQuerySchema = z.object({
  seed: z.string().min(1).optional(),
  hops: z.coerce.number().int().min(0).max(2).optional(),
  nodeTypes: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      return Array.isArray(v) ? v : [v];
    }),
  docType: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  /** Preset expansion: fileNeighborhood | chunkNeighborhood */
  highlightMode: z.enum(["fileNeighborhood", "chunkNeighborhood"]).optional(),
});

export { corpusTreeNodeSchema, fileContentDtoSchema, chunkAnchorSchema } from "./corpus-schemas.js";
export type { CorpusTreeNode, FileContentDTO, ChunkAnchorDTO } from "./corpus-schemas.js";

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type GraphNodeDTO = z.infer<typeof graphNodeDtoSchema>;
export type GraphLinkDTO = z.infer<typeof graphLinkDtoSchema>;
export type GraphSnapshotDTO = z.infer<typeof graphSnapshotDtoSchema>;
export type NodeDetailDTO = z.infer<typeof nodeDetailDtoSchema>;
export type IncidentEdgeDTO = z.infer<typeof incidentEdgeSchema>;
export type RelatedChunkDTO = z.infer<typeof relatedChunkSchema>;
export type RelatedDocumentDTO = z.infer<typeof relatedDocumentSchema>;
