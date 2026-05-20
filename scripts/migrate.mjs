#!/usr/bin/env node
/**
 * Cross-platform migrate wrapper (loads .env via Node --env-file from package.json).
 */
import { runMigrations } from "../packages/adapter-postgres/dist/migrate.js";

const direction = process.argv[2] === "down" ? "down" : "up";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || typeof databaseUrl !== "string") {
  console.error("DATABASE_URL must be set (copy .env.example to .env)");
  process.exit(1);
}

await runMigrations(direction, databaseUrl);
console.log(`Migrations ${direction} OK`);
