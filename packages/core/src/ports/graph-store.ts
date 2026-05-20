import type {
  ChunkRecord,
  DocumentRecord,
  EdgeRecord,
  IngestStats,
  NodeRecord,
  SectionRecord,
} from "../domain/types.js";

export interface GraphStore {
  findDocumentByPath(path: string): Promise<{ docId: string; contentHash: string } | null>;
  upsertDocument(doc: DocumentRecord): Promise<void>;
  deleteDocumentGraph(docId: string): Promise<void>;
  upsertSection(section: SectionRecord): Promise<void>;
  upsertChunk(chunk: ChunkRecord): Promise<void>;
  upsertNode(node: NodeRecord): Promise<void>;
  upsertEdge(edge: EdgeRecord): Promise<void>;
}

import type { EntityExtractor } from "../extract/entity-extractor.js";

export interface IngestWorkspaceOptions {
  workspaceRoot: string;
  corpusDir: string;
  store: GraphStore;
  /** Defaults to rules extractor when omitted. */
  entityExtractor?: EntityExtractor;
}

export type { IngestStats };
