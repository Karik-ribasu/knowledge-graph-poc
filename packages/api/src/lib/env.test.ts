import { describe, expect, it } from "vitest";
import { loadApiEnv } from "./env.js";

describe("loadApiEnv", () => {
  it("throws when DATABASE_URL is missing", () => {
    expect(() => loadApiEnv({})).toThrow("DATABASE_URL is required");
  });

  it("applies defaults for optional values", () => {
    const env = loadApiEnv({ DATABASE_URL: "postgresql://localhost/kg" });
    expect(env.apiPort).toBe(3001);
    expect(env.graphMaxNodes).toBe(300);
    expect(env.graphMaxEdges).toBe(600);
    expect(env.corsOrigin).toBe("http://localhost:4200");
  });

  it("parses custom numeric and CORS settings", () => {
    const env = loadApiEnv({
      DATABASE_URL: "postgresql://localhost/kg",
      API_PORT: "4000",
      GRAPH_MAX_NODES: "150",
      GRAPH_MAX_EDGES: "400",
      CORS_ORIGIN: "http://example.com:4200",
    });
    expect(env.apiPort).toBe(4000);
    expect(env.graphMaxNodes).toBe(150);
    expect(env.graphMaxEdges).toBe(400);
    expect(env.corsOrigin).toBe("http://example.com:4200");
  });

  it("falls back when env integers are invalid", () => {
    const env = loadApiEnv({
      DATABASE_URL: "postgresql://localhost/kg",
      API_PORT: "not-a-number",
      GRAPH_MAX_NODES: "",
    });
    expect(env.apiPort).toBe(3001);
    expect(env.graphMaxNodes).toBe(300);
  });
});
