import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import type { GraphSnapshotDTO } from "@kg/core/explorer/schemas";
import type { GraphSearchHit } from "@kg/core/ports/graph-read";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
import type { GraphFilterState } from "../models/graph-filters.model";
import { nodeTypesForGraphRequest } from "../models/graph-filters.model";

export interface GraphStats {
  ok: boolean;
  nodes: number;
  edges: number;
  documents: number;
  chunks: number;
}

@Injectable({ providedIn: "root" })
export class GraphExplorerService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly graphData = signal<GraphSnapshotDTO | null>(null);
  readonly stats = signal<GraphStats | null>(null);
  readonly searchResults = signal<GraphSearchHit[]>([]);

  async loadStats(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<GraphStats & Record<string, unknown>>(`${this.base}/stats`),
      );
      this.stats.set({
        ok: data.ok ?? true,
        nodes: Number(data.nodes ?? 0),
        edges: Number(data.edges ?? 0),
        documents: Number(data.documents ?? 0),
        chunks: Number(data.chunks ?? 0),
      });
    } catch {
      this.stats.set(null);
    }
  }

  async loadGraph(
    filters: GraphFilterState,
    seed?: string,
    hops?: number,
    highlightMode?: "fileNeighborhood" | "chunkNeighborhood",
  ): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      let params = new HttpParams();
      const nodeTypes = nodeTypesForGraphRequest(filters, highlightMode);
      if (nodeTypes !== undefined) {
        for (const t of nodeTypes) {
          params = params.append("nodeTypes", t);
        }
      }
      if (filters.docType.trim()) {
        params = params.set("docType", filters.docType.trim());
      }
      if (seed) {
        params = params.set("seed", seed).set("hops", String(hops ?? 1));
      }
      if (highlightMode) {
        params = params.set("highlightMode", highlightMode);
      }
      const snapshot = await firstValueFrom(
        this.http.get<GraphSnapshotDTO>(`${this.base}/graph`, { params }),
      );
      this.graphData.set(snapshot);
    } catch (err) {
      this.graphData.set(null);
      this.error.set(err instanceof Error ? err.message : "Failed to load graph");
    } finally {
      this.loading.set(false);
    }
  }

  async mergeNeighbors(seedId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const params = new HttpParams().set("seed", seedId).set("hops", "1");
      const expansion = await firstValueFrom(
        this.http.get<GraphSnapshotDTO>(`${this.base}/graph`, { params }),
      );
      const current = this.graphData();
      if (!current) {
        this.graphData.set(expansion);
        return;
      }
      const nodeMap = new Map(current.nodes.map((n) => [n.id, n]));
      for (const n of expansion.nodes) {
        nodeMap.set(n.id, n);
      }
      const linkKey = (l: { source: string; target: string; type: string }) =>
        `${l.source}|${l.target}|${l.type}`;
      const linkMap = new Map(current.links.map((l) => [linkKey(l), l]));
      for (const l of expansion.links) {
        linkMap.set(linkKey(l), l);
      }
      this.graphData.set({
        nodes: [...nodeMap.values()],
        links: [...linkMap.values()],
        meta: {
          nodeCount: nodeMap.size,
          edgeCount: linkMap.size,
        },
      });
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : "Failed to expand neighbors");
    } finally {
      this.loading.set(false);
    }
  }

  async search(q: string): Promise<GraphSearchHit[]> {
    if (!q.trim()) {
      this.searchResults.set([]);
      return [];
    }
    const params = new HttpParams().set("q", q.trim());
    const res = await firstValueFrom(
      this.http.get<{ results: GraphSearchHit[] }>(`${this.base}/search`, { params }),
    );
    const results = res.results ?? [];
    this.searchResults.set(results);
    return results;
  }
}
