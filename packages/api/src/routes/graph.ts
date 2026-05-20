import { createPool, PostgresGraphReadRepository, runMigrations } from "@kg/adapter-postgres";
import { graphQuerySchema } from "@kg/core";
import type { FastifyInstance } from "fastify";
import type { ApiEnv } from "../lib/env.js";
import { apiError } from "../lib/errors.js";

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
    const maxNodes = Math.min(q.limit ?? env.graphMaxNodes, env.graphMaxNodes);
    const maxEdges = env.graphMaxEdges;

    await runMigrations("up", env.databaseUrl);
    const pool = createPool(env.databaseUrl);
    try {
      const repo = new PostgresGraphReadRepository(pool, {
        maxNodes: env.graphMaxNodes,
        maxEdges: env.graphMaxEdges,
      });
      const snapshot = await repo.getSnapshot({
        seed: q.seed,
        hops: q.hops,
        nodeTypes: q.nodeTypes,
        docType: q.docType,
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
