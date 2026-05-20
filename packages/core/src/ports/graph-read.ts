import type { GraphLinkDTO, GraphNodeDTO, GraphSnapshotDTO, NodeDetailDTO } from "../explorer/schemas.js";

export interface GraphSnapshotFilters {
  seed?: string;
  /** 0 = seed only; 1–2 = BFS expansion. */
  hops?: number;
  nodeTypes?: readonly string[];
  docType?: string;
  maxNodes?: number;
  maxEdges?: number;
}

export interface GraphSearchHit {
  id: string;
  label: string;
  type: string;
}

export interface GraphReadPort {
  getSnapshot(filters: GraphSnapshotFilters): Promise<GraphSnapshotDTO>;
  searchNodes(query: string, limit: number): Promise<GraphSearchHit[]>;
}

export interface NodeDetailPort {
  getNodeDetail(nodeId: string): Promise<NodeDetailDTO | null>;
}

export type { GraphNodeDTO, GraphLinkDTO, GraphSnapshotDTO, NodeDetailDTO };
