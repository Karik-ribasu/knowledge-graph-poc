import { createPool, PostgresCorpusReadRepository } from "@kg/adapter-postgres";
import type { FastifyInstance } from "fastify";
import type { ApiEnv } from "../lib/env.js";
import { apiError } from "../lib/errors.js";

export async function registerCorpusRoutes(
  app: FastifyInstance,
  env: ApiEnv,
): Promise<void> {
  app.get("/corpus/tree", async (_request, reply) => {
    const pool = createPool(env.databaseUrl);
    try {
      const repo = new PostgresCorpusReadRepository(pool, env.workspaceRoot);
      return await repo.getTree();
    } catch (error) {
      reply.status(500);
      return apiError(
        error instanceof Error ? error.message : "Failed to load corpus tree",
        "CORPUS_TREE_ERROR",
      );
    } finally {
      await pool.end();
    }
  });

  app.get("/files/*", async (request, reply) => {
    const pathParam = (request.params as { "*": string })["*"];
    if (!pathParam) {
      reply.status(400);
      return apiError("File path is required", "INVALID_PATH");
    }

    const pool = createPool(env.databaseUrl);
    try {
      const repo = new PostgresCorpusReadRepository(pool, env.workspaceRoot);
      const file = await repo.getFileByPath(pathParam);
      if (!file) {
        reply.status(404);
        return apiError("File not found", "NOT_FOUND");
      }
      return file;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid path")) {
        reply.status(400);
        return apiError(error.message, "INVALID_PATH");
      }
      reply.status(500);
      return apiError(
        error instanceof Error ? error.message : "Failed to load file",
        "FILE_ERROR",
      );
    } finally {
      await pool.end();
    }
  });
}
