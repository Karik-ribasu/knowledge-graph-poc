import { createPool, PostgresGraphReadRepository } from "@kg/adapter-postgres";
import { graphQuerySchema } from "@kg/core";
import type { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ApiEnv } from "../lib/env.js";
import { apiError } from "../lib/errors.js";

type GraphQuery = z.infer<typeof graphQuerySchema>;

function resolveHighlightPreset(q: GraphQuery): GraphQuery & { limit?: number } {
  if (!q.highlightMode || !q.seed) return q;
  if (q.highlightMode === "fileNeighborhood") {
    return { ...q, hops: q.hops ?? 1, limit: q.limit ?? 120 };
  }
  if (q.highlightMode === "chunkNeighborhood") {
    return { ...q, hops: q.hops ?? 1, limit: q.limit ?? 80 };
  }
  return q;
}

export async function registerGraphRoutes(
  app: FastifyInstance,
  env: ApiEnv,
): Promise<void> {
  app.get("/graph", async (request, reply) => {
    const parsed = graphQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.status(400);
      return apiError(parsed.error.message, "INVALID_QUERY");
    }

    const q = parsed.data;
    const preset = resolveHighlightPreset(q);
    const maxNodes = Math.min(preset.limit ?? env.graphMaxNodes, env.graphMaxNodes);
    const maxEdges = env.graphMaxEdges;

    const pool = createPool(env.databaseUrl);
    try {
      const repo = new PostgresGraphReadRepository(pool, {
        maxNodes: env.graphMaxNodes,
        maxEdges: env.graphMaxEdges,
      });
      const snapshot = await repo.getSnapshot({
        seed: preset.seed,
        hops: preset.hops,
        nodeTypes: preset.nodeTypes,
        docType: preset.docType,
        maxNodes,
        maxEdges,
      });
      return snapshot;
    } catch (error) {
      reply.status(500);
      return apiError(
        error instanceof Error ? error.message : "Failed to load graph",
        "GRAPH_ERROR",
      );
    } finally {
      await pool.end();
    }
  });
}
