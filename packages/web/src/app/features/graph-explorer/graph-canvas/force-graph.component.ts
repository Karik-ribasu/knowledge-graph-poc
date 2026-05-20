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
import { computeLinkWidth, isDashedEdge } from "@kg/core/explorer/graph-theme";
import type { ForceGraphData, ForceGraphLink, ForceGraphNode } from "../../../core/utils/force-graph-data";

@Component({
  selector: "kg-force-graph",
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="canvas-wrap">
      <div #container class="graph-host"></div>
      <div class="canvas-controls">
        <button
          mat-mini-fab
          type="button"
          matTooltip="Pausar / retomar simulação"
          (click)="toggleSimulation()"
        >
          {{ paused ? "▶" : "⏸" }}
        </button>
        <button mat-mini-fab type="button" matTooltip="Ajustar zoom" (click)="zoomToFit()">
          ⊞
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
      }
      .graph-host {
        width: 100%;
        height: 100%;
      }
      .graph-host :global(canvas) {
        display: block;
      }
      .canvas-controls {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        display: flex;
        gap: 0.5rem;
        z-index: 2;
      }
    `,
  ],
})
export class ForceGraphComponent implements AfterViewInit, OnDestroy {
  @ViewChild("container", { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  readonly graphData = input<ForceGraphData>({ nodes: [], links: [] });
  readonly focusNodeId = input<string | null>(null);

  readonly nodeHover = output<{ node: ForceGraphNode; x: number; y: number } | null>();
  readonly nodeClick = output<ForceGraphNode>();

  paused = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private graph: any = null;
  private readonly createGraph = ForceGraphLib as unknown as () => (
    el: HTMLElement,
  ) => any;
  private resizeObserver: ResizeObserver | null = null;

  constructor(private readonly zone: NgZone) {
    effect(() => {
      const data = this.graphData();
      const focusId = this.focusNodeId();
      if (this.graph) {
        this.zone.runOutsideAngular(() => {
          this.graph.graphData(this.cloneGraphData(data));
          if (focusId) {
            this.focusNodeInternal(focusId);
          }
        });
      }
    });
  }

  ngAfterViewInit(): void {
    const el = this.containerRef.nativeElement;
    this.zone.runOutsideAngular(() => {
      this.graph = this.createGraph()(el)
        .width(el.clientWidth)
        .height(el.clientHeight)
        .nodeId("id")
        .nodeLabel((d: ForceGraphNode) =>
          d.label.length > 32 ? `${d.label.slice(0, 32)}…` : d.label,
        )
        .nodeVal((d: ForceGraphNode) => d.val)
        .nodeColor((d: ForceGraphNode) => d.color)
        .linkColor((l: ForceGraphLink) => l.color)
        .linkWidth((l: ForceGraphLink) => computeLinkWidth(1))
        .linkDirectionalArrowLength(6)
        .linkDirectionalArrowRelPos(1)
        .linkLineDash((l: ForceGraphLink) => (l.dashed || isDashedEdge(l.type) ? [4, 4] : null))
        .onNodeHover((node: ForceGraphNode | null) => {
          this.zone.run(() => {
            if (!node) {
              this.nodeHover.emit(null);
              return;
            }
            const coords = this.graph?.graph2ScreenCoords(node.x, node.y);
            this.nodeHover.emit({
              node,
              x: coords?.x ?? 0,
              y: coords?.y ?? 0,
            });
          });
        })
        .onNodeClick((node: ForceGraphNode) => {
          this.zone.run(() => this.nodeClick.emit(node));
        });

      this.graph.graphData(this.cloneGraphData(this.graphData()));
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
    this.resizeObserver?.disconnect();
    if (this.graph) {
      const host = this.containerRef.nativeElement;
      host.innerHTML = "";
      this.graph = null;
    }
  }

  toggleSimulation(): void {
    if (!this.graph) return;
    this.paused = !this.paused;
    this.zone.runOutsideAngular(() => {
      this.graph.d3Force("charge")?.strength(this.paused ? 0 : -120);
      if (this.paused) {
        this.graph.cooldownTicks(0);
      } else {
        this.graph.d3ReheatSimulation();
      }
    });
  }

  zoomToFit(ms = 400, padding = 40): void {
    if (!this.graph) return;
    this.zone.runOutsideAngular(() => {
      this.graph.zoomToFit(ms, padding);
    });
  }

  focusNode(nodeId: string): void {
    this.zone.runOutsideAngular(() => this.focusNodeInternal(nodeId));
  }

  private focusNodeInternal(nodeId: string): void {
    if (!this.graph) return;
    const data = this.graph.graphData() as { nodes: ForceGraphNode[] };
    const node = data.nodes.find((n) => n.id === nodeId);
    if (!node || node.x === undefined || node.y === undefined) return;
    this.graph.centerAt(node.x, node.y, 600);
    this.graph.zoom(2.5, 600);
  }

  private cloneGraphData(data: ForceGraphData): ForceGraphData {
    return {
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    };
  }
}
