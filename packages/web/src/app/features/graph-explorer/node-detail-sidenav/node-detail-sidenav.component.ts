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
          <p class="meta">{{ d.node.type }} · <code>{{ d.node.id }}</code></p>
          <button mat-stroked-button type="button" (click)="expandNeighbors.emit(d.node.id)">
            Expandir vizinhos
          </button>
        </header>

        @let md = propsMarkdown(d);
        @if (md) {
          <section class="props-md">
            <markdown [data]="md"></markdown>
          </section>
        }

        @if (d.relatedChunks.length) {
          <mat-expansion-panel expanded>
            <mat-expansion-panel-header>Chunks relacionados</mat-expansion-panel-header>
            @for (chunk of d.relatedChunks; track chunk.chunkId) {
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  {{ chunk.heading || chunk.chunkId }}
                </mat-expansion-panel-header>
                <markdown [data]="chunk.snippet"></markdown>
              </mat-expansion-panel>
            }
          </mat-expansion-panel>
        }

        @if (d.incidentEdges.length) {
          <mat-expansion-panel expanded>
            <mat-expansion-panel-header>Arestas incidentes</mat-expansion-panel-header>
            <mat-nav-list>
              @for (edge of d.incidentEdges; track edge.edgeId) {
                <button mat-list-item type="button" (click)="onEdgeClick(edge)">
                  <span matListItemTitle>{{ edge.edgeType }}</span>
                  <span matListItemLine>
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
        padding: 1rem;
        overflow-y: auto;
        height: 100%;
        box-sizing: border-box;
      }
      .detail-header h2 {
        margin: 0 0 0.25rem;
        font-size: 1.1rem;
      }
      .meta {
        color: #64748b;
        font-size: 0.85rem;
      }
      .error {
        color: #dc2626;
      }
      .props-md {
        margin: 1rem 0;
        font-size: 0.9rem;
      }
      code {
        font-size: 0.75rem;
        word-break: break-all;
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
