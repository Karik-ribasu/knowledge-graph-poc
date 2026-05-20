import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runner as runPgMigrate } from "node-pg-migrate";

export type MigrationDirection = "up" | "down";

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "../migrations");

export async function runMigrations(
  direction: MigrationDirection,
  databaseUrl: string,
): Promise<void> {
  await runPgMigrate({
    databaseUrl,
    dir: migrationsDir,
    direction,
    migrationsTable: "pgmigrations",
    count: direction === "up" ? Infinity : 1,
    log: () => undefined,
    verbose: false,
  });
}
