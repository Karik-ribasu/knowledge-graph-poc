import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import {
  EXPLORER_NODE_TYPES,
  type GraphFilterState,
  defaultGraphFilters,
} from "../../../core/models/graph-filters.model";

@Component({
  selector: "kg-graph-filters",
  standalone: true,
  imports: [
    FormsModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <section class="filters" aria-label="Filtros do grafo">
      <mat-slide-toggle
        [checked]="state().hideStructure"
        (change)="onHideStructure($event.checked)"
      >
        Ocultar Chunk / Section (P0)
      </mat-slide-toggle>

      <div class="type-grid">
        @for (nodeType of nodeTypes; track nodeType) {
          <mat-checkbox
            [checked]="isSelected(nodeType)"
            (change)="toggleType(nodeType, $event.checked)"
          >
            {{ nodeType }}
          </mat-checkbox>
        }
      </div>

      <mat-form-field appearance="outline" class="doc-type">
        <mat-label>doc_type</mat-label>
        <input
          matInput
          [ngModel]="state().docType"
          (ngModelChange)="onDocType($event)"
          placeholder="ex.: playbook"
        />
      </mat-form-field>

      <button mat-flat-button color="primary" type="button" (click)="reload.emit()">
        Recarregar grafo
      </button>
    </section>
  `,
  styles: [
    `
      .filters {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.75rem;
        min-width: 220px;
        max-width: 280px;
        border-right: 1px solid var(--kg-border, #e2e8f0);
        background: var(--kg-surface, #f8fafc);
        overflow-y: auto;
      }
      .type-grid {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }
      .doc-type {
        width: 100%;
      }
    `,
  ],
})
export class GraphFiltersComponent {
  readonly state = input<GraphFilterState>(defaultGraphFilters());
  readonly filtersChange = output<GraphFilterState>();
  readonly reload = output<void>();

  readonly nodeTypes = [...EXPLORER_NODE_TYPES];

  isSelected(nodeType: string): boolean {
    return this.state().nodeTypes.includes(nodeType);
  }

  toggleType(nodeType: string, checked: boolean): void {
    const current = new Set(this.state().nodeTypes);
    if (checked) {
      current.add(nodeType);
    } else {
      current.delete(nodeType);
    }
    this.emit({ ...this.state(), nodeTypes: [...current] });
  }

  onHideStructure(checked: boolean): void {
    let nodeTypes = [...this.state().nodeTypes];
    if (checked) {
      nodeTypes = nodeTypes.filter((t) => t !== "Chunk" && t !== "Section");
    } else {
      for (const t of ["Chunk", "Section"] as const) {
        if (!nodeTypes.includes(t)) {
          nodeTypes.push(t);
        }
      }
    }
    this.emit({ ...this.state(), hideStructure: checked, nodeTypes });
  }

  onDocType(value: string): void {
    this.emit({ ...this.state(), docType: value });
  }

  private emit(next: GraphFilterState): void {
    this.filtersChange.emit(next);
  }
}
