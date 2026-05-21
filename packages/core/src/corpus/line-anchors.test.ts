import { describe, expect, it } from "vitest";
import type { ChunkRecord } from "../domain/types.js";
import { attachLineRangesToChunks } from "./line-anchors.js";

describe("attachLineRangesToChunks", () => {
  it("maps chunks to distinct line ranges by heading", () => {
    const raw = `---
doc_type: market
---
# Title

## Section A
Alpha paragraph.

## Section B
Beta paragraph.
`;
    const chunks: ChunkRecord[] = [
      {
        chunkId: "c1",
        docId: "d1",
        sectionId: "s1",
        heading: "Section A",
        text: "Alpha paragraph.",
        tokenCount: 3,
        path: "corpus/a.md",
        startLine: 0,
        endLine: 0,
      },
      {
        chunkId: "c2",
        docId: "d1",
        sectionId: "s2",
        heading: "Section B",
        text: "Beta paragraph.",
        tokenCount: 3,
        path: "corpus/a.md",
        startLine: 0,
        endLine: 0,
      },
    ];

    const out = attachLineRangesToChunks(chunks, raw);
    expect(out[0]?.startLine).toBeGreaterThan(1);
    expect(out[1]?.startLine).toBeGreaterThan(out[0]!.startLine!);
    expect(out[0]?.endLine).toBeGreaterThanOrEqual(out[0]!.startLine!);
  });
});
