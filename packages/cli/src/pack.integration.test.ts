import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { startIntegrationDb, type IntegrationDbHandle } from "@kg/adapter-postgres";
import { contextPackSchema, PACK_SECTION_IDS, parseBriefJson } from "@kg/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "../../..");
const cliEntry = join(import.meta.dirname, "../dist/index.js");
const sampleBriefPath = join(import.meta.dirname, "../fixtures/sample-brief.json");

function runKg(
  args: string[],
  databaseUrl: string,
  extraEnv?: Record<string, string>,
): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [cliEntry, ...args], {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        KG_WORKSPACE: repoRoot,
        EMBEDDING_PROVIDER: "hash",
        ...extraEnv,
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

describe("kg pack CLI (integration)", () => {
  let db: IntegrationDbHandle;

  beforeAll(async () => {
    db = await startIntegrationDb();
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it("builds ContextPack from sample brief with corpus content and valid schema", async () => {
    const databaseUrl = db.databaseUrl;

    const ingest = await runKg(["ingest", "./corpus"], databaseUrl);
    expect(ingest.exitCode).toBe(0);

    const index = await runKg(["index", "--provider", "hash"], databaseUrl);
    expect(index.exitCode).toBe(0);

    const packRun = await runKg(["pack", "--brief", sampleBriefPath, "--provider", "hash"], databaseUrl);
    expect(packRun.stderr).toBe("");
    expect(packRun.exitCode).toBe(0);

    const payload = JSON.parse(packRun.stdout) as {
      ok: boolean;
      facets_covered: string[];
      pack: unknown;
    };
    expect(payload.ok).toBe(true);

    const parsed = contextPackSchema.parse(payload.pack);
    expect(parseBriefJson(parsed.brief).product).toBe("NexusFlow");
    expect(payload.facets_covered.length).toBeGreaterThan(0);

    const requiredSections = ["hero", "value_prop", "features"] as const;
    for (const sectionId of requiredSections) {
      expect(parsed.sections[sectionId].chunks.length).toBeGreaterThan(0);
      expect(parsed.sections[sectionId].content.length).toBeGreaterThan(0);
    }

    const allPaths = PACK_SECTION_IDS.flatMap((id) =>
      parsed.sections[id].chunks.map((c) => c.path),
    );
    expect(allPaths.some((p) => p.startsWith("corpus/"))).toBe(true);

    for (const chunk of parsed.sections.value_prop.chunks) {
      expect(chunk.doc_id).toBeTruthy();
      expect(chunk.path).toMatch(/^corpus\//);
    }

    const briefRaw = await readFile(sampleBriefPath, "utf8");
    const brief = parseBriefJson(JSON.parse(briefRaw) as unknown);
    expect(brief.locale).toBe("pt-BR");
  }, 360_000);
});
