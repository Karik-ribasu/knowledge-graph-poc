import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { docIdFromPath } from "../domain/ids.js";
import { parseMarkdown } from "../parse/markdown-parser.js";
import { chunkDocument } from "./chunker.js";
import { estimateTokens } from "./tokens.js";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../parse/__fixtures__",
);

describe("chunkDocument", () => {
  it("chunks by headings with stable chunk_id", () => {
    const raw = readFileSync(join(fixtureDir, "sample.md"), "utf-8");
    const path = "corpus/business/sample.md";
    const docId = docIdFromPath(path);
    const parsed = parseMarkdown(raw, { relativePath: path });
    const first = chunkDocument(parsed, { docId, path });
    const second = chunkDocument(parsed, { docId, path });

    expect(first.chunks.map((c) => c.chunkId)).toEqual(second.chunks.map((c) => c.chunkId));
    expect(first.chunks.every((c) => c.path === path && c.heading.length > 0)).toBe(true);
    expect(first.chunks.every((c) => c.docId === docId)).toBe(true);
  });

  it("respects token target and overlap for long text", () => {
    const longParagraph = "word ".repeat(500).trim();
    const parsed = parseMarkdown(`## Section\n\n${longParagraph}`, {
      relativePath: "long.md",
    });
    const docId = docIdFromPath("long.md");
    const { chunks } = chunkDocument(parsed, {
      docId,
      path: "long.md",
      targetTokens: 100,
      overlapRatio: 0.1,
    });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBeLessThanOrEqual(150);
    }

    if (chunks.length >= 2) {
      const a = chunks[0]?.text ?? "";
      const b = chunks[1]?.text ?? "";
      const wordsA = a.split(/\s+/).slice(-5);
      const wordsB = b.split(/\s+/).slice(0, 8);
      const overlap = wordsA.some((w) => wordsB.includes(w));
      expect(overlap).toBe(true);
    }
  });

  it("splits long multi-sentence paragraphs", () => {
    const sentences = Array.from({ length: 40 }, (_, i) => `Sentence number ${String(i)} with extra words.`);
    const parsed = parseMarkdown(`## Section\n\n${sentences.join(" ")}`, {
      relativePath: "sentences.md",
    });
    const { chunks } = chunkDocument(parsed, {
      docId: docIdFromPath("sentences.md"),
      path: "sentences.md",
      targetTokens: 80,
      overlapRatio: 0.1,
    });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("splits oversized paragraphs without sentence boundaries", () => {
    const longWord = `${"token ".repeat(400)}end`;
    const parsed = parseMarkdown(`## Section\n\n${longWord}`, { relativePath: "huge.md" });
    const { chunks } = chunkDocument(parsed, {
      docId: docIdFromPath("huge.md"),
      path: "huge.md",
      targetTokens: 50,
      overlapRatio: 0.1,
    });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("isolates code blocks from chunk text", () => {
    const raw = readFileSync(join(fixtureDir, "sample.md"), "utf-8");
    const path = "corpus/business/sample.md";
    const parsed = parseMarkdown(raw, { relativePath: path });
    const { chunks } = chunkDocument(parsed, {
      docId: docIdFromPath(path),
      path,
    });
    expect(chunks.every((c) => !c.text.includes("```"))).toBe(true);
  });
});

describe("estimateTokens", () => {
  it("returns zero for empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });
});
