/** Stable slug for entity ids (ASCII, lowercase, hyphenated). */
export function slugify(value: string): string {
  const ascii = value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
  const slug = ascii.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug.slice(0, 80) : "unnamed";
}
