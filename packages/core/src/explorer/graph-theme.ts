import type { EdgeType, NodeType } from "../graph/ontology.js";

/** Default multiplier for force-graph node radius (`val`). */
export const DEFAULT_NODE_VAL_K = 3;

/** Default link length for d3-force (px). */
export const DEFAULT_LINK_DISTANCE = 140;

/** Repulsion strength for d3-force charge (negative). */
export const DEFAULT_CHARGE_STRENGTH = -320;

/** Dimmed node color when another node is hovered. */
export const HOVER_DIM_NODE_COLOR = "#5a5a5a";

/** Dimmed link color when not incident to hovered node. */
export const HOVER_DIM_LINK_COLOR = "#3d3d3d";

const NODE_COLORS: Record<string, string> = {
  Folder: "#c5c5c5",
  File: "#4fc3f7",
  Document: "#4fc3f7",
  Section: "#81d4fa",
  Chunk: "#9e9e9e",
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

/** `val = sqrt(effectiveDegree + 1) * k`; File nodes get +2 on effective degree. */
export function computeNodeVal(
  degree: number,
  nodeType: NodeType | string,
  k: number = DEFAULT_NODE_VAL_K,
): number {
  const bonus = nodeType === "File" || nodeType === "Document" ? 2 : 0;
  const effectiveDegree = degree + bonus;
  return Math.sqrt(effectiveDegree + 1) * k;
}

/** Link stroke width from optional weight (default 1) — thin strokes for dense graphs. */
export function computeLinkWidth(weight = 1): number {
  return 0.55 + 0.2 * Math.log(1 + weight);
}

/** Curvature for organic curved links (0 = straight, ~0.25 = gentle arc). */
export function linkCurvatureForType(edgeType: string): number {
  if (edgeType === "mentions") return 0.28;
  if (edgeType === "linksTo") return 0.18;
  return 0.12;
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
}): {
  source: string;
  target: string;
  type: string;
  color: string;
  width: number;
  curvature: number;
} {
  return {
    source: link.source,
    target: link.target,
    type: link.type,
    color: edgeColor(link.type),
    width: computeLinkWidth(link.weight ?? 1),
    curvature: linkCurvatureForType(link.type),
  };
}

export type { NodeType, EdgeType };
