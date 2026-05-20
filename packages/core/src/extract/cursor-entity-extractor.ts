import type { EntityExtractor } from "./entity-extractor.js";
import type { GtmExtractionResult, ParsedMarkdown } from "../domain/types.js";
import { RulesEntityExtractor } from "./entity-extractor.js";

/**
 * Optional Cursor SDK extractor (P1 stub).
 * Falls back to rules when CURSOR_API_KEY is unset.
 */
export class CursorEntityExtractor implements EntityExtractor {
  readonly mode = "cursor" as const;
  private readonly fallback = new RulesEntityExtractor();

  async extract(parsed: ParsedMarkdown, docId: string): Promise<GtmExtractionResult> {
    const apiKey = process.env.CURSOR_API_KEY?.trim();
    if (!apiKey) {
      return this.fallback.extract(parsed, docId);
    }

    // Minimal stub: future Agent.prompt + JSON schema; rules suffice for POC.
    return this.fallback.extract(parsed, docId);
  }
}
