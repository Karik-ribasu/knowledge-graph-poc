import { chunkIdFromParts, sectionIdFromParts } from "../domain/ids.js";
import type { ChunkRecord, ParsedMarkdown, ParsedSection, SectionRecord } from "../domain/types.js";
import {
  DEFAULT_OVERLAP_RATIO,
  DEFAULT_TARGET_TOKENS,
  estimateTokens,
} from "./tokens.js";

export interface ChunkerOptions {
  targetTokens?: number;
  overlapRatio?: number;
  docId: string;
  path: string;
}

export interface ChunkerResult {
  sections: SectionRecord[];
  chunks: ChunkRecord[];
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function splitWithOverlap(
  text: string,
  targetTokens: number,
  overlapTokens: number,
): string[] {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length === 0) return [];

  const parts: string[] = [];
  let buffer: string[] = [];
  let bufferTokens = 0;

  const flush = (): void => {
    if (buffer.length === 0) return;
    parts.push(buffer.join("\n\n"));
    buffer = [];
    bufferTokens = 0;
  };

  const carryOverlap = (chunkText: string): string[] => {
    if (overlapTokens <= 0) return [];
    const words = chunkText.split(/\s+/).filter(Boolean);
    const overlapWords = Math.max(1, Math.ceil(overlapTokens / 1.3));
    return words.slice(-overlapWords);
  };

  for (const paragraph of paragraphs) {
    const paraTokens = estimateTokens(paragraph);
    if (paraTokens > targetTokens) {
      flush();
      const sentences = paragraph.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
      const units =
        sentences.length > 1
          ? sentences
          : paragraph.split(/\s+/).filter((w) => w.length > 0);
      for (const unit of units) {
        const unitTokens = estimateTokens(unit);
        if (bufferTokens + unitTokens > targetTokens && buffer.length > 0) {
          const chunkText = buffer.join(sentences.length > 1 ? "\n\n" : " ");
          parts.push(chunkText);
          buffer = carryOverlap(chunkText);
          bufferTokens = estimateTokens(buffer.join(" "));
        }
        buffer.push(unit);
        bufferTokens += unitTokens;
      }
      continue;
    }

    if (bufferTokens + paraTokens > targetTokens && buffer.length > 0) {
      const chunkText = buffer.join("\n\n");
      parts.push(chunkText);
      buffer = carryOverlap(chunkText);
      bufferTokens = estimateTokens(buffer.join(" "));
    }
    buffer.push(paragraph);
    bufferTokens += paraTokens;
  }
  flush();
  return parts.length > 0 ? parts : [text.trim()];
}

function chunkSection(
  section: ParsedSection,
  options: ChunkerOptions,
  targetTokens: number,
  overlapTokens: number,
): ChunkRecord[] {
  const sectionId = sectionIdFromParts(options.docId, section.heading, section.ordinal);
  const body = section.body.trim();
  if (body.length === 0) return [];

  const texts =
    estimateTokens(body) <= targetTokens
      ? [body]
      : splitWithOverlap(body, targetTokens, overlapTokens);

  return texts.map((text, index) => ({
    chunkId: chunkIdFromParts(options.docId, section.heading, index),
    docId: options.docId,
    sectionId,
    heading: section.heading,
    text,
    tokenCount: estimateTokens(text),
    path: options.path,
  }));
}

/** Chunk parsed markdown by section headings (~400 tokens, 10% overlap). */
export function chunkDocument(
  parsed: ParsedMarkdown,
  options: ChunkerOptions,
): ChunkerResult {
  const targetTokens = options.targetTokens ?? DEFAULT_TARGET_TOKENS;
  const overlapRatio = options.overlapRatio ?? DEFAULT_OVERLAP_RATIO;
  const overlapTokens = Math.floor(targetTokens * overlapRatio);

  const sections: SectionRecord[] = [];
  const chunks: ChunkRecord[] = [];

  const allSections: ParsedSection[] = [...parsed.sections];
  if (parsed.preamble.trim().length > 0 && parsed.sections.length > 0) {
    allSections.unshift({
      heading: parsed.title,
      level: 2,
      ordinal: -1,
      body: parsed.preamble,
      codeBlocks: parsed.preambleCodeBlocks,
      wikilinks: parsed.preambleWikilinks,
    });
  }

  for (const section of allSections) {
    const ordinal = section.ordinal < 0 ? 0 : section.ordinal;
    const sectionId = sectionIdFromParts(options.docId, section.heading, ordinal);
    sections.push({
      sectionId,
      docId: options.docId,
      heading: section.heading,
      level: section.level,
      ordinal,
    });
    chunks.push(
      ...chunkSection(
        { ...section, ordinal },
        options,
        targetTokens,
        overlapTokens,
      ),
    );
  }

  return { sections, chunks };
}
