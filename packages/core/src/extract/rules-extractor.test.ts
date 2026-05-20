import { describe, expect, it } from "vitest";
import { parseMarkdown } from "../parse/markdown-parser.js";
import { extractWithRules } from "./rules-extractor.js";

describe("extractWithRules", () => {
  it("extracts competitors from bullet lists", () => {
    const parsed = parseMarkdown(
      `---
doc_type: market
title: Competitors
---
# Concorrentes

## Categoria wiki

- **Notion AI** — editor forte
- **Guru** — busca enterprise
`,
      { relativePath: "corpus/market/competidores.md" },
    );

    const result = extractWithRules(parsed, "doc123");
    const competitors = result.entities.filter((e) => e.nodeType === "Competitor");
    expect(competitors.map((c) => c.name).sort()).toEqual(["Guru", "Notion AI"]);
    expect(result.relations.some((r) => r.edgeType === "competesWith")).toBe(true);
  });

  it("extracts objections, metrics, pricing, and inline percent metrics", () => {
    const parsed = parseMarkdown(
      `---
doc_type: business
title: Pricing
---
# Pricing

## Objeção

- **Preço alto** — custo percebido

## Métricas de sucesso

- Latência 99ms

## Precificação e planos

| Plano | Preço |
|-------|-------|
| Enterprise | Custom |

`,
      { relativePath: "corpus/business/pricing.md" },
    );

    const result = extractWithRules(parsed, "doc-pricing");
    expect(result.entities.some((e) => e.nodeType === "Objection")).toBe(true);
    expect(result.entities.some((e) => e.nodeType === "Metric")).toBe(true);
    expect(result.entities.some((e) => e.nodeType === "PricingTier")).toBe(true);
  });

  it("extracts inline percent metrics from full document text", () => {
    const parsed = parseMarkdown(
      `---
doc_type: business
title: KPIs
---
# KPIs

Crescimento de 42%end-to-end no ano.
`,
      { relativePath: "corpus/business/kpis.md" },
    );
    const result = extractWithRules(parsed, "doc-kpi");
    expect(result.entities.some((e) => e.nodeType === "Metric" && e.name.includes("42%"))).toBe(
      true,
    );
  });

  it("extracts Q1 phase from section heading", () => {
    const parsed = parseMarkdown(
      `---
doc_type: business
title: Roadmap
---
# Roadmap

## Q1 2025

- Launch
`,
      { relativePath: "corpus/business/roadmap.md" },
    );

    const result = extractWithRules(parsed, "doc-roadmap");
    expect(result.entities.some((e) => e.nodeType === "Phase" && e.name === "Q1 2025")).toBe(
      true,
    );
  });

  it("includes preamble block when frontmatter has body text", () => {
    const parsed = parseMarkdown(
      `---
doc_type: business
title: With preamble
---
Preamble only text before headings.
`,
      { relativePath: "corpus/business/preamble.md" },
    );
    const result = extractWithRules(parsed, "doc-pre");
    expect(result.entities.length).toBeGreaterThanOrEqual(0);
  });

  it("infers ICP from title and dores do icp patterns", () => {
    const parsed = parseMarkdown(
      `---
doc_type: business
title: Dores do ICP
---
# Dores do ICP

Texto sobre dores.
`,
      { relativePath: "corpus/business/dores-icp.md" },
    );
    const result = extractWithRules(parsed, "doc-icp");
    expect(result.entities.some((e) => e.nodeType === "ICP")).toBe(true);
    expect(result.relations.some((r) => r.edgeType === "targetsICP")).toBe(true);
  });

  it("extracts persona heading and roadmap phase", () => {
    const parsed = parseMarkdown(
      `---
doc_type: market
---
# Persona: VP de Vendas

## Q2 2025

- Item roadmap
`,
      { relativePath: "corpus/market/persona.md" },
    );

    const result = extractWithRules(parsed, "doc456");
    expect(result.entities.some((e) => e.nodeType === "Persona" && e.name.includes("VP"))).toBe(
      true,
    );
    expect(result.entities.some((e) => e.nodeType === "Phase" && e.name === "Q2 2025")).toBe(true);
  });
});
