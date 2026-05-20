import type { CodeBlock } from "../domain/types.js";

export interface ExtractedCodeBlocks {
  textWithoutBlocks: string;
  codeBlocks: CodeBlock[];
}

/**
 * Extract fenced ``` code blocks from markdown body.
 * Replaced regions are omitted from chunk text; blocks kept separately.
 */
export function extractCodeBlocks(body: string): ExtractedCodeBlocks {
  const codeBlocks: CodeBlock[] = [];
  const lines = body.split("\n");
  const out: string[] = [];
  let i = 0;
  let lineNo = 1;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const language = fence[1]?.length ? fence[1] : null;
      const startLine = lineNo;
      const blockLines: string[] = [];
      i += 1;
      lineNo += 1;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        blockLines.push(lines[i] ?? "");
        i += 1;
        lineNo += 1;
      }
      if (i < lines.length) {
        i += 1;
        lineNo += 1;
      }
      codeBlocks.push({
        language,
        content: blockLines.join("\n"),
        startLine,
      });
      continue;
    }
    out.push(line);
    i += 1;
    lineNo += 1;
  }

  return {
    textWithoutBlocks: out.join("\n").trim(),
    codeBlocks,
  };
}
