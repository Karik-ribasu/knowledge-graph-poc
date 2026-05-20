import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import type { NodeDetailDTO } from "@kg/core/explorer/schemas";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class NodeDetailService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly detail = signal<NodeDetailDTO | null>(null);

  async load(nodeId: string): Promise<NodeDetailDTO | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<NodeDetailDTO>(`${this.base}/nodes/${encodeURIComponent(nodeId)}`),
      );
      this.detail.set(data);
      return data;
    } catch (err) {
      this.detail.set(null);
      this.error.set(err instanceof Error ? err.message : "Failed to load node");
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  clear(): void {
    this.detail.set(null);
    this.error.set(null);
  }
}
