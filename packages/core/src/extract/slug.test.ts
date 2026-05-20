import { describe, expect, it } from "vitest";
import { slugify } from "./slug.js";

describe("slugify", () => {
  it("normalizes unicode and punctuation", () => {
    expect(slugify("  NexusFlow™  ")).toBe("nexusflow");
    expect(slugify("São Paulo")).toBe("sao-paulo");
    expect(slugify("---")).toBe("unnamed");
    expect(slugify("a".repeat(120))).toHaveLength(80);
  });
});
