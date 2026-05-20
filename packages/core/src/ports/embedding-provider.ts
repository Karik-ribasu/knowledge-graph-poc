/** Vendor-neutral embedding port (Hexagonal). */
export interface EmbeddingProvider {
  readonly modelId: string;
  readonly dimensions: number;
  embed(texts: readonly string[]): Promise<number[][]>;
}

export const DEFAULT_EMBEDDING_DIMENSIONS = 1024;
