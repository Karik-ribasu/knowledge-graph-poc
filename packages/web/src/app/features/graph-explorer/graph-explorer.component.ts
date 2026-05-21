import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { CorpusService } from "../../core/services/corpus.service";
import { GraphExplorerService } from "../../core/services/graph-explorer.service";
import { NodeDetailService } from "../../core/services/node-detail.service";
import {
  defaultGraphFilters,
  type GraphFilterState,
} from "../../core/models/graph-filters.model";
import { toForceGraphData } from "../../core/utils/force-graph-data";
import type { ForceGraphNode } from "../../core/utils/force-graph-data";
import { CorpusTreeComponent } from "./corpus-tree/corpus-tree.component";
import { FileContentPanelComponent } from "./file-content-panel/file-content-panel.component";
import { ForceGraphComponent } from "./graph-canvas/force-graph.component";
import { GraphFiltersComponent } from "./graph-filters/graph-filters.component";
import { GraphLegendComponent } from "./graph-legend/graph-legend.component";
import { NodeDetailSidenavComponent } from "./node-detail-sidenav/node-detail-sidenav.component";

@Component({
  selector: "kg-graph-explorer",
  standalone: true,
  imports: [
    FormsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    CorpusTreeComponent,
    FileContentPanelComponent,
    GraphFiltersComponent,
    ForceGraphComponent,
    GraphLegendComponent,
    NodeDetailSidenavComponent,
  ],
  template: `
    <mat-sidenav-container class="explorer-root">
      <mat-sidenav-content class="main-pane">
        <mat-toolbar class="toolbar">
          <span class="title">Knowledge Graph Explorer</span>
          @if (explorer.stats(); as s) {
            <span class="stats">
              {{ s.nodes }} nós · {{ s.edges }} arestas · {{ s.documents }} docs
            </span>
          }
          <span class="spacer"></span>
          <button mat-stroked-button type="button" [matMenuTriggerFor]="filtersMenu">
            Filtros
          </button>
          <mat-menu #filtersMenu="matMenu" class="filters-menu">
            <div class="filters-menu-body" (click)="$event.stopPropagation()">
              <kg-graph-filters
                [state]="filters()"
                (filtersChange)="onFiltersChange($event)"
                (reload)="reloadGraph()"
              />
            </div>
          </mat-menu>
          <button mat-stroked-button type="button" (click)="reloadGraph()">Recarregar grafo</button>
          <mat-form-field class="search-field" appearance="outline" subscriptSizing="dynamic">
            <mat-label>Buscar nó</mat-label>
            <input
              matInput
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchInput($event)"
              [matAutocomplete]="auto"
            />
            <mat-autocomplete
              #auto="matAutocomplete"
              (optionSelected)="onSearchPick($event.option.value)"
            >
              @for (hit of explorer.searchResults(); track hit.id) {
                <mat-option [value]="hit.id">{{ hit.label }} ({{ hit.type }})</mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>
        </mat-toolbar>

        @if (explorer.loading()) {
          <mat-progress-bar mode="indeterminate" />
        }
        @if (explorer.error(); as err) {
          <p class="banner error">{{ err }}</p>
        }

        <div class="workspace">
          <kg-corpus-tree (fileSelected)="onFileSelected($event)" />
          <kg-file-content-panel (chunkSelected)="onChunkSelected($event)" />
          <div class="canvas-area">
            <kg-force-graph
              #graphCanvas
              [graphData]="forceGraphData()"
              [focusNodeId]="focusNodeId()"
              (nodeClick)="onNodeClick($event)"
            />
            <kg-graph-legend />
          </div>
        </div>
      </mat-sidenav-content>

      <mat-sidenav
        position="end"
        mode="over"
        [opened]="sidenavOpen()"
        (closed)="closeSidenav()"
        class="detail-sidenav"
      >
        @if (selectedNodeId(); as nodeId) {
          <kg-node-detail-sidenav
            [nodeId]="nodeId"
            (focusNode)="onFocusNode($event)"
            (expandNeighbors)="onExpandNeighbors($event)"
          />
        }
      </mat-sidenav>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .explorer-root,
      .main-pane {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: var(--kg-bg, #1e1e1e);
        color: var(--kg-text, #cccccc);
      }
      .toolbar {
        gap: 0.5rem;
        flex-shrink: 0;
        background: #252526 !important;
        color: #cccccc !important;
        border-bottom: 1px solid #3c3c3c;
        border-radius: 0;
      }
      .title {
        font-weight: 600;
        color: #ffffff;
      }
      .stats {
        font-size: 0.85rem;
        color: #9d9d9d;
      }
      .spacer {
        flex: 1;
      }
      .search-field {
        width: min(280px, 32vw);
        margin-bottom: 0;
      }
      .toolbar button[mat-stroked-button] {
        flex-shrink: 0;
      }
      .filters-menu-body {
        padding: 0.5rem;
        min-width: 240px;
      }
      .workspace {
        flex: 1;
        display: flex;
        min-height: 0;
        background: #1e1e1e;
      }
      .canvas-area {
        position: relative;
        flex: 1;
        min-width: 0;
        min-height: 0;
        background: #1e1e1e;
      }
      .detail-sidenav {
        width: min(440px, 92vw);
        max-width: 92vw;
        border-radius: 0;
      }
      .banner.error {
        margin: 0;
        padding: 0.5rem 1rem;
        background: #3c1f1f;
        color: #f48771;
        border-bottom: 1px solid #5a2d2d;
      }
      :host ::ng-deep .mat-mdc-progress-bar {
        --mdc-linear-progress-active-indicator-color: #007fd4;
      }
      :host ::ng-deep .filters-menu .filters {
        border-right: none;
        max-width: none;
        min-width: 220px;
      }
    `,
  ],
})
export class GraphExplorerComponent implements OnInit {
  @ViewChild("graphCanvas") graphCanvas?: ForceGraphComponent;

  protected readonly explorer = inject(GraphExplorerService);
  private readonly corpus = inject(CorpusService);
  private readonly nodeDetail = inject(NodeDetailService);

  readonly filters = signal<GraphFilterState>(defaultGraphFilters());
  readonly sidenavOpen = signal(false);
  readonly selectedNodeId = signal<string | null>(null);
  readonly focusNodeId = signal<string | null>(null);
  searchQuery = "";

  readonly forceGraphData = computed(() => toForceGraphData(this.explorer.graphData()));

  ngOnInit(): void {
    void this.explorer.loadStats();
    void this.reloadGraph();
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.sidenavOpen()) {
      this.closeSidenav();
    }
  }

  onFiltersChange(state: GraphFilterState): void {
    this.filters.set(state);
  }

  async reloadGraph(): Promise<void> {
    await this.explorer.loadGraph(this.filters());
  }

  onSearchInput(q: string): void {
    void this.explorer.search(q);
  }

  onSearchPick(nodeId: string): void {
    void this.onNodeFocusFromGraph(nodeId);
  }

  async onFileSelected(payload: { path: string; nodeId: string }): Promise<void> {
    await this.corpus.loadFile(payload.path);
    this.focusNodeId.set(payload.nodeId);
    await this.explorer.loadGraph(
      this.filters(),
      payload.nodeId,
      1,
      "fileNeighborhood",
    );
    this.graphCanvas?.focusNode(payload.nodeId);
  }

  async onChunkSelected(chunkId: string): Promise<void> {
    this.focusNodeId.set(chunkId);
    await this.explorer.loadGraph(this.filters(), chunkId, 1, "chunkNeighborhood");
    this.graphCanvas?.focusNode(chunkId);
  }

  async onNodeClick(node: ForceGraphNode): Promise<void> {
    if (node.type === "File" || node.type === "Document") {
      await this.onNodeFocusFromGraph(node.id);
      return;
    }
    if (node.type === "Chunk") {
      const path = await this.resolveChunkFilePath(node.id);
      if (path) {
        await this.corpus.loadFile(path);
        this.corpus.selectChunk(node.id);
      }
      this.focusNodeId.set(node.id);
      await this.explorer.loadGraph(this.filters(), node.id, 1, "chunkNeighborhood");
      this.graphCanvas?.focusNode(node.id);
      return;
    }
    this.selectedNodeId.set(node.id);
    this.sidenavOpen.set(true);
    await this.nodeDetail.load(node.id);
  }

  async onFocusNode(nodeId: string): Promise<void> {
    await this.onNodeFocusFromGraph(nodeId);
  }

  private async onNodeFocusFromGraph(nodeId: string): Promise<void> {
    this.focusNodeId.set(nodeId);
    this.selectedNodeId.set(nodeId);
    this.graphCanvas?.focusNode(nodeId);
    const detail = await this.nodeDetail.load(nodeId);
    const type = detail?.node.type;
    if (type === "File" || type === "Document") {
      const path =
        (detail?.node.properties["path"] as string) ??
        detail?.relatedDocuments[0]?.path;
      if (path) {
        await this.corpus.loadFile(path);
        await this.explorer.loadGraph(this.filters(), nodeId, 1, "fileNeighborhood");
        return;
      }
    }
    if (type === "Chunk") {
      const path = detail?.relatedChunks[0]?.path ?? detail?.node.properties["path"];
      if (typeof path === "string") {
        await this.corpus.loadFile(path);
        this.corpus.selectChunk(nodeId);
      }
      await this.explorer.loadGraph(this.filters(), nodeId, 1, "chunkNeighborhood");
      return;
    }
    this.sidenavOpen.set(true);
    await this.explorer.loadGraph(this.filters(), nodeId, 1);
  }

  async onExpandNeighbors(nodeId: string): Promise<void> {
    await this.explorer.mergeNeighbors(nodeId);
    this.onFocusNode(nodeId);
  }

  closeSidenav(): void {
    this.sidenavOpen.set(false);
    this.nodeDetail.clear();
  }

  private async resolveChunkFilePath(chunkId: string): Promise<string | null> {
    const detail = await this.nodeDetail.load(chunkId);
    const path = detail?.relatedChunks[0]?.path ?? detail?.node.properties["path"];
    return typeof path === "string" ? path : null;
  }
}
