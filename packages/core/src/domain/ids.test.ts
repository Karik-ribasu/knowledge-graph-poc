import { describe, expect, it } from "vitest";
import {
  chunkIdFromParts,
  contentHash,
  docIdFromPath,
  edgeIdFromParts,
  entityIdFromParts,
  sectionIdFromParts,
} from "./ids.js";
import { slugify } from "../extract/slug.js";

describe("domain ids", () => {
  it("derives stable ids from path and parts", () => {
    const docId = docIdFromPath("corpus/business/a.md");
    expect(docId).toHaveLength(16);
    expect(docIdFromPath("corpus/business/a.md")).toBe(docId);
    expect(docIdFromPath("corpus/business/b.md")).not.toBe(docId);

    const sectionId = sectionIdFromParts(docId, "Intro", 0);
    expect(sectionId).toHaveLength(16);
    expect(sectionIdFromParts(docId, "Intro", 0)).toBe(sectionId);

    const chunkId = chunkIdFromParts(docId, "Intro", 0);
    expect(chunkId).toHaveLength(16);

    const edgeId = edgeIdFromParts("src", "tgt", "linksTo");
    expect(edgeId).toHaveLength(16);

    expect(entityIdFromParts("Product", "NexusFlow", slugify)).toBe("Product:nexusflow");
    expect(contentHash("hello")).toMatch(/^[a-f0-9]{64}$/);
  });
});
