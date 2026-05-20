import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startIntegrationDb, type IntegrationDbHandle } from "@kg/adapter-postgres";
import { docIdFromPath } from "@kg/core";
import { createLinkedTransportPair } from "./linked-transport.js";
import { KG_STATS_URI } from "./schema-resource.js";
import { createKnowledgeGraphMcpServer } from "./server.js";

const repoRoot = join(import.meta.dirname, "../../..");

describe("Knowledge Graph MCP server (integration)", () => {
  let db: IntegrationDbHandle;
  let client: Client;

  beforeAll(async () => {
    db = await startIntegrationDb();
    process.env.DATABASE_URL = db.databaseUrl;
    process.env.KG_WORKSPACE = repoRoot;
    process.env.EMBEDDING_PROVIDER = "hash";

    const [clientTransport, serverTransport] = createLinkedTransportPair();
    const server = createKnowledgeGraphMcpServer();
    client = new Client({ name: "kg-integration-client", version: "0.0.0" });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  }, 180_000);

  afterAll(async () => {
    await client.close();
    await db.stop();
  });

  it("kg_ingest → kg_index → kg_search → kg_expand → kg_pack → kg_stats", async () => {
    const ingest = await client.callTool({ name: "kg_ingest", arguments: { path: "corpus" } });
    expect(ingest.isError).not.toBe(true);

    const index = await client.callTool({
      name: "kg_index",
      arguments: { provider: "hash" },
    });
    expect(index.isError).not.toBe(true);

    const search = await client.callTool({
      name: "kg_search",
      arguments: {
        query: "precificação NexusFlow",
        filters: { doc_type: ["business"] },
        provider: "hash",
        limit: 5,
      },
    });
    expect(search.isError).not.toBe(true);

    const docId = docIdFromPath("corpus/market/competidores.md");
    const expand = await client.callTool({
      name: "kg_expand",
      arguments: { from: `doc:${docId}`, hops: 2 },
    });
    expect(expand.isError).not.toBe(true);

    const pack = await client.callTool({
      name: "kg_pack",
      arguments: {
        brief: {
          product: "NexusFlow",
          audience: "Revenue Ops",
          goal: "Landing",
          tone: "profissional",
          constraints: [],
          locale: "pt-BR",
        },
        provider: "hash",
      },
    });
    expect(pack.isError).not.toBe(true);

    const stats = await client.callTool({ name: "kg_stats", arguments: {} });
    expect(stats.isError).not.toBe(true);

    const statsResource = await client.readResource({ uri: KG_STATS_URI });
    const block = statsResource.contents[0];
    expect(block && "text" in block).toBe(true);
  }, 300_000);
});
