import { rmSync } from "node:fs";
import { join } from "node:path";

const cacheDir = join(process.cwd(), "packages", "web", ".angular", "cache");
try {
  rmSync(cacheDir, { recursive: true, force: true });
  console.log("Cleared", cacheDir);
} catch {
  /* ignore */
}
