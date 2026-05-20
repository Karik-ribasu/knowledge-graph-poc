import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseMarkdown } from "./markdown-parser.js";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__");

describe("parseMarkdown", () => {
  it("parses fixture into structural AST (snapshot)", () => {
    const raw = readFileSync(join(fixtureDir, "sample.md"), "utf-8");
    const parsed = parseMarkdown(raw, { relativePath: "corpus/business/sample.md" });

    const snapshot = {
      relativePath: parsed.relativePath,
      title: parsed.title,
      docType: parsed.docType,
      frontmatterKeys: Object.keys(parsed.frontmatter).sort(),
      preambleLength: parsed.preamble.length,
      sectionHeadings: parsed.sections.map((s) => ({
        heading: s.heading,
        level: s.level,
        ordinal: s.ordinal,
        bodyPreview: s.body.slice(0, 40),
        wikilinkTargets: s.wikilinks.map((w) => w.target),
        codeBlockLanguages: s.codeBlocks.map((b) => b.language),
      })),
      allWikilinkTargets: parsed.wikilinks.map((w) => w.target),
      codeBlockCount: parsed.codeBlocks.length,
    };

    expect(snapshot).toMatchSnapshot();
  });

  it("promotes preamble-only body to a single section when no headings", () => {
    const parsed = parseMarkdown("Intro without headings.\n\nSecond paragraph.", {
      relativePath: "corpus/business/plain.md",
    });
    expect(parsed.sections).toHaveLength(1);
    expect(parsed.sections[0]?.body).toContain("Intro without headings");
    expect(parsed.preamble).toBe("");
  });

  it("keeps code blocks separate from section body", () => {
    const raw = readFileSync(join(fixtureDir, "sample.md"), "utf-8");
    const parsed = parseMarkdown(raw, { relativePath: "x.md" });
    const second = parsed.sections.find((s) => s.heading === "Second Section");
    expect(second?.body).not.toContain("```");
    expect(second?.codeBlocks).toHaveLength(1);
    expect(second?.codeBlocks[0]?.content).toContain("echo hello");
  });
});
