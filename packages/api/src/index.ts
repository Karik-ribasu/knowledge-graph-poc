import { loadApiEnv } from "./lib/env.js";
import { startServer } from "./server.js";

const env = loadApiEnv();
await startServer(env);
