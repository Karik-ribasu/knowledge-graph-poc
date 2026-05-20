import { describe, expect, it } from "vitest";
import { DEFAULT_OVERLAP_RATIO, DEFAULT_TARGET_TOKENS, estimateTokens } from "./tokens.js";

describe("estimateTokens", () => {
  it("returns 0 for empty text and ceil for content", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("   ")).toBe(0);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("a".repeat(9))).toBe(3);
    expect(DEFAULT_TARGET_TOKENS).toBe(400);
    expect(DEFAULT_OVERLAP_RATIO).toBe(0.1);
  });
});
