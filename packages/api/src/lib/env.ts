export interface ApiEnv {
  apiPort: number;
  graphMaxNodes: number;
  graphMaxEdges: number;
  databaseUrl: string;
  corsOrigin: string;
  workspaceRoot: string;
}

export function loadApiEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const workspaceRoot = env.KG_WORKSPACE ?? process.cwd();

  return {
    apiPort: parseIntEnv(env.API_PORT, 3001),
    graphMaxNodes: parseIntEnv(env.GRAPH_MAX_NODES, 300),
    graphMaxEdges: parseIntEnv(env.GRAPH_MAX_EDGES, 600),
    databaseUrl,
    corsOrigin: env.CORS_ORIGIN ?? "http://localhost:4200",
    workspaceRoot,
  };
}

function parseIntEnv(value: string | undefined, fallback: number): number {
  if (value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}
