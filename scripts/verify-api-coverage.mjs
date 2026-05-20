import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const summaryPath = join(process.cwd(), "coverage-api", "coverage-summary.json");

if (!existsSync(summaryPath)) {
  console.error("Missing coverage-api/coverage-summary.json — run pnpm test:coverage:api first");
  process.exit(1);
}

const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
const total = summary.total;

if (!total) {
  console.error("coverage-summary.json has no total row");
  process.exit(1);
}

const thresholds = {
  lines: 80,
  branches: 70,
  functions: 80,
  statements: 80,
};

let failed = false;

for (const [name, key, min] of [
  ["lines", "lines", thresholds.lines],
  ["branches", "branches", thresholds.branches],
  ["functions", "functions", thresholds.functions],
  ["statements", "statements", thresholds.statements],
]) {
  const pct = total[key]?.pct;
  if (pct == null) continue;
  if (pct < min) {
    failed = true;
    console.error(`@kg/api total ${name}: ${pct.toFixed(2)}% (required ${min}%)`);
  }
}

if (failed) {
  process.exit(1);
}

console.log(
  `@kg/api coverage OK (lines ${total.lines.pct}%, branches ${total.branches.pct}%, functions ${total.functions.pct}%)`,
);
