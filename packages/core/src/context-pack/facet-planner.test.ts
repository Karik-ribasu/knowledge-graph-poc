import { describe, expect, it } from "vitest";
import { planFacets } from "./facet-planner.js";
import { PACK_SECTION_IDS } from "./sections.js";
import type { Brief } from "./schema.js";

const baseBrief: Brief = {
  product: "NexusFlow",
  audience: "CTO enterprise",
  goal: "Conversão trial",
  tone: "Confiante",
  constraints: [],
  locale: "pt-BR",
};

describe("FacetPlanner", () => {
  it("maps brief to facets with queries per section", () => {
    const plans = planFacets(baseBrief);
    expect(plans.length).toBeGreaterThanOrEqual(7);
    for (const plan of plans) {
      expect(PACK_SECTION_IDS).toContain(plan.sectionId);
      expect(plan.queries.length).toBeGreaterThan(0);
      expect(plan.docTypes.length).toBeGreaterThan(0);
    }
    const totalQueries = plans.reduce((n, p) => n + p.queries.length, 0);
    expect(totalQueries).toBeGreaterThan(plans.length);
  });

  it("omits pricing facet when constraint forbids price", () => {
    const plans = planFacets({
      ...baseBrief,
      constraints: ["Não mencionar preço"],
    });
    expect(plans.some((p) => p.sectionId === "pricing")).toBe(false);
  });

  it("uses locale hint for non-pt locales", () => {
    const plans = planFacets({ ...baseBrief, locale: "en-US" });
    expect(plans[0]?.queries.some((q) => q.includes("en-US"))).toBe(false);
    expect(plans.some((p) => p.queries.join(" ").length > 0)).toBe(true);
  });

  it("adds technical queries for dev-facing audience", () => {
    const plans = planFacets(baseBrief);
    const features = plans.find((p) => p.sectionId === "features");
    expect(features?.queries.some((q) => /segurança|stack/i.test(q))).toBe(true);
    expect(features?.docTypes).toContain("technical");
  });
});
