export interface VolSection {
  heading: string;
  body: string;
  ordinal: number;
}

const SECTION_HEADING_RE = /^##\s+(.+?)\s*$/;

/** Chunk vol-* markdown volumes by level-2 (##) sections. */
export function chunkVolMarkdownBySections(raw: string): VolSection[] {
  const lines = raw.split("\n");
  const sections: VolSection[] = [];
  let currentHeading: string | null = null;
  let currentLines: string[] = [];
  let ordinal = 0;

  const flush = (): void => {
    if (currentHeading === null) return;
    const body = currentLines.join("\n").trim();
    if (body.length > 0) {
      sections.push({ heading: currentHeading, body, ordinal });
      ordinal += 1;
    }
    currentLines = [];
  };

  for (const line of lines) {
    const match = SECTION_HEADING_RE.exec(line);
    if (match?.[1]) {
      flush();
      currentHeading = match[1].trim();
      continue;
    }
    if (currentHeading !== null) {
      currentLines.push(line);
    }
  }

  flush();
  return sections;
}
