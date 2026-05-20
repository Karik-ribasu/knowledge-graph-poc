import matter from "gray-matter";
import type { ParsedMarkdown, ParsedSection } from "../domain/types.js";
import { extractCodeBlocks } from "./code-blocks.js";
import { extractWikilinks } from "./wikilinks.js";

const HEADING_RE = /^(#{2,3})\s+(.+?)\s*$/;

function headingLevel(markers: string): 2 | 3 {
  return markers.length === 2 ? 2 : 3;
}

function readTitle(frontmatter: Record<string, unknown>, body: string): string {
  const fmTitle = frontmatter.title;
  if (typeof fmTitle === "string" && fmTitle.trim().length > 0) return fmTitle.trim();
  const h1 = body.match(/^#\s+(.+?)\s*$/m);
  if (h1?.[1]) return h1[1].trim();
  return "Untitled";
}

function readDocType(frontmatter: Record<string, unknown>): string | null {
  const docType = frontmatter.doc_type ?? frontmatter.type;
  return typeof docType === "string" ? docType : null;
}

function parseSections(body: string, documentTitle: string): {
  preamble: string;
  preambleCodeBlocks: ParsedMarkdown["preambleCodeBlocks"];
  preambleWikilinks: ParsedMarkdown["preambleWikilinks"];
  sections: ParsedSection[];
} {
  const lines = body.split("\n");
  const sections: ParsedSection[] = [];
  const preambleLines: string[] = [];
  let currentHeading: string | null = null;
  let currentLevel: 2 | 3 = 2;
  let currentLines: string[] = [];
  let ordinal = 0;

  const flushSection = (): void => {
    if (currentHeading === null) {
      preambleLines.push(...currentLines);
      currentLines = [];
      return;
    }
    const raw = currentLines.join("\n").trim();
    const { textWithoutBlocks, codeBlocks } = extractCodeBlocks(raw);
    const wikilinks = extractWikilinks(raw);
    sections.push({
      heading: currentHeading,
      level: currentLevel,
      ordinal,
      body: textWithoutBlocks,
      codeBlocks,
      wikilinks,
    });
    ordinal += 1;
    currentLines = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch?.[1] && headingMatch[2]) {
      flushSection();
      currentHeading = headingMatch[2].trim();
      currentLevel = headingLevel(headingMatch[1]);
      continue;
    }
    if (/^#\s+/.test(line) && currentHeading === null) {
      continue;
    }
    currentLines.push(line);
  }
  flushSection();

  const preambleRaw = preambleLines.join("\n").trim();
  const { textWithoutBlocks, codeBlocks } = extractCodeBlocks(preambleRaw);
  const preambleWikilinks = extractWikilinks(preambleRaw);

  if (sections.length === 0 && textWithoutBlocks.length > 0) {
    sections.push({
      heading: documentTitle,
      level: 2,
      ordinal: 0,
      body: textWithoutBlocks,
      codeBlocks,
      wikilinks: preambleWikilinks,
    });
    return { preamble: "", preambleCodeBlocks: [], preambleWikilinks: [], sections };
  }

  return {
    preamble: textWithoutBlocks,
    preambleCodeBlocks: codeBlocks,
    preambleWikilinks,
    sections,
  };
}

export interface MarkdownParserOptions {
  relativePath: string;
}

/** Parse markdown into structural AST (frontmatter, sections, wikilinks, code blocks). */
export function parseMarkdown(raw: string, options: MarkdownParserOptions): ParsedMarkdown {
  const { data, content } = matter(raw);
  const frontmatter = data as Record<string, unknown>;
  const title = readTitle(frontmatter, content);
  const docType = readDocType(frontmatter);
  const { preamble, preambleCodeBlocks, preambleWikilinks, sections } = parseSections(
    content,
    title,
  );

  const allWikilinks = [
    ...preambleWikilinks,
    ...sections.flatMap((s) => s.wikilinks),
  ];
  const allCodeBlocks = [
    ...preambleCodeBlocks,
    ...sections.flatMap((s) => s.codeBlocks),
  ];

  return {
    relativePath: options.relativePath,
    frontmatter,
    title,
    docType,
    preamble,
    preambleCodeBlocks,
    preambleWikilinks,
    sections,
    wikilinks: allWikilinks,
    codeBlocks: allCodeBlocks,
  };
}
