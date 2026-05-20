import { describe, expect, it } from "vitest";
import { extractWikilinks, stripWikilinks } from "./wikilinks.js";

describe("wikilinks", () => {
  it("extracts targets and aliases", () => {
    const links = extractWikilinks("See [[target]] and [[raw|alias]] and [[]]");
    expect(links).toEqual([
      { raw: "[[target]]", target: "target" },
      { raw: "[[raw|alias]]", target: "raw", alias: "alias" },
    ]);
    expect(extractWikilinks("no links")).toEqual([]);
    expect(stripWikilinks("[[a|b]] plain [[c]]")).toBe("b plain c");
  });
});
