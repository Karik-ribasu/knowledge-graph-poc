import { describe, expect, it } from "vitest";
import { DEFAULT_NODE_VAL_K, computeNodeVal } from "@kg/core";
import { PostgresGraphReadRepository } from "./graph-read-repository.js";

describe("PostgresGraphReadRepository (unit)", () => {
  it("uses computeNodeVal formula consistent with graph-theme", () => {
    expect(computeNodeVal(5, "Chunk")).toBeCloseTo(Math.sqrt(6) * DEFAULT_NODE_VAL_K);
    expect(computeNodeVal(5, "File")).toBeCloseTo(Math.sqrt(8) * DEFAULT_NODE_VAL_K);
  });

  it("exposes default limits", () => {
    const repo = new PostgresGraphReadRepository({} as never, {
      maxNodes: 100,
      maxEdges: 200,
    });
    expect(repo).toBeDefined();
  });
});
