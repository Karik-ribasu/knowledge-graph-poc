import type { ChunkRecord } from "../domain/types.js";

/** Attach 1-based line ranges using section headings and chunk text in the raw file. */
export function attachLineRangesToChunks(chunks: ChunkRecord[], raw: string): ChunkRecord[] {
  if (chunks.length === 0) return chunks;

  const lines = raw.split("\n");
  const headingStarts = new Map<string, number[]>();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    const match = line.match(/^#{2,3}\s+(.+?)\s*$/);
    if (!match?.[1]) continue;
    const heading = match[1].trim();
    const list = headingStarts.get(heading) ?? [];
    list.push(i + 1);
    headingStarts.set(heading, list);
  }

  const usedHeadingIdx = new Map<string, number>();

  return chunks.map((chunk) => {
    const heading = chunk.heading.trim();
    const occurrences = headingStarts.get(heading) ?? [];
    const used = usedHeadingIdx.get(heading) ?? 0;
    const startFromLine = occurrences[used] ?? 1;
    if (occurrences.length > used) {
      usedHeadingIdx.set(heading, used + 1);
    }

    const startIdx = lineIndexAt(lines, startFromLine - 1);
    const sectionEndIdx =
      occurrences[used + 1] !== undefined
        ? lineIndexAt(lines, occurrences[used + 1]! - 1)
        : raw.length;

    const sectionSlice = raw.slice(startIdx, sectionEndIdx);
    const needle = chunk.text.trim().slice(0, Math.min(120, chunk.text.trim().length));
    let relStart = 0;
    if (needle.length > 0) {
      const found = sectionSlice.indexOf(needle);
      relStart = found >= 0 ? found : 0;
    }

    const absStart = startIdx + relStart;
    const absEnd = absStart + Math.max(needle.length, chunk.text.length);
    const startLine = lineNumberAt(raw, absStart);
    const endLine = lineNumberAt(raw, Math.min(absEnd, raw.length - 1));

    return {
      ...chunk,
      startLine,
      endLine: Math.max(startLine, endLine),
    };
  });
}

function lineIndexAt(lines: string[], lineIndex: number): number {
  let offset = 0;
  for (let i = 0; i < lineIndex && i < lines.length; i++) {
    offset += lines[i]!.length + 1;
  }
  return offset;
}

function lineNumberAt(text: string, index: number): number {
  let line = 1;
  const clamped = Math.max(0, Math.min(index, text.length));
  for (let i = 0; i < clamped; i++) {
    if (text[i] === "\n") line++;
  }
  return line;
}
