import { createPool, PostgresGraphReadRepository, runMigrations } from "@kg/adapter-postgres";
import { searchQuerySchema } from "@kg/core";
import type { FastifyInstance } from "fastify";
import type { ApiEnv } from "../lib/env.js";
import { apiError } from "../lib/errors.js";

export async function registerSearchRoutes(
  app: FastifyInstance,
  env: ApiEnv,
): Promise<void> {
  app.get("/search", async (request, reply) => {
    const parsed = searchQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.status(400);
      return apiError(parsed.error.message, "INVALID_QUERY");
    }

    await runMigrations("up", env.databaseUrl);
    const pool = createPool(env.databaseUrl);
    try {
      const repo = new PostgresGraphReadRepository(pool, {
        maxNodes: env.graphMaxNodes,
        maxEdges: env.graphMaxEdges,
      });
      const results = await repo.searchNodes(parsed.data.q, parsed.data.limit);
      return { results };
    } catch (error) {
      reply.status(500);
      return apiError(
        error instanceof Error ? error.message : "Search failed",
        "SEARCH_ERROR",
      );
    } finally {
      await pool.end();
    }
  });
}
