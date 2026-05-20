import {
  createPool,
  getGraphCounts,
  PostgresChunkIndexStore,
  runMigrations,
} from "@kg/adapter-postgres";
import type { FastifyInstance } from "fastify";
import type { ApiEnv } from "../lib/env.js";
import { apiError } from "../lib/errors.js";

export async function registerStatsRoutes(
  app: FastifyInstance,
  env: ApiEnv,
): Promise<void> {
  app.get("/stats", async (_request, reply) => {
    await runMigrations("up", env.databaseUrl);
    const pool = createPool(env.databaseUrl);
    try {
      const counts = await getGraphCounts(pool);
      const indexStore = new PostgresChunkIndexStore(pool);
      const chunksMissingEmbeddings = await indexStore.countMissingEmbeddings();
      return {
        ok: true,
        ...counts,
        chunks_missing_embeddings: chunksMissingEmbeddings,
      };
    } catch (error) {
      reply.status(500);
      return apiError(
        error instanceof Error ? error.message : "Failed to load stats",
        "STATS_ERROR",
      );
    } finally {
      await pool.end();
    }
  });
}
