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
        <strong class="label">{{ n.label }}</strong>
        <div class="row"><span class="k">tipo</span> {{ n.type }}</div>
        <div class="row id-row"><span class="k">id</span> <code>{{ n.id }}</code></div>
        @if (n.path) {
          <div class="row"><span class="k">path</span> <span class="v">{{ n.path }}</span></div>
        }
      </div>
    }
  `,
  styles: [
    `
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
      .v,
      code {
        font-size: 0.75rem;
        word-break: break-all;
      }
      code {
        font-family: Consolas, monospace;
        color: #d4d4d4;
      }
    `,
  ],
})
export class NodeHoverDialogComponent {
  readonly node = input<ForceGraphNode | null>(null);
  readonly x = input(0);
  readonly y = input(0);
}
