import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { GraphExplorerService } from "./graph-explorer.service";
import { defaultGraphFilters } from "../models/graph-filters.model";

describe("GraphExplorerService", () => {
  let service: GraphExplorerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GraphExplorerService],
    });
    service = TestBed.inject(GraphExplorerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("loads graph snapshot with node type filters", async () => {
    const promise = service.loadGraph(defaultGraphFilters());
    const req = http.expectOne((r) => r.url.includes("/graph"));
    expect(req.request.method).toBe("GET");
    req.flush({ nodes: [{ id: "n1", label: "A", type: "Document", val: 4 }], links: [] });
    await promise;
    expect(service.graphData()?.nodes.length).toBe(1);
    expect(service.loading()).toBe(false);
  });

  it("sets error when graph request fails", async () => {
    const promise = service.loadGraph(defaultGraphFilters());
    const req = http.expectOne((r) => r.url.includes("/graph"));
    req.flush("fail", { status: 500, statusText: "Server Error" });
    await promise;
    expect(service.error()).toBeTruthy();
    expect(service.graphData()).toBeNull();
  });

  it("search returns hits", async () => {
    const promise = service.search("acme");
    const req = http.expectOne((r) => r.url.includes("/search") && r.params.get("q") === "acme");
    req.flush({ results: [{ id: "x", label: "Acme", type: "Competitor" }] });
    const hits = await promise;
    expect(hits.length).toBe(1);
    expect(service.searchResults()[0].id).toBe("x");
  });

  it("mergeNeighbors merges nodes and links", async () => {
    service.graphData.set({
      nodes: [{ id: "a", label: "A", type: "Product", val: 3 }],
      links: [],
    });
    const promise = service.mergeNeighbors("a");
    const req = http.expectOne((r) => r.url.includes("/graph") && r.params.get("seed") === "a");
    req.flush({
      nodes: [
        { id: "a", label: "A", type: "Product", val: 3 },
        { id: "b", label: "B", type: "Competitor", val: 3 },
      ],
      links: [{ source: "a", target: "b", type: "competesWith" }],
    });
    await promise;
    expect(service.graphData()?.nodes.length).toBe(2);
    expect(service.graphData()?.links.length).toBe(1);
  });
});
