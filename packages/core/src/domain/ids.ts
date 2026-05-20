import { createHash } from "node:crypto";

/** Stable document id from workspace-relative path. */
export function docIdFromPath(relativePath: string): string {
  return createHash("sha256").update(relativePath).digest("hex").slice(0, 16);
}

export function sectionIdFromParts(docId: string, heading: string, ordinal: number): string {
  return createHash("sha256")
    .update(`${docId}:${heading}:${String(ordinal)}`)
    .digest("hex")
    .slice(0, 16);
}

/** Stable chunk id from document, section heading and index within section. */
export function chunkIdFromParts(docId: string, heading: string, index: number): string {
  return createHash("sha256")
    .update(`${docId}:${heading}:${String(index)}`)
    .digest("hex")
    .slice(0, 16);
}

export function edgeIdFromParts(sourceId: string, targetId: string, edgeType: string): string {
  return createHash("sha256").update(`${sourceId}:${edgeType}:${targetId}`).digest("hex").slice(0, 16);
}

/** Global GTM entity id: `Product:nexusflow`. */
export function entityIdFromParts(nodeType: string, name: string, slugifyFn: (s: string) => string): string {
  return `${nodeType}:${slugifyFn(name)}`;
}

export function contentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
