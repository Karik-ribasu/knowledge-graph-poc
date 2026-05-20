import type { EmbeddingProvider } from "@kg/core";
import { DEFAULT_EMBEDDING_DIMENSIONS } from "@kg/core";

export const TRANSFORMERS_MODEL_ID = "Xenova/bge-m3";
export const EMBEDDING_DIMENSIONS = DEFAULT_EMBEDDING_DIMENSIONS;

export type TransformersEmbeddingConfig = {
  modelId?: string;
  normalize?: boolean;
};

type FeaturePipeline = (
  text: string,
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array | number[] }>;

let pipelinePromise: Promise<FeaturePipeline> | null = null;

async function getPipeline(modelId: string): Promise<FeaturePipeline> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      return (await pipeline("feature-extraction", modelId)) as FeaturePipeline;
    })();
  }
  return pipelinePromise;
}

export class TransformersEmbeddingProvider implements EmbeddingProvider {
  readonly modelId: string;
  readonly dimensions = EMBEDDING_DIMENSIONS;
  private readonly normalize: boolean;

  constructor(config: TransformersEmbeddingConfig = {}) {
    this.modelId = config.modelId ?? TRANSFORMERS_MODEL_ID;
    this.normalize = config.normalize ?? true;
  }

  async embed(texts: readonly string[]): Promise<number[][]> {
    const extractor = await getPipeline(this.modelId);
    const vectors: number[][] = [];

    for (const text of texts) {
      const output = await extractor(text, { pooling: "mean", normalize: this.normalize });
      const raw = output.data;
      const vector = Array.from(raw instanceof Float32Array ? raw : (raw as number[]));
      if (vector.length !== this.dimensions) {
        throw new Error(
          `Unexpected embedding dimension ${String(vector.length)} (expected ${String(this.dimensions)})`,
        );
      }
      vectors.push(vector);
    }

    return vectors;
  }
}

export function createTransformersEmbeddingProvider(
  config: TransformersEmbeddingConfig = {},
): TransformersEmbeddingProvider {
  return new TransformersEmbeddingProvider(config);
}
