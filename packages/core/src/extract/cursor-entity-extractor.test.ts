import { describe, expect, it, vi } from "vitest";
import { parseMarkdown } from "../parse/markdown-parser.js";
import { CursorEntityExtractor } from "./cursor-entity-extractor.js";

describe("CursorEntityExtractor", () => {
  const parsed = parseMarkdown(
    `---
doc_type: market
title: C
---
# C

## Competitors
- **Foo** — bar
`,
    { relativePath: "corpus/market/c.md" },
  );

  it("falls back to rules without API key", async () => {
    vi.stubEnv("CURSOR_API_KEY", "");
    const extractor = new CursorEntityExtractor();
    const result = await extractor.extract(parsed, "doc1");
    expect(result.entities.some((e) => e.nodeType === "Competitor")).toBe(true);
    vi.unstubAllEnvs();
  });

  it("uses rules stub when API key is set", async () => {
    vi.stubEnv("CURSOR_API_KEY", "test-key");
    const extractor = new CursorEntityExtractor();
    const result = await extractor.extract(parsed, "doc1");
    expect(result.entities.length).toBeGreaterThan(0);
    vi.unstubAllEnvs();
  });
});
