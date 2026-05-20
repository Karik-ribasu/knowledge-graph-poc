import { GTM_NODE_TYPES, STRUCTURAL_NODE_TYPES } from "@kg/core/graph/ontology";

export const EXPLORER_NODE_TYPES = [
  ...STRUCTURAL_NODE_TYPES,
  ...GTM_NODE_TYPES,
] as const;

export const STRUCTURE_NODE_TYPES = ["Chunk", "Section"] as const;

export interface GraphFilterState {
  nodeTypes: string[];
  docType: string;
  hideStructure: boolean;
}

export function defaultGraphFilters(): GraphFilterState {
  return {
    nodeTypes: EXPLORER_NODE_TYPES.filter(
      (t) => !STRUCTURE_NODE_TYPES.includes(t as (typeof STRUCTURE_NODE_TYPES)[number]),
    ),
    docType: "",
    hideStructure: true,
  };
}

export function effectiveNodeTypes(filters: GraphFilterState): string[] | undefined {
  const hidden = filters.hideStructure ? [...STRUCTURE_NODE_TYPES] : [];
  const types = filters.nodeTypes.filter((t) => !hidden.includes(t as (typeof hidden)[number]));
  if (types.length === 0 || types.length >= EXPLORER_NODE_TYPES.length) {
    return types.length === 0 ? [] : undefined;
  }
  return types;
}
