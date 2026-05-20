import { describe, expect, it } from "vitest";
import { isPackSectionId, PACK_SECTION_IDS } from "./sections.js";

describe("pack sections", () => {
  it("validates section ids", () => {
    expect(PACK_SECTION_IDS).toContain("hero");
    expect(isPackSectionId("hero")).toBe(true);
    expect(isPackSectionId("unknown")).toBe(false);
  });
});
