import { describe, expect, it } from "vitest";
import { flattenJsonForIndex, flattenedFieldsToIndexText } from "./json-flatten.js";

describe("flattenJsonForIndex", () => {
  it("flattens nested fields and marks rationale strings", () => {
    const data = {
      venture_name: "B4U.bet",
      executive_summary: {
        narrative_summary: "Long narrative about sports intelligence and responsible gaming.",
      },
      key_metrics: { market_tam_usd: 4200000000 },
    };

    const fields = flattenJsonForIndex(data);
    const paths = fields.map((f) => f.path);

    expect(paths).toContain("venture_name");
    expect(paths).toContain("executive_summary.narrative_summary");
    expect(paths).toContain("key_metrics.market_tam_usd");

    const narrative = fields.find((f) => f.path === "executive_summary.narrative_summary");
    expect(narrative?.isRationale).toBe(true);

    const units = flattenedFieldsToIndexText(fields);
    expect(units.some((u) => u.includes("[rationale]"))).toBe(true);
    expect(units.some((u) => u.includes("venture_name"))).toBe(true);
  });
});
