import { describe, expect, it } from "vitest";
import { buildPathIndex, resolveWikilinkTarget } from "./ingest-workspace.js";

describe("wikilink resolution helpers", () => {
  it("resolves by basename and slug keys", () => {
    const index = buildPathIndex(
      ["C:/ws/corpus/business/zebra.md"],
      "C:/ws",
    );
    expect(resolveWikilinkTarget("zebra", index)).toBe("corpus/business/zebra.md");
    expect(resolveWikilinkTarget("zebra.md", index)).toBe("corpus/business/zebra.md");
    expect(resolveWikilinkTarget("missing", index)).toBeNull();
  });
});
