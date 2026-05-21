import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  effect,
  input,
  output,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import ForceGraphLib from "force-graph";
import {
  DEFAULT_CHARGE_STRENGTH,
  DEFAULT_LINK_DISTANCE,
  computeLinkWidth,
  isDashedEdge,
} from "@kg/core/explorer/graph-theme";

const HOVER_DIM_NODE_COLOR = "#5a5a5a";
const HOVER_DIM_LINK_COLOR = "#3d3d3d";
import type { ForceGraphData, ForceGraphLink, ForceGraphNode } from "../../../core/utils/force-graph-data";

const HOVER_CLEAR_MS = 200;
const COOLDOWN_TICKS = 150;

@Component({
  selector: "kg-force-graph",
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="canvas-wrap" [attr.data-simulation-frozen]="paused ? '' : null">
      <div #container class="graph-host"></div>
      @if (hoverCardNode; as n) {
        <div #hoverCard class="hover-card" role="tooltip">
          <strong class="label">{{ n.label }}</strong>
          <div class="row"><span class="k">tipo</span> {{ n.type }}</div>
          <div class="row"><span class="k">id</span> <code>{{ n.id }}</code></div>
        </div>
      }
      <div class="canvas-controls">
        <button
          mat-icon-button
          type="button"
          matTooltip="Pausar / retomar simulação"
          (click)="toggleSimulation()"
        >
          <mat-icon>{{ paused ? "play_arrow" : "pause" }}</mat-icon>
        </button>
        <button mat-icon-button type="button" matTooltip="Ajustar zoom" (click)="zoomToFit()">
          <mat-icon>fit_screen</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .canvas-wrap {
        position: relative;
        flex: 1;
        min-height: 0;
        min-width: 0;
        background: var(--kg-canvas, #1e1e1e);
      }
      .graph-host {
        width: 100%;
        height: 100%;
      }
      .graph-host :global(canvas) {
        display: block;
      }
      .hover-card {
        position: fixed;
        z-index: 1000;
        transform: translate(14px, -50%);
        pointer-events: none;
        background: #252526;
        color: #cccccc;
        border: 1px solid #3c3c3c;
        border-radius: 0;
        padding: 0.5rem 0.65rem;
        font-size: 0.8rem;
        max-width: 340px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.55);
        line-height: 1.45;
      }
      .label {
        display: block;
        color: #ffffff;
        font-size: 0.88rem;
        margin-bottom: 0.35rem;
      }
      .row {
        margin-top: 0.15rem;
      }
      .k {
        color: #9d9d9d;
        margin-right: 0.35rem;
      }
      code {
        font-size: 0.75rem;
        font-family: Consolas, monospace;
        color: #d4d4d4;
        word-break: break-all;
      }
      .canvas-controls {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        display: flex;
        gap: 0.25rem;
        z-index: 2;
      }
      .canvas-controls button {
        background: var(--kg-surface-raised, #2d2d2d);
        color: var(--kg-text, #cccccc);
        border: 1px solid var(--kg-border, #3c3c3c);
      }
    `,
  ],
})
export class ForceGraphComponent implements AfterViewInit, OnDestroy {
  @ViewChild("container", { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild("hoverCard") hoverCardRef?: ElementRef<HTMLDivElement>;

  readonly graphData = input<ForceGraphData>({ nodes: [], links: [] });
  readonly focusNodeId = input<string | null>(null);

  readonly nodeClick = output<ForceGraphNode>();

  paused = false;
  hoverCardNode: ForceGraphNode | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private graph: any = null;
  private readonly createGraph = ForceGraphLib as unknown as () => (el: HTMLElement) => any;
  private resizeObserver: ResizeObserver | null = null;
  private hoveredNodeId: string | null = null;
  private hoverClearTimer: ReturnType<typeof setTimeout> | null = null;
  private lastGraphKey = "";
  private rafHoverPos = 0;

  constructor(private readonly zone: NgZone) {
    effect(() => {
      const data = this.graphData();
      const focusId = this.focusNodeId();
      if (!this.graph) return;
      const key = graphDataKey(data);
      if (key === this.lastGraphKey) return;
      this.lastGraphKey = key;
      this.zone.runOutsideAngular(() => {
        this.clearHoverState();
        this.graph.graphData(this.cloneGraphData(data));
        this.unfreezeSimulation();
        if (focusId) {
          this.focusNodeInternal(focusId);
        }
      });
    });

    effect(() => {
      const focusId = this.focusNodeId();
      if (!this.graph || !focusId || !this.paused) return;
      this.zone.runOutsideAngular(() => this.focusNodeInternal(focusId));
    });
  }

  ngAfterViewInit(): void {
    const el = this.containerRef.nativeElement;
    this.zone.runOutsideAngular(() => {
      this.graph = this.createGraph()(el)
        .width(el.clientWidth)
        .height(el.clientHeight)
        .backgroundColor("#1e1e1e")
        .nodeId("id")
        .nodeLabel(() => "")
        .nodeVal((d: ForceGraphNode) => d.val)
        .nodeColor((d: ForceGraphNode) => this.colorForNode(d))
        .linkColor((l: ForceGraphLink) => this.colorForLink(l))
        .linkWidth(() => computeLinkWidth(1))
        .linkCurvature((l: ForceGraphLink) => l.curvature ?? 0.15)
        .linkDirectionalArrowLength(4)
        .linkDirectionalArrowRelPos(1)
        .linkLineDash((l: ForceGraphLink) => (l.dashed || isDashedEdge(l.type) ? [3, 3] : null))
        .d3AlphaDecay(0.08)
        .d3AlphaMin(0.05)
        .d3VelocityDecay(0.35)
        .cooldownTicks(COOLDOWN_TICKS)
        .onNodeHover((node: ForceGraphNode | null) => this.handleNodeHover(node))
        .onEngineStop(() => this.onSimulationSettled())
        .onNodeClick((node: ForceGraphNode) => {
          this.zone.run(() => this.nodeClick.emit(node));
        });

      this.applyForces();
      const data = this.graphData();
      this.lastGraphKey = graphDataKey(data);
      this.graph.graphData(this.cloneGraphData(data));
      this.unfreezeSimulation();
    });

    this.resizeObserver = new ResizeObserver(() => {
      const host = this.containerRef.nativeElement;
      if (this.graph && host.clientWidth && host.clientHeight) {
        this.graph.width(host.clientWidth).height(host.clientHeight);
      }
    });
    this.resizeObserver.observe(el);
  }

  ngOnDestroy(): void {
    if (this.hoverClearTimer) clearTimeout(this.hoverClearTimer);
    cancelAnimationFrame(this.rafHoverPos);
    this.resizeObserver?.disconnect();
    if (this.graph) {
      this.containerRef.nativeElement.innerHTML = "";
      this.graph = null;
    }
  }

  toggleSimulation(): void {
    if (!this.graph) return;
    if (this.paused) {
      this.paused = false;
      this.unfreezeSimulation();
    } else {
      this.freezeSimulation();
      this.paused = true;
    }
  }

  zoomToFit(ms = 400, padding = 48): void {
    if (!this.graph) return;
    this.zone.runOutsideAngular(() => {
      this.graph.zoomToFit(ms, padding);
    });
  }

  focusNode(nodeId: string): void {
    this.zone.runOutsideAngular(() => this.focusNodeInternal(nodeId));
  }

  private colorForNode(node: ForceGraphNode): string {
    if (!this.hoveredNodeId) return node.color;
    return node.id === this.hoveredNodeId ? node.color : HOVER_DIM_NODE_COLOR;
  }

  private colorForLink(link: ForceGraphLink): string {
    if (!this.hoveredNodeId) return link.color;
    const src = linkEndpointId(link.source);
    const tgt = linkEndpointId(link.target);
    if (src === this.hoveredNodeId || tgt === this.hoveredNodeId) return link.color;
    return HOVER_DIM_LINK_COLOR;
  }

  private applyForces(): void {
    if (!this.graph) return;
    const linkForce = this.graph.d3Force("link");
    if (linkForce) {
      linkForce.distance(DEFAULT_LINK_DISTANCE).strength(0.35);
    }
    const chargeForce = this.graph.d3Force("charge");
    if (chargeForce) {
      chargeForce.strength(DEFAULT_CHARGE_STRENGTH).distanceMax(480);
    }
    const centerForce = this.graph.d3Force("center");
    if (centerForce) {
      centerForce.strength(0.04);
    }
  }

  private onSimulationSettled(): void {
    if (!this.graph) return;
    this.zone.runOutsideAngular(() => {
      this.freezeSimulation();
      this.graph.zoomToFit(400, 56);
      const focusId = this.focusNodeId();
      if (focusId) {
        this.focusNodeInternal(focusId);
      }
    });
    this.zone.run(() => {
      this.paused = true;
    });
  }

  private freezeSimulation(): void {
    if (!this.graph) return;
    this.graph.cooldownTicks(0);
    this.graph.d3Force("charge")?.strength(0);
    this.graph.d3Force("link")?.strength(0);
    this.graph.d3Force("center")?.strength(0);
  }

  private unfreezeSimulation(): void {
    if (!this.graph) return;
    this.paused = false;
    this.applyForces();
    this.graph.cooldownTicks(COOLDOWN_TICKS);
    this.graph.d3ReheatSimulation();
  }

  private handleNodeHover(node: ForceGraphNode | null): void {
    if (this.hoverClearTimer) {
      clearTimeout(this.hoverClearTimer);
      this.hoverClearTimer = null;
    }

    if (node) {
      if (this.hoveredNodeId === node.id) return;
      this.hoveredNodeId = node.id;
      this.zone.run(() => {
        this.hoverCardNode = node;
        queueMicrotask(() => this.updateHoverCardPosition(node));
      });
      this.refreshGraphColors();
      return;
    }

    this.hoverClearTimer = setTimeout(() => {
      this.clearHoverState();
      this.hoverClearTimer = null;
    }, HOVER_CLEAR_MS);
  }

  private clearHoverState(): void {
    this.hoveredNodeId = null;
    this.zone.run(() => {
      this.hoverCardNode = null;
    });
    this.refreshGraphColors();
    cancelAnimationFrame(this.rafHoverPos);
  }

  private refreshGraphColors(): void {
    if (!this.graph) return;
    this.graph.nodeColor((d: ForceGraphNode) => this.colorForNode(d));
    this.graph.linkColor((l: ForceGraphLink) => this.colorForLink(l));
  }

  private updateHoverCardPosition(node: ForceGraphNode): void {
    cancelAnimationFrame(this.rafHoverPos);
    this.rafHoverPos = requestAnimationFrame(() => {
      const card = this.hoverCardRef?.nativeElement;
      if (!card || !this.graph || node.x === undefined || node.y === undefined) return;
      const coords = this.graph.graph2ScreenCoords(node.x, node.y);
      if (!coords) return;
      const rect = this.containerRef.nativeElement.getBoundingClientRect();
      card.style.left = `${rect.left + coords.x}px`;
      card.style.top = `${rect.top + coords.y}px`;
    });
  }

  private focusNodeInternal(nodeId: string): void {
    if (!this.graph) return;
    const data = this.graph.graphData() as { nodes: ForceGraphNode[] };
    const node = data.nodes.find((n) => n.id === nodeId);
    if (!node || node.x === undefined || node.y === undefined) {
      this.graph.zoomToFit(400, 56);
      return;
    }
    this.graph.centerAt(node.x, node.y, 600);
    this.graph.zoom(2.2, 600);
  }

  private cloneGraphData(data: ForceGraphData): ForceGraphData {
    return {
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    };
  }
}

function graphDataKey(data: ForceGraphData): string {
  if (!data.nodes.length) return "empty";
  const nodeIds = data.nodes.map((n) => n.id).sort().join("|");
  const linkKeys = data.links
    .map((l) => `${linkEndpointId(l.source)}-${linkEndpointId(l.target)}-${l.type}`)
    .sort()
    .join("|");
  return `${data.nodes.length}:${data.links.length}:${nodeIds}:${linkKeys}`;
}

function linkEndpointId(endpoint: string | ForceGraphNode): string {
  return typeof endpoint === "string" ? endpoint : endpoint.id;
}
