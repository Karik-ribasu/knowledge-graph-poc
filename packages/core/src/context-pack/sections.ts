/** Landing page sections produced by PackBuilder (Phase 4). */
export const PACK_SECTION_IDS = [
  "hero",
  "value_prop",
  "social_proof",
  "features",
  "objections",
  "pricing",
  "cta",
  "seo_meta",
] as const;

export type PackSectionId = (typeof PACK_SECTION_IDS)[number];

export function isPackSectionId(value: string): value is PackSectionId {
  return (PACK_SECTION_IDS as readonly string[]).includes(value);
}
