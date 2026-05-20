import { z } from "zod";
import { PACK_SECTION_IDS } from "./sections.js";

export const briefSchema = z.object({
  product: z.string().min(1),
  audience: z.string().min(1),
  goal: z.string().min(1),
  tone: z.string().min(1),
  constraints: z.array(z.string()).default([]),
  locale: z.string().min(2).default("pt-BR"),
});

export type Brief = z.infer<typeof briefSchema>;

export const packChunkProvenanceSchema = z.object({
  chunk_id: z.string().min(1),
  doc_id: z.string().min(1),
  path: z.string().min(1),
  heading: z.string(),
});

export type PackChunkProvenance = z.infer<typeof packChunkProvenanceSchema>;

export const packSectionChunkSchema = packChunkProvenanceSchema.extend({
  text: z.string(),
  score: z.number().optional(),
});

export type PackSectionChunk = z.infer<typeof packSectionChunkSchema>;

export const packSectionSchema = z.object({
  content: z.string(),
  chunks: z.array(packSectionChunkSchema),
});

export type PackSection = z.infer<typeof packSectionSchema>;

const sectionsRecordSchema = z.object(
  Object.fromEntries(PACK_SECTION_IDS.map((id) => [id, packSectionSchema])) as {
    [K in (typeof PACK_SECTION_IDS)[number]]: typeof packSectionSchema;
  },
);

export const contextPackSchema = z.object({
  brief: briefSchema,
  sections: sectionsRecordSchema,
  meta: z.object({
    token_estimate: z.number().int().nonnegative(),
    facets_covered: z.array(z.string()),
    duration_ms: z.number().int().nonnegative().optional(),
  }),
});

export type ContextPack = z.infer<typeof contextPackSchema>;

export function parseBriefJson(input: unknown): Brief {
  return briefSchema.parse(input);
}

export function parseContextPackJson(input: unknown): ContextPack {
  return contextPackSchema.parse(input);
}

/** Empty section shell for all landing sections. */
export function emptyPackSections(): Record<(typeof PACK_SECTION_IDS)[number], PackSection> {
  const empty: Record<(typeof PACK_SECTION_IDS)[number], PackSection> = {
    hero: { content: "", chunks: [] },
    value_prop: { content: "", chunks: [] },
    social_proof: { content: "", chunks: [] },
    features: { content: "", chunks: [] },
    objections: { content: "", chunks: [] },
    pricing: { content: "", chunks: [] },
    cta: { content: "", chunks: [] },
    seo_meta: { content: "", chunks: [] },
  };
  return empty;
}
