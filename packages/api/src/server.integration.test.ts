import { join } from "node:path";
import {
  createPool,
  PostgresGraphReadRepository,
  PostgresGraphStore,
  startIntegrationDb,
  type IntegrationDbHandle,
} from "@kg/adapter-postgres";
import { createEntityExtractor, ingestWorkspace } from "@kg/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadApiEnv } from "./lib/env.js";
import { buildServer } from "./server.js";

const repoRoot = join(import.meta.dirname, "../../..");

describe("Graph Explorer API (integration)", () => {
  let db: IntegrationDbHandle | undefined;
  let databaseUrl: string;

  beforeAll(async () => {
    db = await startIntegrationDb();
    databaseUrl = db.databaseUrl;

    const pool = createPool(databaseUrl);
    const store = new PostgresGraphStore(pool);
    try {
      await ingestWorkspace({
        workspaceRoot: repoRoot,
        corpusDir: join(repoRoot, "corpus"),
        store,
        entityExtractor: createEntityExtractor("rules"),
      });
    } finally {
      await pool.end();
    }
  }, 120_000);

  afterAll(async () => {
    if (db) await db.stop();
  });

  it("serves health, stats, graph, node detail, and search", async () => {
    const env = loadApiEnv({
      DATABASE_URL: databaseUrl,
      API_PORT: "3001",
      GRAPH_MAX_NODES: "300",
      GRAPH_MAX_EDGES: "600",
      CORS_ORIGIN: "http://localhost:4200",
    });
    const app = await buildServer(env);

    const health = await app.inject({ method: "GET", url: "/api/v1/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ ok: true });

    const stats = await app.inject({ method: "GET", url: "/api/v1/stats" });
    expect(stats.statusCode).toBe(200);
    const statsBody = stats.json() as { ok: boolean; nodes: number };
    expect(statsBody.ok).toBe(true);
    expect(statsBody.nodes).toBeGreaterThan(0);

    const graph = await app.inject({
      method: "GET",
      url: "/api/v1/graph?nodeTypes=Document&nodeTypes=Competitor&limit=50",
    });
    expect(graph.statusCode).toBe(200);
    const graphBody = graph.json() as { nodes: unknown[]; links: unknown[] };
    expect(graphBody.nodes.length).toBeGreaterThan(0);

    const badGraph = await app.inject({
      method: "GET",
      url: "/api/v1/graph?hops=9",
    });
    expect(badGraph.statusCode).toBe(400);

    const pool = createPool(databaseUrl);
    const read = new PostgresGraphReadRepository(pool);
    const docId = (
      await read.searchNodes("competidor", 1)
    )[0]?.id;
    await pool.end();

    expect(docId).toBeDefined();
    const node = await app.inject({
      method: "GET",
      url: `/api/v1/nodes/${encodeURIComponent(docId!)}`,
    });
    expect(node.statusCode).toBe(200);

    const search = await app.inject({
      method: "GET",
      url: "/api/v1/search?q=product",
    });
    expect(search.statusCode).toBe(200);
    const searchBody = search.json() as { results: unknown[] };
    expect(Array.isArray(searchBody.results)).toBe(true);

    const missingNode = await app.inject({
      method: "GET",
      url: "/api/v1/nodes/doc:__missing_explorer_qa__",
    });
    expect(missingNode.statusCode).toBe(404);
    expect(missingNode.json()).toMatchObject({ code: "NOT_FOUND" });

    await app.close();
  }, 120_000);
});
