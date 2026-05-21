import { posix } from "node:path";

/** Reject path traversal; returns normalized posix path or throws. */
export function normalizeCorpusPath(input: string): string {
  const cleaned = input.replace(/\\/g, "/").replace(/^\/+/, "");
  if (cleaned.includes("..")) {
    throw new Error("Invalid path: traversal not allowed");
  }
  const normalized = posix.normalize(cleaned);
  if (normalized.startsWith("..") || normalized.includes("/../")) {
    throw new Error("Invalid path: traversal not allowed");
  }
  return normalized;
}

/** Parent directory path (posix); empty string for file at root. */
export function parentDirPath(filePath: string): string {
  const normalized = normalizeCorpusPath(filePath);
  const idx = normalized.lastIndexOf("/");
  if (idx <= 0) return normalized.includes("/") ? normalized.slice(0, idx) : "";
  return normalized.slice(0, idx);
}

/** All folder prefixes for a file path, e.g. `corpus/a/b.md` → [`corpus`, `corpus/a`]. */
export function folderPrefixesForFile(filePath: string): string[] {
  const normalized = normalizeCorpusPath(filePath);
  const parts = normalized.split("/");
  if (parts.length <= 1) return [];
  const prefixes: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    prefixes.push(parts.slice(0, i).join("/"));
  }
  return prefixes;
}
