import type { CorpusTreeNode, FileContentDTO } from "../explorer/corpus-schemas.js";

export interface CorpusReadPort {
  getTree(): Promise<CorpusTreeNode>;
  getFileByPath(path: string): Promise<FileContentDTO | null>;
}
