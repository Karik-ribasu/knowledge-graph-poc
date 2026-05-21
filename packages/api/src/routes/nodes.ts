import { createPool, PostgresGraphReadRepository } from "@kg/adapter-postgres";
import type { FastifyInstance } from "fastify";
import type { ApiEnv } from "../lib/env.js";
import { apiError } from "../lib/errors.js";

export async function registerNodeRoutes(
  app: FastifyInstance,
  env: ApiEnv,
): Promise<void> {
  app.get<{ Params: { nodeId: string } }>("/nodes/:nodeId", async (request, reply) => {
    const { nodeId } = request.params;
    if (!nodeId?.trim()) {
      reply.status(400);
      return apiError("nodeId is required", "INVALID_PARAMS");
    }

    const pool = createPool(env.databaseUrl);
    try {
      const repo = new PostgresGraphReadRepository(pool, {
        maxNodes: env.graphMaxNodes,
        maxEdges: env.graphMaxEdges,
      });
      const detail = await repo.getNodeDetail(nodeId);
      if (!detail) {
        reply.status(404);
        return apiError(`Node not found: ${nodeId}`, "NOT_FOUND");
      }
      return detail;
    } catch (error) {
      reply.status(500);
      return apiError(
        error instanceof Error ? error.message : "Failed to load node",
        "NODE_ERROR",
      );
    } finally {
      await pool.end();
    }
  });
}
