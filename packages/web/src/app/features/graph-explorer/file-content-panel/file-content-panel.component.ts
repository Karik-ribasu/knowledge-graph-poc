import {
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  output,
} from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import type { ChunkAnchorDTO } from "@kg/core/explorer/schemas";
import { CorpusService } from "../../../core/services/corpus.service";

@Component({
  selector: "kg-file-content-panel",
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="content-panel">
      @if (corpus.fileLoading()) {
        <mat-spinner diameter="28" />
      } @else if (file()) {
        <header class="file-header">
          <h3>{{ file()!.title || file()!.path }}</h3>
          <p class="meta">{{ file()!.path }}</p>
        </header>
        <pre
          #contentPre
          class="file-body"
          (click)="onContentClick($event)"
        >@for (line of lines(); track line.num) {
<span
            class="line"
            [class.chunk-line]="line.chunkId"
            [class.chunk-selected]="line.chunkId && corpus.selectedChunkId() === line.chunkId"
            [attr.data-chunk-id]="line.chunkId"
            [attr.id]="line.chunkId ? 'chunk-' + line.chunkId : null"
          ><span class="ln">{{ line.num }}</span>{{ line.text }}</span>
}</pre>
      } @else {
        <p class="placeholder">Selecione um arquivo na árvore à esquerda.</p>
      }
    </div>
  `,
  styles: [
    `
      .content-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: min(360px, 32vw);
        min-width: 280px;
        flex-shrink: 0;
        background: #1e1e1e;
        border-right: 1px solid #3c3c3c;
        overflow: hidden;
      }
      .file-header {
        padding: 0.6rem 0.75rem;
        border-bottom: 1px solid #3c3c3c;
        flex-shrink: 0;
      }
      .file-header h3 {
        margin: 0;
        font-size: 0.9rem;
        color: #ffffff;
        font-weight: 600;
      }
      .meta {
        margin: 0.2rem 0 0;
        font-size: 0.72rem;
        color: #9d9d9d;
        word-break: break-all;
      }
      .file-body {
        flex: 1;
        margin: 0;
        padding: 0.5rem 0;
        overflow: auto;
        font-family: Consolas, "Courier New", monospace;
        font-size: 0.78rem;
        line-height: 1.5;
        color: #d4d4d4;
        white-space: pre-wrap;
        word-break: break-word;
        background: #1e1e1e;
        border: none;
      }
      .line {
        display: block;
        padding: 0 0.5rem 0 0;
      }
      .line.chunk-line {
        cursor: pointer;
        border-left: 2px solid transparent;
      }
      .line.chunk-line:hover {
        background: #2a2d2e;
      }
      .line.chunk-selected {
        background: #264f78;
        border-left-color: #007fd4;
      }
      .ln {
        display: inline-block;
        width: 2.5rem;
        margin-right: 0.5rem;
        color: #6e6e6e;
        user-select: none;
        text-align: right;
      }
      .placeholder {
        padding: 1rem;
        color: #9d9d9d;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class FileContentPanelComponent {
  @ViewChild("contentPre") contentPre?: ElementRef<HTMLPreElement>;

  readonly chunkSelected = output<string>();

  protected readonly corpus = inject(CorpusService);

  protected readonly file = computed(() => this.corpus.fileContent());

  readonly lines = computed(() => {
    const file = this.file();
    if (!file) return [] as { num: number; text: string; chunkId: string | null }[];
    const lineChunkMap = new Map<number, string>();
    const displayMarkdown = stripFrontmatter(file.rawMarkdown);
    const rawLines = displayMarkdown.split("\n");
    const bodyStartLine = frontmatterLineCount(file.rawMarkdown);
    for (const anchor of file.chunks) {
      for (let ln = anchor.startLine; ln <= anchor.endLine; ln++) {
        const displayLine = ln - bodyStartLine;
        if (displayLine >= 1) {
          lineChunkMap.set(displayLine, anchor.chunkId);
        }
      }
    }
    return rawLines.map((text, i) => {
      const num = i + 1;
      return { num, text, chunkId: lineChunkMap.get(num) ?? null };
    });
  });

  constructor() {
    effect(() => {
      const chunkId = this.corpus.selectedChunkId();
      if (!chunkId) return;
      queueMicrotask(() => this.scrollToChunk(chunkId));
    });
  }

  onContentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const lineEl = target.closest(".line[data-chunk-id]") as HTMLElement | null;
    if (!lineEl) return;
    const chunkId = lineEl.getAttribute("data-chunk-id");
    if (!chunkId) return;
    this.corpus.selectChunk(chunkId);
    this.chunkSelected.emit(chunkId);
  }

  scrollToChunk(chunkId: string): void {
    const el = this.contentPre?.nativeElement.querySelector(`#chunk-${chunkId}`);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }
}

function stripFrontmatter(raw: string): string {
  if (!raw.startsWith("---")) return raw;
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return raw;
  return raw.slice(end + 4).replace(/^\n/, "");
}

function frontmatterLineCount(raw: string): number {
  if (!raw.startsWith("---")) return 0;
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return 0;
  return raw.slice(0, end + 4).split("\n").length;
}
