import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import type { CorpusTreeNode, FileContentDTO } from "@kg/core/explorer/schemas";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class CorpusService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  readonly tree = signal<CorpusTreeNode | null>(null);
  readonly treeLoading = signal(false);
  readonly fileContent = signal<FileContentDTO | null>(null);
  readonly fileLoading = signal(false);
  readonly selectedPath = signal<string | null>(null);
  readonly selectedChunkId = signal<string | null>(null);

  async loadTree(): Promise<void> {
    this.treeLoading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<CorpusTreeNode>(`${this.base}/corpus/tree`),
      );
      this.tree.set(data);
    } catch {
      this.tree.set(null);
    } finally {
      this.treeLoading.set(false);
    }
  }

  async loadFile(path: string): Promise<FileContentDTO | null> {
    this.fileLoading.set(true);
    this.selectedPath.set(path);
    this.selectedChunkId.set(null);
    try {
      const encoded = path.split("/").map(encodeURIComponent).join("/");
      const data = await firstValueFrom(
        this.http.get<FileContentDTO>(`${this.base}/files/${encoded}`),
      );
      this.fileContent.set(data);
      return data;
    } catch {
      this.fileContent.set(null);
      return null;
    } finally {
      this.fileLoading.set(false);
    }
  }

  selectChunk(chunkId: string | null): void {
    this.selectedChunkId.set(chunkId);
  }

  clearFile(): void {
    this.fileContent.set(null);
    this.selectedPath.set(null);
    this.selectedChunkId.set(null);
  }
}
