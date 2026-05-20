import type { Wikilink } from "../domain/types.js";

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function extractWikilinks(text: string): Wikilink[] {
  const links: Wikilink[] = [];
  let match: RegExpExecArray | null;
  WIKILINK_RE.lastIndex = 0;
  while ((match = WIKILINK_RE.exec(text)) !== null) {
    const target = match[1]?.trim() ?? "";
    const alias = match[2]?.trim();
    if (target.length > 0) {
      links.push({
        raw: match[0],
        target,
        ...(alias ? { alias } : {}),
      });
    }
  }
  return links;
}

export function stripWikilinks(text: string): string {
  return text.replace(WIKILINK_RE, (_m, target: string, alias?: string) => alias ?? target);
}
