import type { GraphLinkDTO, GraphNodeDTO, GraphSnapshotDTO } from "@kg/core/explorer/schemas";
import {
  edgeColor,
  isDashedEdge,
  linkCurvatureForType,
  nodeColor,
} from "@kg/core/explorer/graph-theme";

export interface ForceGraphNode {
  id: string;
  label: string;
  type: string;
  val: number;
  color: string;
  x?: number;
  y?: number;
  path?: string;
  doc_type?: string;
  name?: string;
}

export interface ForceGraphLink {
  source: string;
  target: string;
  type: string;
  color: string;
  dashed: boolean;
  curvature: number;
}

export interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
}

export function toForceGraphData(snapshot: GraphSnapshotDTO | null): ForceGraphData {
  if (!snapshot) {
    return { nodes: [], links: [] };
  }
  return {
    nodes: snapshot.nodes.map((n) => mapNode(n)),
    links: snapshot.links.map((l) => mapLink(l)),
  };
}

function mapNode(n: GraphNodeDTO): ForceGraphNode {
  return {
    id: n.id,
    label: n.label,
    type: n.type,
    val: n.val,
    color: n.color ?? nodeColor(n.type),
  };
}

function mapLink(l: GraphLinkDTO): ForceGraphLink {
  return {
    source: l.source,
    target: l.target,
    type: l.type,
    color: l.color ?? edgeColor(l.type),
    dashed: isDashedEdge(l.type),
    curvature: linkCurvatureForType(l.type),
  };
}
