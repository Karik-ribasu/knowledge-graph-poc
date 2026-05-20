import { spawn } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const cliEntry = join(import.meta.dirname, "../dist/index.js");

function runKg(args: string[]): Promise<{ exitCode: number | null; stdout: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [cliEntry, ...args], {
      cwd: join(import.meta.dirname, "../../.."),
    });
    let stdout = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolvePromise({ exitCode, stdout });
    });
  });
}

describe("kg CLI help", () => {
  it("prints usage and exits 0", async () => {
    const { exitCode, stdout } = await runKg(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("kg ingest");
    expect(stdout).toContain("kg pack");
  });
});
