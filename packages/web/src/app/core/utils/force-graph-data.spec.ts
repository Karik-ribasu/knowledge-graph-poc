import { toForceGraphData } from "./force-graph-data";

describe("toForceGraphData", () => {
  it("maps API snapshot to force-graph nodes and links", () => {
    const data = toForceGraphData({
      nodes: [{ id: "n1", label: "Doc", type: "Document", val: 8, color: "#3b82f6" }],
      links: [{ source: "n1", target: "n2", type: "mentions", color: "#a855f7" }],
    });
    expect(data.nodes[0].color).toBe("#3b82f6");
    expect(data.links[0].dashed).toBe(true);
  });

  it("returns empty graph for null snapshot", () => {
    expect(toForceGraphData(null).nodes).toEqual([]);
  });
});
