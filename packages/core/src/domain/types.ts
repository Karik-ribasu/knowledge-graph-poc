import type { EdgeType, GtmEdgeType, GtmNodeType, NodeType } from "../graph/ontology.js";

export type { NodeType, EdgeType, GtmNodeType, GtmEdgeType };

export interface CodeBlock {
  language: string | null;
  content: string;
  /** Line index in original body where block starts (for provenance). */
  startLine: number;
}

export interface Wikilink {
  raw: string;
  target: string;
  alias?: string;
}

export interface ParsedSection {
  heading: string;
  level: 2 | 3;
  ordinal: number;
  body: string;
  codeBlocks: CodeBlock[];
  wikilinks: Wikilink[];
}

export interface ParsedMarkdown {
  relativePath: string;
  frontmatter: Record<string, unknown>;
  title: string;
  docType: string | null;
  preamble: string;
  preambleCodeBlocks: CodeBlock[];
  preambleWikilinks: Wikilink[];
  sections: ParsedSection[];
  wikilinks: Wikilink[];
  codeBlocks: CodeBlock[];
}

export interface ChunkRecord {
  chunkId: string;
  docId: string;
  sectionId: string;
  heading: string;
  text: string;
  tokenCount: number;
  path: string;
}

export interface SectionRecord {
  sectionId: string;
  docId: string;
  heading: string;
  level: number;
  ordinal: number;
}

export interface DocumentRecord {
  docId: string;
  path: string;
  docType: string | null;
  title: string;
  contentHash: string;
}

export interface NodeRecord {
  nodeId: string;
  nodeType: NodeType;
  label: string | null;
  properties: Record<string, unknown>;
}

export interface EdgeRecord {
  edgeId: string;
  sourceId: string;
  targetId: string;
  edgeType: EdgeType;
  properties?: Record<string, unknown>;
}

export interface IngestStats {
  documentsProcessed: number;
  documentsSkipped: number;
  documentsDeleted: number;
  sectionsWritten: number;
  chunksWritten: number;
  nodesWritten: number;
  edgesWritten: number;
  gtmNodesWritten: number;
  gtmEdgesWritten: number;
}

export interface ExtractedEntity {
  nodeType: GtmNodeType;
  name: string;
  properties?: Record<string, unknown>;
}

export interface ExtractedRelation {
  edgeType: GtmEdgeType;
  sourceType: GtmNodeType;
  sourceName: string;
  targetType: GtmNodeType;
  targetName: string;
  properties?: Record<string, unknown>;
}

export interface GtmExtractionResult {
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
}

export interface GraphExpansionNode {
  nodeId: string;
  nodeType: string;
  label: string | null;
  properties: Record<string, unknown>;
  hop: number;
}

export interface GraphExpansionEdge {
  edgeId: string;
  sourceId: string;
  targetId: string;
  edgeType: string;
  properties: Record<string, unknown>;
  hop: number;
}

export interface GraphExpansionResult {
  seeds: string[];
  hops: number;
  nodes: GraphExpansionNode[];
  edges: GraphExpansionEdge[];
}
