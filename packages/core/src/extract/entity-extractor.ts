import type { GtmExtractionResult, ParsedMarkdown } from "../domain/types.js";
import { CursorEntityExtractor } from "./cursor-entity-extractor.js";
import { extractFromFrontmatter } from "./frontmatter-entities.js";
import { extractWithRules } from "./rules-extractor.js";

export type EntityExtractorMode = "rules" | "cursor" | "none";

export interface EntityExtractor {
  readonly mode: EntityExtractorMode;
  extract(parsed: ParsedMarkdown, docId: string): Promise<GtmExtractionResult>;
}

export class RulesEntityExtractor implements EntityExtractor {
  readonly mode = "rules" as const;

  async extract(parsed: ParsedMarkdown, docId: string): Promise<GtmExtractionResult> {
    const fromFm = extractFromFrontmatter(parsed, docId);
    const fromRules = extractWithRules(parsed, docId);
    return mergeExtractions(fromFm, fromRules);
  }
}

export class NoopEntityExtractor implements EntityExtractor {
  readonly mode = "none" as const;

  async extract(_parsed: ParsedMarkdown, _docId: string): Promise<GtmExtractionResult> {
    return { entities: [], relations: [] };
  }
}

function mergeExtractions(a: GtmExtractionResult, b: GtmExtractionResult): GtmExtractionResult {
  const entityKey = (e: { nodeType: string; name: string }) =>
    `${e.nodeType}:${e.name.toLowerCase()}`;
  const relationKey = (r: {
    edgeType: string;
    sourceType: string;
    sourceName: string;
    targetType: string;
    targetName: string;
  }) =>
    `${r.edgeType}:${r.sourceType}:${r.sourceName}:${r.targetType}:${r.targetName}`.toLowerCase();

  const entities = new Map<string, GtmExtractionResult["entities"][number]>();
  for (const e of [...a.entities, ...b.entities]) {
    entities.set(entityKey(e), e);
  }

  const relations = new Map<string, GtmExtractionResult["relations"][number]>();
  for (const r of [...a.relations, ...b.relations]) {
    relations.set(relationKey(r), r);
  }

  return {
    entities: [...entities.values()],
    relations: [...relations.values()],
  };
}

export function createEntityExtractor(mode: string | undefined): EntityExtractor {
  const normalized = (mode ?? "rules").toLowerCase();
  if (normalized === "none") return new NoopEntityExtractor();
  if (normalized === "cursor") {
    return createCursorEntityExtractor();
  }
  return new RulesEntityExtractor();
}

function createCursorEntityExtractor(): EntityExtractor {
  return new CursorEntityExtractor();
}
