import { Component, inject, input, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatListModule } from "@angular/material/list";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MarkdownComponent } from "ngx-markdown";
import type { IncidentEdgeDTO, NodeDetailDTO } from "@kg/core/explorer/schemas";
import { NodeDetailService } from "../../../core/services/node-detail.service";

@Component({
  selector: "kg-node-detail-sidenav",
  standalone: true,
  imports: [
    MatButtonModule,
    MatExpansionModule,
    MatListModule,
    MatProgressSpinnerModule,
    MarkdownComponent,
  ],
  template: `
    @if (detail.loading()) {
      <mat-spinner diameter="32" />
    } @else if (detail.error()) {
      <p class="error">{{ detail.error() }}</p>
    } @else {
      @if (detailData(); as d) {
        <header class="detail-header">
          <h2>{{ d.node.label }}</h2>
          <p class="meta">{{ d.node.type }}</p>
          <p class="id-line"><code>{{ d.node.id }}</code></p>
          <button mat-stroked-button type="button" class="expand-btn" (click)="expandNeighbors.emit(d.node.id)">
            Expandir vizinhos
          </button>
        </header>

        @let md = propsMarkdown(d);
        @if (md) {
          <section class="props-md kg-markdown">
            <markdown [data]="md"></markdown>
          </section>
        }

        @if (d.relatedChunks.length) {
          <mat-expansion-panel expanded class="panel">
            <mat-expansion-panel-header>Chunks relacionados</mat-expansion-panel-header>
            @for (chunk of d.relatedChunks; track chunk.chunkId) {
              <mat-expansion-panel class="panel nested">
                <mat-expansion-panel-header>
                  {{ chunk.heading || chunk.chunkId }}
                </mat-expansion-panel-header>
                <div class="kg-markdown chunk-body">
                  <markdown [data]="chunk.snippet"></markdown>
                </div>
              </mat-expansion-panel>
            }
          </mat-expansion-panel>
        }

        @if (d.incidentEdges.length) {
          <mat-expansion-panel expanded class="panel">
            <mat-expansion-panel-header>Arestas incidentes</mat-expansion-panel-header>
            <mat-nav-list>
              @for (edge of d.incidentEdges; track edge.edgeId) {
                <button mat-list-item type="button" class="edge-item" (click)="onEdgeClick(edge)">
                  <span matListItemTitle>{{ edge.edgeType }}</span>
                  <span matListItemLine class="edge-line">
                    {{ edge.direction === "outgoing" ? "→" : "←" }}
                    {{ neighborId(edge) }}
                  </span>
                </button>
              }
            </mat-nav-list>
          </mat-expansion-panel>
        }
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 1rem 1.1rem;
        overflow-y: auto;
        height: 100%;
        box-sizing: border-box;
        background: #252526;
        color: #cccccc;
      }
      .detail-header h2 {
        margin: 0 0 0.35rem;
        font-size: 1.15rem;
        font-weight: 600;
        color: #ffffff;
        line-height: 1.35;
      }
      .meta {
        color: #9d9d9d;
        font-size: 0.85rem;
        margin: 0 0 0.25rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .id-line {
        margin: 0 0 0.75rem;
      }
      .id-line code {
        font-family: Consolas, monospace;
        font-size: 0.78rem;
        color: #d4d4d4;
        background: #3c3c3c;
        padding: 0.2rem 0.4rem;
        word-break: break-all;
        display: block;
      }
      .expand-btn {
        width: 100%;
        border-radius: 0 !important;
        color: #cccccc !important;
        border-color: #3c3c3c !important;
      }
      .error {
        color: #f48771;
      }
      .props-md {
        margin: 1rem 0;
        padding: 0.75rem;
        background: #1e1e1e;
        border: 1px solid #3c3c3c;
      }
      .panel {
        margin-top: 0.5rem;
        border: 1px solid #3c3c3c !important;
        box-shadow: none !important;
      }
      .nested {
        margin: 0;
        border-left: 2px solid #007fd4;
      }
      .chunk-body {
        padding: 0 0.75rem 0.75rem;
        background: #1e1e1e;
      }
      .edge-item {
        color: #cccccc;
      }
      .edge-line {
        font-family: Consolas, monospace;
        font-size: 0.78rem !important;
        color: #9d9d9d !important;
      }
    `,
  ],
})
export class NodeDetailSidenavComponent {
  readonly nodeId = input.required<string>();
  readonly focusNode = output<string>();
  readonly expandNeighbors = output<string>();

  protected readonly detail = inject(NodeDetailService);

  detailData(): NodeDetailDTO | null {
    return this.detail.detail();
  }

  propsMarkdown(d: NodeDetailDTO): string {
    const props = d.node.properties;
    const lines: string[] = [];
    if (typeof props["path"] === "string") {
      lines.push(`**path:** \`${props["path"]}\``);
    }
    if (typeof props["doc_type"] === "string") {
      lines.push(`**doc_type:** ${props["doc_type"]}`);
    }
    if (typeof props["name"] === "string") {
      lines.push(`**name:** ${props["name"]}`);
    }
    if (typeof props["title"] === "string") {
      lines.push(`**title:** ${props["title"]}`);
    }
    if (typeof props["content"] === "string" && props["content"]) {
      lines.push("", props["content"] as string);
    } else if (typeof props["text"] === "string" && props["text"]) {
      lines.push("", props["text"] as string);
    }
    if (lines.length === 0) {
      lines.push("```json", JSON.stringify(props, null, 2), "```");
    }
    return lines.join("\n");
  }

  neighborId(edge: IncidentEdgeDTO): string {
    return edge.direction === "outgoing" ? edge.targetId : edge.sourceId;
  }

  onEdgeClick(edge: IncidentEdgeDTO): void {
    this.focusNode.emit(this.neighborId(edge));
  }
}
