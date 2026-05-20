import { spawn } from "node:child_process";
import { join } from "node:path";
import { startIntegrationDb, type IntegrationDbHandle } from "@kg/adapter-postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "../../..");
const cliEntry = join(import.meta.dirname, "../dist/index.js");

function runKg(
  args: string[],
  databaseUrl: string,
): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [cliEntry, ...args], {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        KG_WORKSPACE: repoRoot,
        EMBEDDING_PROVIDER: "hash",
      },
      cwd: repoRoot,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolvePromise({ exitCode, stdout, stderr });
    });
  });
}

describe("kg search CLI (integration)", () => {
  let db: IntegrationDbHandle;

  beforeAll(async () => {
    db = await startIntegrationDb();
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it("ingest, index, and search with doc_type filter", async () => {
    const databaseUrl = db.databaseUrl;

    const ingest = await runKg(["ingest", "./corpus"], databaseUrl);
    expect(ingest.exitCode).toBe(0);

    const index = await runKg(["index", "--provider", "hash"], databaseUrl);
    expect(index.exitCode).toBe(0);

    const search = await runKg(
      ["search", "precificação NexusFlow", "--doc-type", "business", "--provider", "hash"],
      databaseUrl,
    );
    expect(search.stderr).toBe("");
    expect(search.exitCode).toBe(0);

    const payload = JSON.parse(search.stdout) as {
      ok: boolean;
      count: number;
      results: Array<{ path: string }>;
    };
    expect(payload.ok).toBe(true);
    expect(payload.count).toBeGreaterThan(0);
    expect(payload.results.every((hit) => hit.path.includes("corpus/business/"))).toBe(true);
  }, 180_000);
});
