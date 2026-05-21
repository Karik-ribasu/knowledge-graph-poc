import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  loadBriefFromJson,
  resolveCorpusDir,
  resolveWorkspaceRoot,
  runExpandUseCase,
  runIndexUseCase,
  resolveArtifactsDir,
  runIngestUseCase,
  runIngestArtifactsUseCase,
  runPackUseCase,
  runSearchUseCase,
  runStatsUseCase,
} from "@kg/cli/wiring";
import {
  buildSchemaResourcePayload,
  KG_SCHEMA_URI,
  KG_STATS_URI,
} from "./schema-resource.js";

export const MCP_SERVER_NAME = "knowledge-graph-poc";
export const MCP_SERVER_VERSION = "0.1.0";

const docTypeSchema = z.enum(["business", "market", "technical"]);
const moduleSchema = z.enum(["opportunity", "add-venture", "brand-aid"]);
const providerSchema = z.enum(["hash", "transformers", "openai"]).optional();

function jsonText(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function createKnowledgeGraphMcpServer(): McpServer {
  const server = new McpServer(
    { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
    {
      capabilities: { resources: {} },
      instructions:
        "Knowledge Graph POC: ingest corpus, index embeddings, hybrid search, graph expand, and build landing ContextPacks. Requires DATABASE_URL and KG_WORKSPACE.",
    },
  );

  server.registerTool(
    "kg_ingest",
    {
      description: "Reindex markdown corpus into Postgres (graph + lexical tsvector). Path must stay under KG_WORKSPACE.",
      inputSchema: {
        path: z
          .string()
          .optional()
          .describe("Corpus directory relative to KG_WORKSPACE (default: corpus)"),
      },
    },
    async ({ path }) => {
      const workspaceRoot = resolveWorkspaceRoot();
      const corpusDir = resolveCorpusDir(workspaceRoot, path);
      const { stats } = await runIngestUseCase(path);
      return jsonText({
        ok: true,
        workspaceRoot,
        corpusDir,
        lexicalIndex: "updated on chunk upsert",
        ...stats,
      });
    },
  );

  server.registerTool(
    "kg_ingest_artifacts",
    {
      description:
        "Ingest delivery artifacts (JSON, volumes, images) into Postgres graph + lexical chunks. Path must stay under KG_WORKSPACE.",
      inputSchema: {
        path: z
          .string()
          .optional()
          .describe("Artifacts directory relative to KG_WORKSPACE (default: artifacts/artifacts)"),
      },
    },
    async ({ path }) => {
      const workspaceRoot = resolveWorkspaceRoot();
      const artifactsDir = resolveArtifactsDir(workspaceRoot, path);
      const { stats } = await runIngestArtifactsUseCase(path);
      return jsonText({
        ok: true,
        workspaceRoot,
        artifactsDir,
        lexicalIndex: "updated on chunk upsert",
        ...stats,
      });
    },
  );

  server.registerTool(
    "kg_index",
    {
      description: "Embed unindexed chunks and store vectors in pgvector.",
      inputSchema: {
        provider: providerSchema.describe("Embedding provider (default: EMBEDDING_PROVIDER or hash)"),
      },
    },
    async ({ provider }) => {
      const result = await runIndexUseCase(provider);
      return jsonText({ ok: true, ...result });
    },
  );

  server.registerTool(
    "kg_search",
    {
      description: "Hybrid retrieval: dense embeddings + BM25 fused with RRF.",
      inputSchema: {
        query: z.string().min(1).describe("Natural language query"),
        filters: z
          .object({
            doc_type: z.array(docTypeSchema).optional(),
            module: z.array(moduleSchema).optional(),
          })
          .optional(),
        limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)"),
        provider: providerSchema,
      },
    },
    async ({ query, filters, limit, provider }) => {
      const docType = filters?.doc_type?.[0];
      const module = filters?.module;
      const result = await runSearchUseCase(query, {
        docType,
        module,
        providerName: provider,
        limit: limit ?? 20,
      });
      return jsonText({
        results: result.results,
        meta: {
          query: result.query,
          provider: result.provider,
          filters: result.filters,
          count: result.results.length,
        },
      });
    },
  );

  server.registerTool(
    "kg_expand",
    {
      description: "Expand knowledge graph from a doc or entity seed (1–2 hops).",
      inputSchema: {
        from: z
          .string()
          .min(1)
          .describe("Seed: doc:<id> or entity:<Type>:<slug> or raw node id"),
        hops: z.number().int().min(1).max(2).optional().describe("Traversal depth (default 2)"),
        edge_types: z.array(z.string()).optional().describe("Reserved; server uses default GTM whitelist"),
      },
    },
    async ({ from, hops }) => {
      const result = await runExpandUseCase(from, { hops: hops ?? 2 });
      return jsonText(result);
    },
  );

  server.registerTool(
    "kg_pack",
    {
      description: "Build a landing-page ContextPack from a brief object (hybrid search + graph expansion per facet).",
      inputSchema: {
        brief: z
          .object({
            product: z.string().min(1),
            audience: z.string().min(1),
            goal: z.string().min(1),
            tone: z.string().min(1),
            constraints: z.array(z.string()).default([]),
            locale: z.string().min(2).default("pt-BR"),
          })
          .describe("Landing brief (see docs/06-fluxo-landing-page.md)"),
        provider: providerSchema,
        artifacts_only: z
          .boolean()
          .optional()
          .default(true)
          .describe("When true (default), pack uses only artifacts/artifacts/ delivery files"),
        corpus: z
          .boolean()
          .optional()
          .describe("When true, include legacy corpus/ (overrides artifacts_only)"),
      },
    },
    async ({ brief, provider, artifacts_only, corpus }) => {
      const parsedBrief = await loadBriefFromJson(brief);
      const { pack, meta } = await runPackUseCase(parsedBrief, provider, {
        artifactsOnly: corpus ? false : (artifacts_only ?? true),
      });
      return jsonText({ ok: true, ...meta, pack });
    },
  );

  server.registerTool(
    "kg_stats",
    {
      description: "Document, chunk, node, and edge counts from the database.",
      inputSchema: {},
    },
    async () => {
      const stats = await runStatsUseCase();
      return jsonText({ ok: true, ...stats });
    },
  );

  server.registerResource(
    "kg_schema",
    KG_SCHEMA_URI,
    {
      description: "Ontology node/edge types and ContextPack JSON schema summary",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(buildSchemaResourcePayload(), null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "kg_stats",
    KG_STATS_URI,
    {
      description: "Live counts: documents, chunks, nodes, edges",
      mimeType: "application/json",
    },
    async (uri) => {
      const stats = await runStatsUseCase();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    },
  );

  return server;
}

export function getServerInfo(): { name: string; version: string } {
  return { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION };
}
