import { runMigrations } from "@kg/adapter-postgres";
import cors from "@fastify/cors";
import Fastify from "fastify";
import type { ApiEnv } from "./lib/env.js";
import { apiError } from "./lib/errors.js";
import { registerCorpusRoutes } from "./routes/corpus.js";
import { registerGraphRoutes } from "./routes/graph.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerNodeRoutes } from "./routes/nodes.js";
import { registerSearchRoutes } from "./routes/search.js";
import { registerStatsRoutes } from "./routes/stats.js";

export async function buildServer(env: ApiEnv) {
  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: env.corsOrigin,
    methods: ["GET", "OPTIONS"],
  });

  await app.register(
    async (v1) => {
      await registerHealthRoutes(v1);
      await registerStatsRoutes(v1, env);
      await registerCorpusRoutes(v1, env);
      await registerGraphRoutes(v1, env);
      await registerNodeRoutes(v1, env);
      await registerSearchRoutes(v1, env);
    },
    { prefix: "/api/v1" },
  );

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send(apiError("Not found", "NOT_FOUND"));
  });

  return app;
}

export async function startServer(env: ApiEnv): Promise<void> {
  await runMigrations("up", env.databaseUrl);
  const app = await buildServer(env);
  await app.listen({ port: env.apiPort, host: "0.0.0.0" });
}
