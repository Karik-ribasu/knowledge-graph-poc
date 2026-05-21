import { defaultGraphFilters, nodeTypesForGraphRequest } from "./graph-filters.model";

describe("nodeTypesForGraphRequest", () => {
  it("includes Chunk when loading chunk neighborhood", () => {
    const filters = defaultGraphFilters();
    const types = nodeTypesForGraphRequest(filters, "chunkNeighborhood");
    expect(types === undefined || (types.includes("Chunk") && types.includes("Section"))).toBe(
      true,
    );
  });
});
