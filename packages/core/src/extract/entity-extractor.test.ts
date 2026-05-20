import { describe, expect, it, vi } from "vitest";
import { parseMarkdown } from "../parse/markdown-parser.js";
import {
  createEntityExtractor,
  NoopEntityExtractor,
  RulesEntityExtractor,
} from "./entity-extractor.js";

describe("entity extractors", () => {
  const parsed = parseMarkdown(
    `---
doc_type: business
title: T
---
# T

## One
- **Acme** — competitor
`,
    { relativePath: "corpus/business/t.md" },
  );

  it("rules extractor merges frontmatter and rules", async () => {
    const extractor = new RulesEntityExtractor();
    const result = await extractor.extract(parsed, "doc1");
    expect(result.entities.length).toBeGreaterThan(0);
  });

  it("noop extractor returns empty graph", async () => {
    const extractor = new NoopEntityExtractor();
    const result = await extractor.extract(parsed, "doc1");
    expect(result).toEqual({ entities: [], relations: [] });
  });

  it("createEntityExtractor respects mode", async () => {
    expect(createEntityExtractor("none").mode).toBe("none");
    expect(createEntityExtractor("rules").mode).toBe("rules");
    expect(createEntityExtractor(undefined).mode).toBe("rules");

    vi.stubEnv("CURSOR_API_KEY", "");
    expect(createEntityExtractor("cursor").mode).toBe("cursor");
    const cursorResult = await createEntityExtractor("cursor").extract(parsed, "doc1");
    expect(cursorResult.entities.length).toBeGreaterThan(0);
    vi.unstubAllEnvs();
  });
});
