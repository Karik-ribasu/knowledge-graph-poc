import { afterEach, describe, expect, it } from "vitest";
import { graphQuerySchema, searchQuerySchema } from "@kg/core";
import { apiError, isZodLikeError } from "./lib/errors.js";
import type { ApiEnv } from "./lib/env.js";
import { buildServer } from "./server.js";

const stubEnv: ApiEnv = {
  apiPort: 3001,
  graphMaxNodes: 300,
  graphMaxEdges: 600,
  databaseUrl: "postgresql://unused:5432/unused",
  corsOrigin: "http://localhost:4200",
  workspaceRoot: process.cwd(),
};

describe("buildServer", () => {
  let app: Awaited<ReturnType<typeof buildServer>> | undefined;

  afterEach(async () => {
    if (app) await app.close();
    app = undefined;
  });

  it("serves health without touching the database", async () => {
    app = await buildServer(stubEnv);
    const res = await app.inject({ method: "GET", url: "/api/v1/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it("returns 404 for unknown routes", async () => {
    app = await buildServer(stubEnv);
    const res = await app.inject({ method: "GET", url: "/api/v1/unknown-route" });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: "Not found", code: "NOT_FOUND" });
  });

  it("rejects empty search query before hitting the database", async () => {
    app = await buildServer(stubEnv);
    const res = await app.inject({ method: "GET", url: "/api/v1/search?q=" });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: "INVALID_QUERY" });
  });

  it("rejects path traversal on files route", async () => {
    app = await buildServer(stubEnv);
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/files/..%2F..%2Fetc%2Fpasswd",
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: "INVALID_PATH" });
  });

  it("rejects blank nodeId before hitting the database", async () => {
    app = await buildServer(stubEnv);
    const res = await app.inject({ method: "GET", url: "/api/v1/nodes/%20" });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: "INVALID_PARAMS" });
  });
});

describe("API validation", () => {
  it("rejects invalid graph query hops", () => {
    const result = graphQuerySchema.safeParse({ hops: 5 });
    expect(result.success).toBe(false);
  });

  it("accepts nodeTypes as string or array", () => {
    const single = graphQuerySchema.parse({ nodeTypes: "Document" });
    expect(single.nodeTypes).toEqual(["Document"]);
    const multi = graphQuerySchema.parse({ nodeTypes: ["Document", "Chunk"] });
    expect(multi.nodeTypes).toEqual(["Document", "Chunk"]);
  });

  it("rejects empty search query", () => {
    expect(searchQuerySchema.safeParse({ q: "" }).success).toBe(false);
  });

  it("formats api errors", () => {
    expect(apiError("bad", "BAD")).toEqual({ error: "bad", code: "BAD" });
  });

  it("detects zod-like error shapes", () => {
    expect(isZodLikeError({ issues: [{ path: ["q"] }] })).toBe(true);
    expect(isZodLikeError({ issues: "nope" })).toBe(false);
    expect(isZodLikeError("err")).toBe(false);
  });
});
