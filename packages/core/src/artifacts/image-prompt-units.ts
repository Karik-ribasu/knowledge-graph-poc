import matter from "gray-matter";

export interface ImagePromptUnits {
  frontmatterText: string;
  bodyText: string;
}

export function parseImagePromptUnits(raw: string): ImagePromptUnits {
  const parsed = matter(raw);
  const fmLines = Object.entries(parsed.data as Record<string, unknown>).map(([key, value]) => {
    const rendered =
      typeof value === "string" || typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : JSON.stringify(value);
    return `${key}: ${rendered}`;
  });

  return {
    frontmatterText: fmLines.join("\n").trim(),
    bodyText: parsed.content.trim(),
  };
}
