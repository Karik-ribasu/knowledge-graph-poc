export type ArtifactType =
  | "manifest"
  | "json"
  | "volume-md"
  | "markdown"
  | "image-prompt"
  | "image";

const VOLUME_MD_RE = /vol-\d+/i;

export function detectArtifactType(relativePath: string): ArtifactType {
  const lower = relativePath.toLowerCase().replace(/\\/g, "/");
  const base = lower.split("/").pop() ?? lower;

  if (base === "delivery-manifest.json") return "manifest";
  if (lower.endsWith(".png")) return "image";
  if (lower.endsWith(".image-prompt.md")) return "image-prompt";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".md") && VOLUME_MD_RE.test(base)) return "volume-md";
  if (lower.endsWith(".md")) return "markdown";
  return "markdown";
}

export function extractModule(relativePath: string): string | null {
  const normalized = relativePath.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length < 3 || parts[0] !== "artifacts" || parts[1] !== "artifacts") {
    return parts[0] ?? null;
  }
  return parts[2] ?? null;
}

/** Normalize dossier volume_artifacts paths to workspace-relative artifact paths. */
export function normalizeVolumeArtifactPath(ref: string): string {
  const trimmed = ref.trim().replace(/\\/g, "/");
  if (trimmed.startsWith("artifacts/artifacts/")) return trimmed;
  if (trimmed.startsWith("artifacts/")) return `artifacts/${trimmed}`;
  return `artifacts/artifacts/${trimmed.replace(/^\/+/, "")}`;
}

export function imagePromptPathForPng(pngRelativePath: string): string {
  return pngRelativePath.replace(/\.png$/i, ".image-prompt.md");
}
