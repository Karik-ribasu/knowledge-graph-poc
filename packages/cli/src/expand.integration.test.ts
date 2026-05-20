import { spawn } from "node:child_process";
import { join } from "node:path";
import { docIdFromPath, ingestWorkspace } from "@kg/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPool,
  PostgresGraphStore,
  startIntegrationDb,
  type IntegrationDbHandle,
} from "@kg/adapter-postgres";

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
        ENTITY_EXTRACTOR: "rules",
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

describe("kg expand CLI (integration)", () => {
  let db: IntegrationDbHandle;

  beforeAll(async () => {
    db = await startIntegrationDb();

    const pool = createPool(db.databaseUrl);
    const store = new PostgresGraphStore(pool);
    await ingestWorkspace({
      workspaceRoot: repoRoot,
      corpusDir: join(repoRoot, "corpus"),
      store,
    });
    await pool.end();
  }, 180_000);

  afterAll(async () => {
    await db.stop();
  });

  it("expands from doc seed with hops=2", async () => {
    const docId = docIdFromPath("corpus/market/competidores.md");
    const { exitCode, stdout, stderr } = await runKg(
      ["expand", "--from", `doc:${docId}`, "--hops", "2"],
      db.databaseUrl,
    );

    expect(stderr).toBe("");
    expect(exitCode).toBe(0);

    const payload = JSON.parse(stdout) as {
      ok: boolean;
      nodes: Array<{ nodeType: string }>;
    };
    expect(payload.ok).toBe(true);
    expect(payload.nodes.length).toBeGreaterThan(1);
    expect(payload.nodes.some((n) => n.nodeType === "Competitor")).toBe(true);
  }, 120_000);
});
