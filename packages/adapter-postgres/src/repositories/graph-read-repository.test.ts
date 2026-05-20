import { describe, expect, it } from "vitest";
import { computeNodeVal } from "@kg/core";
import { PostgresGraphReadRepository } from "./graph-read-repository.js";

describe("PostgresGraphReadRepository (unit)", () => {
  it("uses computeNodeVal formula consistent with graph-theme", () => {
    expect(computeNodeVal(5, "Chunk")).toBeCloseTo(Math.sqrt(6) * 4);
    expect(computeNodeVal(5, "Document")).toBeCloseTo(Math.sqrt(8) * 4);
  });

  it("exposes default limits", () => {
    const repo = new PostgresGraphReadRepository({} as never, {
      maxNodes: 100,
      maxEdges: 200,
    });
    expect(repo).toBeDefined();
  });
});
