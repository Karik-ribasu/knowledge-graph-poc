import type { ExtractedEntity, ExtractedRelation, GtmExtractionResult, ParsedMarkdown } from "../domain/types.js";

const COMPETITOR_SECTION_RE = /concorrent|competidor|competição|competitive|competitor/i;
const OBJECTION_SECTION_RE = /obje[cç][ãa]o|objection/i;
const METRIC_SECTION_RE = /métrica|metric|kpi|resultado/i;
const PERSONA_HEADING_RE = /^#{1,3}\s+Persona:\s*(.+)$/im;
const COMPETITOR_BULLET_RE = /^\s*[-*]\s+\*\*([^*]+)\*\*/;
const OBJECTION_BULLET_RE = /^\s*[-*]\s+(?:\*\*)?([^*\n]+?)(?:\*\*)?\s*(?:—|-|:)/;
const METRIC_INLINE_RE =
  /\b(\d+(?:[.,]\d+)?\s*(?:%|percent)|(?:USD|EUR|BRL)\s*\d[\d.,]*|\d+(?:[.,]\d+)?\s*(?:ms|s|min|horas?))\b/gi;
const PHASE_HEADING_RE = /^(Q[1-4]\s+20\d{2})$/i;
const PRICING_ROW_RE = /^\|\s*([^|]+?)\s*\|/;

const DEFAULT_PRODUCT = "NexusFlow";

function fullText(parsed: ParsedMarkdown): string {
  const sectionBodies = parsed.sections.map((s) => `${s.heading}\n${s.body}`).join("\n\n");
  return `${parsed.preamble}\n\n${sectionBodies}`.trim();
}

function iterSections(parsed: ParsedMarkdown): Array<{ heading: string; body: string }> {
  const blocks: Array<{ heading: string; body: string }> = [];
  if (parsed.preamble.trim()) {
    blocks.push({ heading: parsed.title, body: parsed.preamble });
  }
  for (const section of parsed.sections) {
    blocks.push({ heading: section.heading, body: section.body });
  }
  return blocks;
}

function dedupeEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
  const seen = new Set<string>();
  const out: ExtractedEntity[] = [];
  for (const e of entities) {
    const key = `${e.nodeType}:${e.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

/** Rules-based extraction from headings and list patterns. */
export function extractWithRules(parsed: ParsedMarkdown, docId: string): GtmExtractionResult {
  const text = fullText(parsed);
  const entities: ExtractedEntity[] = [];
  const relations: ExtractedRelation[] = [];
  const path = parsed.relativePath;
  const blocks = iterSections(parsed);

  const personaName =
    parsed.title.match(/^Persona:\s*(.+)$/i)?.[1]?.trim() ??
    text.match(PERSONA_HEADING_RE)?.[1]?.trim() ??
    null;

  if (personaName) {
    const name = personaName;
    entities.push({
      nodeType: "Persona",
      name,
      properties: { source_doc_id: docId, source_path: path },
    });
  }

  if (/dores?\s+do\s+icp|icp/i.test(parsed.title) || /dores?\s+do\s+icp/i.test(text)) {
    entities.push({
      nodeType: "ICP",
      name: "Enterprise Revenue Teams",
      properties: { source_doc_id: docId, source_path: path, inferred: true },
    });
    relations.push({
      edgeType: "targetsICP",
      sourceType: "Product",
      sourceName: DEFAULT_PRODUCT,
      targetType: "ICP",
      targetName: "Enterprise Revenue Teams",
      properties: { source_doc_id: docId, inferred: true },
    });
  }

  for (const block of blocks) {
    const heading = block.heading;
    const body = block.body;

    const competitorContext =
      COMPETITOR_SECTION_RE.test(heading) ||
      COMPETITOR_SECTION_RE.test(parsed.title) ||
      /competidores/i.test(parsed.relativePath);

    if (competitorContext) {
      for (const line of body.split("\n")) {
        const m = line.match(COMPETITOR_BULLET_RE);
        if (!m?.[1]) continue;
        const name = m[1].trim();
        entities.push({
          nodeType: "Competitor",
          name,
          properties: { source_doc_id: docId, source_path: path },
        });
        relations.push({
          edgeType: "competesWith",
          sourceType: "Product",
          sourceName: DEFAULT_PRODUCT,
          targetType: "Competitor",
          targetName: name,
          properties: { source_doc_id: docId },
        });
      }
    }

    if (OBJECTION_SECTION_RE.test(heading)) {
      for (const line of body.split("\n")) {
        const m = line.match(OBJECTION_BULLET_RE);
        if (!m?.[1]) continue;
        const name = m[1].trim();
        entities.push({
          nodeType: "Objection",
          name,
          properties: { source_doc_id: docId, source_path: path },
        });
      }
    }

    if (METRIC_SECTION_RE.test(heading)) {
      const matches = body.matchAll(METRIC_INLINE_RE);
      for (const match of matches) {
        const name = match[0]?.trim();
        if (!name) continue;
        entities.push({
          nodeType: "Metric",
          name,
          properties: { source_doc_id: docId, source_path: path },
        });
        relations.push({
          edgeType: "measuredBy",
          sourceType: "Metric",
          sourceName: name,
          targetType: "Product",
          targetName: DEFAULT_PRODUCT,
          properties: { source_doc_id: docId },
        });
      }
    }

    const phaseMatch = heading.match(PHASE_HEADING_RE);
    if (phaseMatch?.[1]) {
      const phaseName = phaseMatch[1].trim();
      entities.push({
        nodeType: "Phase",
        name: phaseName,
        properties: { source_doc_id: docId, source_path: path },
      });
      relations.push({
        edgeType: "belongsToPhase",
        sourceType: "Product",
        sourceName: DEFAULT_PRODUCT,
        targetType: "Phase",
        targetName: phaseName,
        properties: { source_doc_id: docId },
      });
    }

    if (/precifica|pricing|planos/i.test(heading)) {
      for (const line of body.split("\n")) {
        const row = line.match(PRICING_ROW_RE);
        if (!row?.[1]) continue;
        const cell = row[1].trim();
        if (/^[-|]+$/.test(cell) || /^plano$/i.test(cell)) continue;
        entities.push({
          nodeType: "PricingTier",
          name: cell,
          properties: { source_doc_id: docId, source_path: path },
        });
        relations.push({
          edgeType: "pricedAs",
          sourceType: "Product",
          sourceName: DEFAULT_PRODUCT,
          targetType: "PricingTier",
          targetName: cell,
          properties: { source_doc_id: docId },
        });
      }
    }
  }

  const percentMetrics = text.matchAll(/\b(\d+(?:[.,]\d+)?%)\b/g);
  for (const match of percentMetrics) {
    const name = match[1];
    if (!name) continue;
    entities.push({
      nodeType: "Metric",
      name,
      properties: { source_doc_id: docId, source_path: path, context: "inline" },
    });
  }

  return {
    entities: dedupeEntities(entities),
    relations,
  };
}
