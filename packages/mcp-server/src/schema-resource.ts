import {
  GTM_EDGE_TYPES,
  GTM_NODE_TYPES,
  PACK_SECTION_IDS,
  STRUCTURAL_EDGE_TYPES,
  STRUCTURAL_NODE_TYPES,
  briefSchema,
  contextPackSchema,
} from "@kg/core";

export const KG_SCHEMA_URI = "kg://schema";
export const KG_STATS_URI = "kg://stats";

export function buildSchemaResourcePayload(): Record<string, unknown> {
  return {
    ontology: {
      structural_node_types: STRUCTURAL_NODE_TYPES,
      gtm_node_types: GTM_NODE_TYPES,
      structural_edge_types: STRUCTURAL_EDGE_TYPES,
      gtm_edge_types: GTM_EDGE_TYPES,
    },
    context_pack: {
      section_ids: PACK_SECTION_IDS,
      brief_fields: Object.keys(briefSchema.shape),
      meta_fields: Object.keys(contextPackSchema.shape.meta.shape),
      section_shape: {
        content: "string (assembled markdown)",
        chunks: "array of { chunk_id, doc_id, path, heading, text, score? }",
      },
    },
    docs: "docs/04-ontologia-grafo.md, docs/06-fluxo-landing-page.md",
  };
}
