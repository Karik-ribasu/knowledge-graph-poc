/** GTM entity node types (P1). */
export const GTM_NODE_TYPES = [
  "Product",
  "ICP",
  "Persona",
  "Competitor",
  "Objection",
  "Feature",
  "ProofPoint",
  "PricingTier",
  "Channel",
  "Metric",
  "Phase",
] as const;

export type GtmNodeType = (typeof GTM_NODE_TYPES)[number];

/** Artifact-centric P0 node types (delivery pipeline outputs). */
export const ARTIFACT_NODE_TYPES = ["Artifact", "Delivery", "Module"] as const;

export type ArtifactNodeType = (typeof ARTIFACT_NODE_TYPES)[number];

/** Pipeline / artifact node types (artifact ingest v2). */
export const PIPELINE_NODE_TYPES = ["Delivery", "Venture", "Module", "Artifact"] as const;

export type PipelineNodeType = (typeof PIPELINE_NODE_TYPES)[number];

/** Structural P0 node types (filesystem + content). */
export const STRUCTURAL_NODE_TYPES = ["Folder", "File", "Section", "Chunk"] as const;

export type StructuralNodeType = (typeof STRUCTURAL_NODE_TYPES)[number];

/** @deprecated Use `File` — kept for read-compat until DB migrated. */
export const LEGACY_DOCUMENT_NODE_TYPE = "Document" as const;

export type NodeType =
  | StructuralNodeType
  | PipelineNodeType
  | GtmNodeType
  | typeof LEGACY_DOCUMENT_NODE_TYPE;

/** Node types that represent markdown files in the corpus. */
export const FILE_LIKE_NODE_TYPES = ["File", LEGACY_DOCUMENT_NODE_TYPE] as const;

export function isFileLikeNodeType(value: string): boolean {
  return (FILE_LIKE_NODE_TYPES as readonly string[]).includes(value);
}

/** P0 structural edges. */
export const STRUCTURAL_EDGE_TYPES = ["contains", "linksTo"] as const;

/** Artifact graph edges (delivery pipeline, no agent facets). */
export const ARTIFACT_EDGE_TYPES = [
  "partOfModule",
  "belongsToDelivery",
  "aggregates",
  "materializes",
] as const;

export type ArtifactEdgeType = (typeof ARTIFACT_EDGE_TYPES)[number];

/** Pipeline edges (artifact ingest v2; no agent nodes). */
export const PIPELINE_EDGE_TYPES = [
  "belongsToDelivery",
  "partOfModule",
  "handoffTo",
  "aggregates",
  "materializes",
  "references",
] as const;

export type PipelineEdgeType = (typeof PIPELINE_EDGE_TYPES)[number];

/** GTM relationship edges (P1). */
export const GTM_EDGE_TYPES = [
  "targetsICP",
  "competesWith",
  "addressesObjection",
  "hasFeature",
  "supportedBy",
  "pricedAs",
  "distributedVia",
  "measuredBy",
  "belongsToPhase",
  "mentions",
] as const;

export type GtmEdgeType = (typeof GTM_EDGE_TYPES)[number];

export type StructuralEdgeType = (typeof STRUCTURAL_EDGE_TYPES)[number];

export type EdgeType = StructuralEdgeType | ArtifactEdgeType | PipelineEdgeType | GtmEdgeType;

/** Default edge whitelist for graph expansion (GTM + navigation). */
export const DEFAULT_EXPANSION_EDGE_TYPES: readonly EdgeType[] = [
  "linksTo",
  "mentions",
  "aggregates",
  "materializes",
  "references",
  "handoffTo",
  "partOfModule",
  ...GTM_EDGE_TYPES,
];

export function isGtmNodeType(value: string): value is GtmNodeType {
  return (GTM_NODE_TYPES as readonly string[]).includes(value);
}

export function isGtmEdgeType(value: string): value is GtmEdgeType {
  return (GTM_EDGE_TYPES as readonly string[]).includes(value);
}
