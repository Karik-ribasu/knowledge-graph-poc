import { describe, expect, it } from "vitest";
import { extractCodeBlocks } from "./code-blocks.js";

describe("extractCodeBlocks", () => {
  it("removes fenced blocks and records metadata", () => {
    const input = `# Title

Intro line.

\`\`\`ts
const x = 1;
\`\`\`

After.
`;
    const { textWithoutBlocks, codeBlocks } = extractCodeBlocks(input);
    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]?.language).toBe("ts");
    expect(codeBlocks[0]?.content).toContain("const x");
    expect(textWithoutBlocks).not.toContain("const x");
    expect(textWithoutBlocks).toContain("Intro line");
  });

  it("accepts fence without language tag", () => {
    const { codeBlocks } = extractCodeBlocks("```\ncode\n```");
    expect(codeBlocks[0]?.language).toBeNull();
  });

  it("handles unclosed fence at EOF", () => {
    const { codeBlocks } = extractCodeBlocks("```\nline\n");
    expect(codeBlocks).toHaveLength(1);
  });
});
