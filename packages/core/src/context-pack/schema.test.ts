import { describe, expect, it } from "vitest";
import {
  briefSchema,
  contextPackSchema,
  emptyPackSections,
  parseBriefJson,
  parseContextPackJson,
} from "./schema.js";
import { PACK_SECTION_IDS } from "./sections.js";

const sampleBrief = {
  product: "NexusFlow",
  audience: "Revenue Ops enterprise",
  goal: "Agendar demo",
  tone: "Confiante, técnico-leve",
  constraints: ["PT-BR"],
  locale: "pt-BR",
};

describe("context-pack schema", () => {
  it("round-trips brief JSON", () => {
    const json = JSON.stringify(sampleBrief);
    const parsed = parseBriefJson(JSON.parse(json) as unknown);
    expect(parsed).toEqual(sampleBrief);
    expect(briefSchema.parse(parsed)).toEqual(parsed);
  });

  it("defaults constraints and locale", () => {
    const minimal = briefSchema.parse({
      product: "X",
      audience: "Y",
      goal: "Z",
      tone: "T",
    });
    expect(minimal.constraints).toEqual([]);
    expect(minimal.locale).toBe("pt-BR");
  });

  it("validates full ContextPack with all sections", () => {
    const sections = emptyPackSections();
    sections.hero = {
      content: "Headline",
      chunks: [
        {
          chunk_id: "c1",
          doc_id: "d1",
          path: "corpus/business/x.md",
          heading: "## Hero",
          text: "Headline",
        },
      ],
    };

    const pack = {
      brief: sampleBrief,
      sections,
      meta: { token_estimate: 10, facets_covered: ["hero"] },
    };

    const parsed = parseContextPackJson(pack);
    expect(parsed.sections.hero.chunks).toHaveLength(1);
    expect(PACK_SECTION_IDS.every((id) => id in parsed.sections)).toBe(true);
    expect(contextPackSchema.parse(JSON.parse(JSON.stringify(pack)))).toEqual(parsed);
  });
});
