import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

function walk(dir, acc = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const src = walk("artifacts/artifacts")
  .map((f) => relative("artifacts/artifacts", f).replace(/\\/g, "/"))
  .sort();
const cat = walk("docs/artifacts-catalog")
  .map((f) => relative("docs/artifacts-catalog", f).replace(/\\/g, "/"))
  .sort();

const toCat = (r) => r.replace(/\.png$/i, ".md").replace(/\.json$/i, ".md");
const catSet = new Set(cat.filter((c) => c !== "INDEX.md"));
const missing = src.filter((r) => !catSet.has(toCat(r)));
const extra = [...catSet].filter((c) => !src.some((r) => toCat(r) === c));

console.log("source files:", src.length);
console.log("catalog files:", cat.length);
console.log("missing catalog:", missing);
console.log("extra catalog:", extra);
