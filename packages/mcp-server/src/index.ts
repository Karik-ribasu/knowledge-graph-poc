#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createKnowledgeGraphMcpServer } from "./server.js";

async function main(): Promise<void> {
  const server = createKnowledgeGraphMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ ok: false, error: message }));
  process.exit(1);
});

export { createKnowledgeGraphMcpServer, getServerInfo, MCP_SERVER_NAME, MCP_SERVER_VERSION } from "./server.js";
export { createLinkedTransportPair } from "./linked-transport.js";
export { KG_SCHEMA_URI, KG_STATS_URI } from "./schema-resource.js";
