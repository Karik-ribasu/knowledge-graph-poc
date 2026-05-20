import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { GraphExplorerService } from "../../core/services/graph-explorer.service";
import { NodeDetailService } from "../../core/services/node-detail.service";
import {
  defaultGraphFilters,
  type GraphFilterState,
} from "../../core/models/graph-filters.model";
import { toForceGraphData } from "../../core/utils/force-graph-data";
import type { ForceGraphNode } from "../../core/utils/force-graph-data";
import { ForceGraphComponent } from "./graph-canvas/force-graph.component";
import { GraphFiltersComponent } from "./graph-filters/graph-filters.component";
import { GraphLegendComponent } from "./graph-legend/graph-legend.component";
import { NodeDetailSidenavComponent } from "./node-detail-sidenav/node-detail-sidenav.component";
import { NodeHoverDialogComponent } from "./node-hover-dialog/node-hover-dialog.component";

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
    MatProgressBarModule,
    GraphFiltersComponent,
    ForceGraphComponent,
    GraphLegendComponent,
    NodeHoverDialogComponent,
    NodeDetailSidenavComponent,
  ],
  template: `
    <mat-sidenav-container class="explorer-root">
      <mat-sidenav-content class="main-pane">
        <mat-toolbar color="primary" class="toolbar">
          <span class="title">Knowledge Graph Explorer</span>
          @if (explorer.stats(); as s) {
            <span class="stats">
              {{ s.nodes }} nós · {{ s.edges }} arestas · {{ s.documents }} docs
            </span>
          }
          <span class="spacer"></span>
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
          <kg-graph-filters
            [state]="filters()"
            (filtersChange)="onFiltersChange($event)"
            (reload)="reloadGraph()"
          />
          <div class="canvas-area">
            <kg-force-graph
              #graphCanvas
              [graphData]="forceData()"
              [focusNodeId]="focusNodeId()"
              (nodeHover)="onNodeHover($event)"
              (nodeClick)="onNodeClick($event)"
            />
            <kg-graph-legend />
            <kg-node-hover-dialog [node]="hoverNode()" [x]="hoverX()" [y]="hoverY()" />
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
      }
      .toolbar {
        gap: 1rem;
        flex-shrink: 0;
      }
      .title {
        font-weight: 600;
      }
      .stats {
        font-size: 0.85rem;
        opacity: 0.9;
      }
      .spacer {
        flex: 1;
      }
      .search-field {
        width: min(320px, 40vw);
        margin-bottom: -1.25rem;
      }
      .workspace {
        flex: 1;
        display: flex;
        min-height: 0;
      }
      .canvas-area {
        position: relative;
        flex: 1;
        min-width: 0;
        min-height: 0;
      }
      .detail-sidenav {
        width: 400px;
        max-width: 90vw;
      }
      .banner.error {
        margin: 0;
        padding: 0.5rem 1rem;
        background: #fef2f2;
        color: #b91c1c;
      }
    `,
  ],
})
export class GraphExplorerComponent implements OnInit {
  @ViewChild("graphCanvas") graphCanvas?: ForceGraphComponent;

  protected readonly explorer = inject(GraphExplorerService);
  private readonly nodeDetail = inject(NodeDetailService);

  readonly filters = signal<GraphFilterState>(defaultGraphFilters());
  readonly sidenavOpen = signal(false);
  readonly selectedNodeId = signal<string | null>(null);
  readonly focusNodeId = signal<string | null>(null);
  readonly hoverNode = signal<ForceGraphNode | null>(null);
  readonly hoverX = signal(0);
  readonly hoverY = signal(0);

  searchQuery = "";

  readonly forceData = () => toForceGraphData(this.explorer.graphData());

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
    this.onFocusNode(nodeId);
    this.selectedNodeId.set(nodeId);
    this.sidenavOpen.set(true);
    void this.nodeDetail.load(nodeId);
  }

  onNodeHover(
    payload: { node: ForceGraphNode; x: number; y: number } | null,
  ): void {
    if (!payload) {
      this.hoverNode.set(null);
      return;
    }
    this.hoverNode.set(payload.node);
    this.hoverX.set(payload.x);
    this.hoverY.set(payload.y);
  }

  async onNodeClick(node: ForceGraphNode): Promise<void> {
    this.selectedNodeId.set(node.id);
    this.sidenavOpen.set(true);
    await this.nodeDetail.load(node.id);
  }

  async onFocusNode(nodeId: string): Promise<void> {
    this.focusNodeId.set(nodeId);
    this.selectedNodeId.set(nodeId);
    this.graphCanvas?.focusNode(nodeId);
    if (this.sidenavOpen()) {
      await this.nodeDetail.load(nodeId);
    }
  }

  async onExpandNeighbors(nodeId: string): Promise<void> {
    await this.explorer.mergeNeighbors(nodeId);
    this.onFocusNode(nodeId);
  }

  closeSidenav(): void {
    this.sidenavOpen.set(false);
    this.nodeDetail.clear();
  }
}
