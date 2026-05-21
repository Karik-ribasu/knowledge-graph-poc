import { Component, OnInit, computed, inject, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import type { CorpusTreeNode } from "@kg/core/explorer/schemas";
import { CorpusService } from "../../../core/services/corpus.service";

interface FlatTreeRow {
  node: CorpusTreeNode;
  depth: number;
}

@Component({
  selector: "kg-corpus-tree",
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="tree-panel" role="navigation" aria-label="Explorador de corpus">
      <div class="tree-header">
        <span>Corpus</span>
        <button mat-icon-button type="button" (click)="refresh()">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>
      @if (corpus.treeLoading()) {
        <mat-spinner diameter="24" />
      } @else if (rows().length) {
        <div class="tree-list">
          @for (row of rows(); track row.node.path) {
            @if (row.node.kind === "folder") {
              <div
                class="tree-folder"
                [style.padding-left.px]="8 + row.depth * 14"
              >
                <mat-icon class="node-icon" aria-hidden="true">folder</mat-icon>
                <span class="node-label">{{ row.node.name }}</span>
              </div>
            } @else {
              <button
                mat-button
                type="button"
                class="tree-row"
                [class.selected]="corpus.selectedPath() === row.node.path"
                [style.padding-left.px]="8 + row.depth * 14"
                (click)="onFileClick(row.node)"
              >
                <mat-icon class="node-icon" aria-hidden="true">description</mat-icon>
                <span class="node-label">{{ row.node.name }}</span>
              </button>
            }
          }
        </div>
      } @else {
        <p class="empty">Nenhum arquivo no corpus. Execute ingest e recarregue.</p>
      }
    </div>
  `,
  styles: [
    `
      .tree-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 260px;
        flex-shrink: 0;
        background: #252526;
        border-right: 1px solid #3c3c3c;
      }
      .tree-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.35rem 0.5rem 0.75rem;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #9d9d9d;
        border-bottom: 1px solid #3c3c3c;
      }
      .tree-list {
        flex: 1;
        overflow: auto;
        padding: 0.25rem 0;
      }
      .tree-folder {
        display: flex;
        align-items: center;
        min-height: 26px;
        padding: 0 0.5rem 0 0;
        color: #9d9d9d;
        font-size: 0.78rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        user-select: none;
      }
      .tree-row {
        width: 100%;
        justify-content: flex-start;
        text-align: left;
        color: #cccccc;
        font-size: 0.82rem;
        min-height: 28px;
        border-radius: 0;
      }
      .tree-row.selected {
        background: #094771;
        color: #ffffff;
      }
      .node-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        margin-right: 0.35rem;
        color: #9d9d9d;
      }
      .tree-row.selected .node-icon {
        color: #ffffff;
      }
      .node-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .empty {
        padding: 0.75rem;
        font-size: 0.8rem;
        color: #9d9d9d;
      }
    `,
  ],
})
export class CorpusTreeComponent implements OnInit {
  readonly fileSelected = output<{ path: string; nodeId: string }>();

  protected readonly corpus = inject(CorpusService);

  readonly rows = computed(() => flattenTree(this.corpus.tree()));

  ngOnInit(): void {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    await this.corpus.loadTree();
  }

  onFileClick(node: CorpusTreeNode): void {
    if (!node.nodeId) return;
    this.fileSelected.emit({ path: node.path, nodeId: node.nodeId });
  }
}

function flattenTree(root: CorpusTreeNode | null): FlatTreeRow[] {
  if (!root) return [];
  const out: FlatTreeRow[] = [];
  const walk = (nodes: CorpusTreeNode[], depth: number): void => {
    for (const node of nodes) {
      out.push({ node, depth });
      if (node.children?.length) {
        walk(node.children, depth + 1);
      }
    }
  };
  walk(root.children ?? [root], 0);
  return out;
}
