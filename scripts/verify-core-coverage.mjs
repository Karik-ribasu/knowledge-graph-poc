import { readFileSync, existsSync } from "node:fs";
import { join, normalize } from "node:path";

const finalPath = join(process.cwd(), "coverage", "coverage-final.json");

if (!existsSync(finalPath)) {
  console.error("Missing coverage/coverage-final.json — run pnpm test:coverage first");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(finalPath, "utf8"));
const coreRoot = normalize(join(process.cwd(), "packages", "core", "src"));

const thresholds = {
  lines: 93,
  branches: 75,
  functions: 100,
};

const excludedSuffixes = [
  `${join(coreRoot, "index.ts")}`,
  `${join(coreRoot, "domain", "types.ts")}`,
];

function isExcluded(filePath) {
  const normalized = normalize(filePath);
  if (!normalized.startsWith(coreRoot)) return true;
  if (normalized.includes(`${join("ports", "")}`)) return true;
  if (excludedSuffixes.some((suffix) => normalized === suffix)) return true;
  return false;
}

function pctFromCounter(counter) {
  const keys = Object.keys(counter);
  if (keys.length === 0) return 100;
  const hit = keys.filter((key) => counter[key] > 0).length;
  return (hit / keys.length) * 100;
}

let failed = false;

for (const [filePath, data] of Object.entries(raw)) {
  if (isExcluded(filePath)) continue;
  if (data.all === true) continue;

  const lines = pctFromCounter(data.s ?? {});
  const branches = pctFromCounter(data.b ?? {});
  const functions = pctFromCounter(data.f ?? {});

  const checks = [
    ["lines", lines, thresholds.lines],
    ["branches", branches, thresholds.branches],
    ["functions", functions, thresholds.functions],
  ];

  for (const [name, pct, min] of checks) {
    if (pct < min) {
      failed = true;
      const rel = normalize(filePath).replace(`${coreRoot}${join("", "")}`, "");
      console.error(`${rel}: ${name} ${pct.toFixed(2)}% (required ${min}%)`);
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(
  `@kg/core coverage OK (lines≥${thresholds.lines}%, branches≥${thresholds.branches}%, functions=${thresholds.functions}%)`,
);
