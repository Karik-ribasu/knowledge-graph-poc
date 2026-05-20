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

/** Structural P0 node types. */
export const STRUCTURAL_NODE_TYPES = ["Document", "Section", "Chunk"] as const;

export type StructuralNodeType = (typeof STRUCTURAL_NODE_TYPES)[number];

export type NodeType = StructuralNodeType | GtmNodeType;

/** P0 structural edges. */
export const STRUCTURAL_EDGE_TYPES = ["contains", "linksTo"] as const;

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

export type EdgeType = StructuralEdgeType | GtmEdgeType;

/** Default edge whitelist for graph expansion (GTM + navigation). */
export const DEFAULT_EXPANSION_EDGE_TYPES: readonly EdgeType[] = [
  "linksTo",
  "mentions",
  ...GTM_EDGE_TYPES,
];

export function isGtmNodeType(value: string): value is GtmNodeType {
  return (GTM_NODE_TYPES as readonly string[]).includes(value);
}

export function isGtmEdgeType(value: string): value is GtmEdgeType {
  return (GTM_EDGE_TYPES as readonly string[]).includes(value);
}
