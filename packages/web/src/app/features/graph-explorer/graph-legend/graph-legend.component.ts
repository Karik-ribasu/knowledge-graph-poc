import { Component } from "@angular/core";
import { edgeColor, nodeColor } from "@kg/core/explorer/graph-theme";

@Component({
  selector: "kg-graph-legend",
  standalone: true,
  template: `
    <aside class="legend" aria-label="Legenda do grafo">
      <h3>Nós</h3>
      <ul>
        @for (item of nodeLegend; track item.type) {
          <li>
            <span class="swatch" [style.background]="item.color"></span>
            {{ item.type }}
          </li>
        }
      </ul>
      <h3>Arestas</h3>
      <ul>
        @for (item of edgeLegend; track item.type) {
          <li>
            <span class="swatch edge" [style.background]="item.color"></span>
            {{ item.type }}
            @if (item.dashed) {
              <span class="hint">(tracejado)</span>
            }
          </li>
        }
      </ul>
    </aside>
  `,
  styles: [
    `
      .legend {
        position: absolute;
        right: 0.5rem;
        bottom: 0.5rem;
        z-index: 2;
        background: rgba(37, 37, 38, 0.92);
        border: 1px solid #3c3c3c;
        border-radius: 0;
        padding: 0.45rem 0.55rem;
        font-size: 0.7rem;
        max-width: 180px;
        max-height: 42vh;
        overflow: auto;
        pointer-events: none;
        color: #cccccc;
      }
      h3 {
        margin: 0.25rem 0;
        font-size: 0.7rem;
        text-transform: uppercase;
        color: #9d9d9d;
        letter-spacing: 0.05em;
      }
      ul {
        list-style: none;
        margin: 0 0 0.5rem;
        padding: 0;
      }
      li {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        margin: 0.1rem 0;
      }
      .swatch {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .swatch.edge {
        border-radius: 2px;
        height: 3px;
        width: 14px;
      }
      .hint {
        color: #9d9d9d;
      }
    `,
  ],
})
export class GraphLegendComponent {
  readonly nodeLegend = [
    "Folder",
    "File",
    "Section",
    "Chunk",
    "Product",
    "Competitor",
    "Persona",
    "ICP",
    "Feature",
  ].map((type) => ({ type, color: nodeColor(type) }));

  readonly edgeLegend = (
    [
      ["contains", false],
      ["linksTo", false],
      ["mentions", true],
      ["competesWith", false],
      ["targetsICP", false],
    ] as const
  ).map(([type, dashed]) => ({
    type,
    color: edgeColor(type),
    dashed,
  }));
}
