import { describe, expect, it } from "vitest";
import { parseMarkdown } from "../parse/markdown-parser.js";
import { extractFromFrontmatter } from "./frontmatter-entities.js";

describe("extractFromFrontmatter", () => {
  it("maps product, icp, competitors and relations", () => {
    const parsed = parseMarkdown(
      `---
doc_type: business
product: NexusFlow
icp: Enterprise CTO
competitors:
  - Pinecone
  - Notion AI
features:
  - Hybrid Search
objections:
  - Vendor lock-in
---
# Doc
`,
      { relativePath: "corpus/business/sample.md" },
    );

    const result = extractFromFrontmatter(parsed, "doc1");
    expect(result.entities.some((e) => e.nodeType === "Product" && e.name === "NexusFlow")).toBe(
      true,
    );
    expect(result.relations.some((r) => r.edgeType === "targetsICP")).toBe(true);
    expect(result.relations.some((r) => r.edgeType === "competesWith")).toBe(true);
    expect(result.relations.some((r) => r.edgeType === "hasFeature")).toBe(true);
    expect(result.relations.some((r) => r.edgeType === "addressesObjection")).toBe(true);
  });

  it("maps feature proof, pricing, channels, and phase field", () => {
    const parsed = parseMarkdown(
      `---
doc_type: business
product: NexusFlow
features:
  - Hybrid Search
proof_points:
  - Case ACME
pricing_tiers:
  - Enterprise
channels:
  - Slack
metrics:
  - NRR
phase: Q1 2025
---
# Doc
`,
      { relativePath: "corpus/business/full.md" },
    );

    const result = extractFromFrontmatter(parsed, "doc3");
    expect(result.relations.some((r) => r.edgeType === "supportedBy")).toBe(true);
    expect(result.relations.some((r) => r.edgeType === "pricedAs")).toBe(true);
    expect(result.relations.some((r) => r.edgeType === "distributedVia")).toBe(true);
    expect(result.entities.some((e) => e.nodeType === "Phase" && e.name === "Q1 2025")).toBe(
      true,
    );
  });

  it("maps channels, metrics, and roadmap_phase", () => {
    const parsed = parseMarkdown(
      `---
doc_type: business
product: NexusFlow
channels:
  - Slack
metrics:
  - NRR 120%
roadmap_phase: Q2 2025
---
# Doc
`,
      { relativePath: "corpus/business/gtm.md" },
    );

    const result = extractFromFrontmatter(parsed, "doc2");
    expect(result.entities.some((e) => e.nodeType === "Channel")).toBe(true);
    expect(result.relations.some((r) => r.edgeType === "measuredBy")).toBe(true);
    expect(result.entities.some((e) => e.nodeType === "Phase" && e.name === "Q2 2025")).toBe(true);
    expect(result.relations.some((r) => r.edgeType === "belongsToPhase")).toBe(true);
  });
});
