import { createHash } from "node:crypto";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import { DEFAULT_EMBEDDING_DIMENSIONS } from "../ports/embedding-provider.js";

export type HashEmbeddingProviderOptions = {
  dimensions?: number;
  modelId?: string;
};

function l2Normalize(vector: number[]): number[] {
  let sumSq = 0;
  for (const value of vector) {
    sumSq += value * value;
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vector;
  return vector.map((value) => value / norm);
}

/** Deterministic pseudo-embeddings for CI (dimension matches pgvector schema). */
export class HashEmbeddingProvider implements EmbeddingProvider {
  readonly modelId: string;
  readonly dimensions: number;

  constructor(options: HashEmbeddingProviderOptions = {}) {
    this.dimensions = options.dimensions ?? DEFAULT_EMBEDDING_DIMENSIONS;
    this.modelId = options.modelId ?? "hash-deterministic-v1";
  }

  async embed(texts: readonly string[]): Promise<number[][]> {
    return texts.map((text) => this.embedOne(text));
  }

  private embedOne(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);

    for (let round = 0; round < 4; round += 1) {
      const digest = createHash("sha256").update(`${text}:${String(round)}`, "utf8").digest();
      for (let index = 0; index < digest.length; index += 1) {
        const dim = (index + digest[index]! * (round + 1)) % this.dimensions;
        vector[dim] = (digest[index]! / 127.5) - 1;
      }
    }

    return l2Normalize(vector);
  }
}
