/** Rough token estimate (~4 chars per token for Latin scripts). */
export function estimateTokens(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return Math.max(1, Math.ceil(trimmed.length / 4));
}

export const DEFAULT_TARGET_TOKENS = 400;
export const DEFAULT_OVERLAP_RATIO = 0.1;
