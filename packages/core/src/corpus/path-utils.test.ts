import { describe, expect, it } from "vitest";
import { folderPrefixesForFile, normalizeCorpusPath } from "./path-utils.js";

describe("corpus path-utils", () => {
  it("normalizes paths and rejects traversal", () => {
    expect(normalizeCorpusPath("corpus/a/b.md")).toBe("corpus/a/b.md");
    expect(() => normalizeCorpusPath("../etc/passwd")).toThrow();
  });

  it("lists folder prefixes for a file path", () => {
    expect(folderPrefixesForFile("corpus/gtm/playbook.md")).toEqual([
      "corpus",
      "corpus/gtm",
    ]);
  });
});
