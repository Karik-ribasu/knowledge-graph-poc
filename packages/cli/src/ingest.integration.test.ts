import { spawn } from "node:child_process";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startIntegrationDb, type IntegrationDbHandle } from "@kg/adapter-postgres";

const repoRoot = join(import.meta.dirname, "../../..");
const cliEntry = join(import.meta.dirname, "../dist/index.js");

function runKgIngest(databaseUrl: string, workspaceRoot: string, corpusPath: string): Promise<{
  exitCode: number | null;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [cliEntry, "ingest", corpusPath], {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        KG_WORKSPACE: workspaceRoot,
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

describe("kg ingest CLI (integration)", () => {
  let db: IntegrationDbHandle;

  beforeAll(async () => {
    db = await startIntegrationDb();
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it("exits 0 and prints ingest stats for ./corpus", async () => {
    const { exitCode, stdout, stderr } = await runKgIngest(
      db.databaseUrl,
      repoRoot,
      "./corpus",
    );

    expect(stderr).toBe("");
    expect(exitCode).toBe(0);

    const payload = JSON.parse(stdout) as {
      ok: boolean;
      documentsProcessed: number;
      chunksWritten: number;
    };
    expect(payload.ok).toBe(true);
    expect(payload.documentsProcessed).toBeGreaterThanOrEqual(20);
    expect(payload.chunksWritten).toBeGreaterThan(0);
  }, 120_000);
});
