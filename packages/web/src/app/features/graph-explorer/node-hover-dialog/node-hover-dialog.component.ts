import { Component, input } from "@angular/core";
import type { ForceGraphNode } from "../../../core/utils/force-graph-data";

@Component({
  selector: "kg-node-hover-dialog",
  standalone: true,
  template: `
    @if (node(); as n) {
      <div
        class="hover-card"
        role="tooltip"
        [style.left.px]="x()"
        [style.top.px]="y()"
      >
        <strong>{{ n.label }}</strong>
        <div class="row"><span class="k">tipo</span> {{ n.type }}</div>
        <div class="row"><span class="k">id</span> <code>{{ n.id }}</code></div>
        @if (n.path) {
          <div class="row"><span class="k">path</span> {{ n.path }}</div>
        }
        @if (n.doc_type) {
          <div class="row"><span class="k">doc_type</span> {{ n.doc_type }}</div>
        }
        @if (n.name) {
          <div class="row"><span class="k">name</span> {{ n.name }}</div>
        }
      </div>
    }
  `,
  styles: [
    `
      .hover-card {
        position: fixed;
        z-index: 1000;
        transform: translate(12px, 12px);
        pointer-events: none;
        background: #0f172a;
        color: #f8fafc;
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;
        max-width: 320px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      }
      .row {
        margin-top: 0.2rem;
      }
      .k {
        color: #94a3b8;
        margin-right: 0.35rem;
      }
      code {
        font-size: 0.72rem;
        word-break: break-all;
      }
    `,
  ],
})
export class NodeHoverDialogComponent {
  readonly node = input<ForceGraphNode | null>(null);
  readonly x = input(0);
  readonly y = input(0);
}
