import type { EdgeType } from "./ontology.js";
import type { GraphExpansionEdge, GraphExpansionNode, GraphExpansionResult } from "../domain/types.js";

export interface GraphExpansionStore {
  expand(params: {
    seedNodeIds: string[];
    hops: number;
    edgeTypes?: readonly EdgeType[];
  }): Promise<GraphExpansionResult>;
}

export interface InMemoryEdge {
  edgeId: string;
  sourceId: string;
  targetId: string;
  edgeType: string;
  properties?: Record<string, unknown>;
}

export interface InMemoryNode {
  nodeId: string;
  nodeType: string;
  label: string | null;
  properties: Record<string, unknown>;
}

/** BFS expansion for unit tests (undirected traversal). */
export function expandGraphInMemory(
  nodes: readonly InMemoryNode[],
  edges: readonly InMemoryEdge[],
  seedNodeIds: readonly string[],
  hops: number,
  edgeTypes?: readonly string[],
): GraphExpansionResult {
  const allowed = edgeTypes ? new Set(edgeTypes) : null;
  const nodeById = new Map(nodes.map((n) => [n.nodeId, n]));
  const adjacency = new Map<string, Array<{ neighborId: string; edge: InMemoryEdge }>>();

  for (const edge of edges) {
    if (allowed && !allowed.has(edge.edgeType)) continue;
    const forward = adjacency.get(edge.sourceId) ?? [];
    forward.push({ neighborId: edge.targetId, edge });
    adjacency.set(edge.sourceId, forward);
    const backward = adjacency.get(edge.targetId) ?? [];
    backward.push({ neighborId: edge.sourceId, edge });
    adjacency.set(edge.targetId, backward);
  }

  const visitedNodes = new Map<string, number>();
  const visitedEdges = new Map<string, number>();
  const queue: Array<{ nodeId: string; hop: number }> = [];

  for (const seed of seedNodeIds) {
    if (!nodeById.has(seed)) continue;
    visitedNodes.set(seed, 0);
    queue.push({ nodeId: seed, hop: 0 });
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (current.hop >= hops) continue;

    for (const { neighborId, edge } of adjacency.get(current.nodeId) ?? []) {
      if (visitedEdges.has(edge.edgeId)) continue;
      const nextHop = current.hop + 1;
      visitedEdges.set(edge.edgeId, nextHop);

      if (!visitedNodes.has(neighborId)) {
        visitedNodes.set(neighborId, nextHop);
        if (nextHop < hops) {
          queue.push({ nodeId: neighborId, hop: nextHop });
        }
      }
    }
  }

  const resultNodes: GraphExpansionNode[] = [...visitedNodes.entries()]
    .map(([nodeId, hop]) => {
      const node = nodeById.get(nodeId);
      if (!node) return null;
      return {
        nodeId: node.nodeId,
        nodeType: node.nodeType,
        label: node.label,
        properties: node.properties,
        hop,
      };
    })
    .filter((n): n is GraphExpansionNode => n !== null)
    .sort((a, b) => a.hop - b.hop || a.nodeId.localeCompare(b.nodeId));

  const resultEdges: GraphExpansionEdge[] = [...visitedEdges.entries()]
    .map(([edgeId, hop]) => {
      const edge = edges.find((e) => e.edgeId === edgeId);
      if (!edge) return null;
      return {
        edgeId: edge.edgeId,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        edgeType: edge.edgeType,
        properties: edge.properties ?? {},
        hop,
      };
    })
    .filter((e): e is GraphExpansionEdge => e !== null)
    .sort((a, b) => a.hop - b.hop || a.edgeId.localeCompare(b.edgeId));

  return {
    seeds: [...seedNodeIds],
    hops,
    nodes: resultNodes,
    edges: resultEdges,
  };
}

/** Parse CLI seed: `doc:<id>` or `entity:Product:nexusflow` or raw node id. */
export function parseExpansionSeed(raw: string): { kind: "doc" | "entity" | "node"; id: string } {
  if (raw.startsWith("doc:")) {
    return { kind: "doc", id: raw.slice(4) };
  }
  if (raw.startsWith("entity:")) {
    return { kind: "entity", id: raw.slice(7) };
  }
  return { kind: "node", id: raw };
}
