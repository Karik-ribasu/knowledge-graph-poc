import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLinkedTransportPair } from "./linked-transport.js";
import { KG_SCHEMA_URI, KG_STATS_URI } from "./schema-resource.js";
import { createKnowledgeGraphMcpServer } from "./server.js";

describe("Knowledge Graph MCP server (in-process)", () => {
  let clientTransport: ReturnType<typeof createLinkedTransportPair>[0];
  let serverTransport: ReturnType<typeof createLinkedTransportPair>[1];
  let client: Client;

  beforeEach(async () => {
    [clientTransport, serverTransport] = createLinkedTransportPair();
    const server = createKnowledgeGraphMcpServer();
    client = new Client({ name: "kg-test-client", version: "0.0.0" });

    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
  });

  it("lists seven kg_* tools", async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "kg_expand",
      "kg_index",
      "kg_ingest",
      "kg_ingest_artifacts",
      "kg_pack",
      "kg_search",
      "kg_stats",
    ]);
  });

  it("lists kg://schema and kg://stats resources", async () => {
    const { resources } = await client.listResources();
    const uris = resources.map((r) => r.uri).sort();
    expect(uris).toEqual([KG_SCHEMA_URI, KG_STATS_URI]);
  });

  it("reads kg://schema without DATABASE_URL", async () => {
    const result = await client.readResource({ uri: KG_SCHEMA_URI });
    const first = result.contents[0];
    expect(first && "text" in first).toBe(true);
    const text = first && "text" in first ? first.text : "";
    const payload = JSON.parse(text) as { ontology: { gtm_node_types: string[] } };
    expect(payload.ontology.gtm_node_types).toContain("Product");
  });

  it("kg_stats returns error when DATABASE_URL is missing", async () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const result = await client.callTool({ name: "kg_stats", arguments: {} });
      expect(result.isError).toBe(true);
      const content = Array.isArray(result.content) ? result.content : [];
      const block = content[0];
      const text =
        block && typeof block === "object" && "type" in block && block.type === "text"
          ? String((block as { text: string }).text)
          : "";
      expect(text).toMatch(/DATABASE_URL/i);
    } finally {
      if (prev !== undefined) process.env.DATABASE_URL = prev;
    }
  });

  it("kg_search validates query", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://unused");
    const result = await client.callTool({
      name: "kg_search",
      arguments: { query: "" },
    });
    expect(result.isError).toBe(true);
    vi.unstubAllEnvs();
  });
});
