import type { EdgeType, NodeType } from "../graph/ontology.js";

/** Default multiplier for force-graph node radius (`val`). */
export const DEFAULT_NODE_VAL_K = 4;

const NODE_COLORS: Record<string, string> = {
  Document: "#3b82f6",
  Section: "#93c5fd",
  Chunk: "#cbd5e1",
  Product: "#8b5cf6",
  Competitor: "#ef4444",
  Persona: "#f59e0b",
  ICP: "#f59e0b",
  Feature: "#10b981",
};

const EDGE_COLORS: Record<string, string> = {
  contains: "#94a3b8",
  linksTo: "#2563eb",
  mentions: "#a855f7",
  competesWith: "#dc2626",
  targetsICP: "#d97706",
};

export function nodeColor(nodeType: string): string {
  return NODE_COLORS[nodeType] ?? "#64748b";
}

export function edgeColor(edgeType: string): string {
  return EDGE_COLORS[edgeType] ?? "#64748b";
}

export function isDashedEdge(edgeType: string): boolean {
  return edgeType === "mentions";
}

/** `val = sqrt(effectiveDegree + 1) * k`; Document nodes get +2 on effective degree. */
export function computeNodeVal(
  degree: number,
  nodeType: NodeType | string,
  k: number = DEFAULT_NODE_VAL_K,
): number {
  const bonus = nodeType === "Document" ? 2 : 0;
  const effectiveDegree = degree + bonus;
  return Math.sqrt(effectiveDegree + 1) * k;
}

/** Link stroke width from optional weight (default 1). */
export function computeLinkWidth(weight = 1): number {
  return 1 + Math.log(1 + weight);
}

export function decorateNode(
  node: { id: string; label: string; type: string; val: number },
): { id: string; label: string; type: string; val: number; color: string } {
  return { ...node, color: nodeColor(node.type) };
}

export function decorateLink(link: {
  source: string;
  target: string;
  type: string;
  weight?: number;
}): { source: string; target: string; type: string; color: string; width: number } {
  return {
    source: link.source,
    target: link.target,
    type: link.type,
    color: edgeColor(link.type),
    width: computeLinkWidth(link.weight ?? 1),
  };
}

export type { NodeType, EdgeType };
