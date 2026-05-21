export {
  benchmarkQuerySchema,
  benchmarkQueriesFileSchema,
  parseBenchmarkJsonl,
  type BenchmarkQuery,
  type BenchmarkFacet,
} from "./benchmark/schema.js";

export {
  docIdFromPath,
  artifactIdFromPath,
  folderIdFromPath,
  sectionIdFromParts,
  chunkIdFromParts,
  edgeIdFromParts,
  entityIdFromParts,
  contentHash,
} from "./domain/ids.js";

export type {
  NodeType,
  EdgeType,
  GtmNodeType,
  GtmEdgeType,
  CodeBlock,
  Wikilink,
  ParsedSection,
  ParsedMarkdown,
  ChunkRecord,
  SectionRecord,
  DocumentRecord,
  NodeRecord,
  EdgeRecord,
  IngestStats,
  ExtractedEntity,
  ExtractedRelation,
  GtmExtractionResult,
  GraphExpansionNode,
  GraphExpansionEdge,
  GraphExpansionResult,
} from "./domain/types.js";

export {
  GTM_NODE_TYPES,
  GTM_EDGE_TYPES,
  ARTIFACT_NODE_TYPES,
  ARTIFACT_EDGE_TYPES,
  STRUCTURAL_NODE_TYPES,
  STRUCTURAL_EDGE_TYPES,
  DEFAULT_EXPANSION_EDGE_TYPES,
  FILE_LIKE_NODE_TYPES,
  isFileLikeNodeType,
  isGtmNodeType,
  isGtmEdgeType,
} from "./graph/ontology.js";

export {
  normalizeCorpusPath,
  parentDirPath,
  folderPrefixesForFile,
} from "./corpus/path-utils.js";
export { attachLineRangesToChunks } from "./corpus/line-anchors.js";

export type { CorpusReadPort } from "./ports/corpus-read.js";

export {
  createEntityExtractor,
  RulesEntityExtractor,
  NoopEntityExtractor,
  type EntityExtractor,
  type EntityExtractorMode,
} from "./extract/entity-extractor.js";
export { CursorEntityExtractor } from "./extract/cursor-entity-extractor.js";
export { extractFromFrontmatter } from "./extract/frontmatter-entities.js";
export { extractWithRules } from "./extract/rules-extractor.js";
export { persistGtmGraph, type PersistGtmGraphStats } from "./extract/persist-gtm-graph.js";
export { slugify } from "./extract/slug.js";

export {
  expandGraphInMemory,
  parseExpansionSeed,
  type GraphExpansionStore,
  type InMemoryEdge,
  type InMemoryNode,
} from "./graph/graph-expansion.js";

export type { GraphStore, IngestWorkspaceOptions } from "./ports/graph-store.js";

export { parseMarkdown, type MarkdownParserOptions } from "./parse/markdown-parser.js";
export { extractWikilinks, stripWikilinks } from "./parse/wikilinks.js";
export { extractCodeBlocks } from "./parse/code-blocks.js";

export {
  estimateTokens,
  DEFAULT_TARGET_TOKENS,
  DEFAULT_OVERLAP_RATIO,
} from "./chunk/tokens.js";
export { chunkDocument, type ChunkerOptions, type ChunkerResult } from "./chunk/chunker.js";

export { ingestWorkspace } from "./ingest/ingest-workspace.js";
export {
  ingestArtifacts,
  type ArtifactIngestStats,
  type IngestArtifactsOptions,
} from "./artifacts/ingest-artifacts.js";
export {
  detectArtifactType,
  extractModule,
  normalizeVolumeArtifactPath,
  type ArtifactType,
} from "./artifacts/artifact-type.js";
export {
  flattenJsonForIndex,
  flattenedFieldsToIndexText,
  type FlattenedField,
} from "./artifacts/json-flatten.js";
export { chunkVolMarkdownBySections } from "./artifacts/vol-sections.js";
export { parseDeliveryManifest } from "./artifacts/delivery-manifest.js";

export type { EmbeddingProvider } from "./ports/embedding-provider.js";
export { DEFAULT_EMBEDDING_DIMENSIONS } from "./ports/embedding-provider.js";
export { HashEmbeddingProvider } from "./embeddings/hash-embedding-provider.js";

export type { ChunkForIndexing, ChunkEmbeddingRecord, ChunkIndexStore } from "./ports/chunk-index-store.js";
export type { SearchStore } from "./ports/search-store.js";

export type {
  SearchFilters,
  RankedSearchHit,
  HybridSearchHit,
} from "./retrieval/types.js";
export {
  hybridSearch,
  DEFAULT_DENSE_LIMIT,
  DEFAULT_LEXICAL_LIMIT,
  DEFAULT_RRF_TOP_K,
} from "./retrieval/hybrid-search.js";
export { rrfFusion, DEFAULT_RRF_K, type RrfFusionResult } from "./retrieval/rrf-fusion.js";
export { dedupByDocId } from "./retrieval/dedup-by-doc.js";

export { indexChunks, type IndexChunksOptions, type IndexChunksStats } from "./index/index-chunks.js";

export {
  recallAtK,
  pathsMatch,
  summarizeRecall,
  type RecallBenchmarkRow,
  type RecallBenchmarkSummary,
} from "./benchmark/recall.js";

export {
  PACK_SECTION_IDS,
  isPackSectionId,
  type PackSectionId,
} from "./context-pack/sections.js";

export {
  briefSchema,
  contextPackSchema,
  packSectionSchema,
  packSectionChunkSchema,
  packChunkProvenanceSchema,
  parseBriefJson,
  parseContextPackJson,
  emptyPackSections,
  type Brief,
  type ContextPack,
  type PackSection,
  type PackSectionChunk,
  type PackChunkProvenance,
} from "./context-pack/schema.js";

export { planFacets, type FacetSearchPlan } from "./context-pack/facet-planner.js";

export {
  buildContextPack,
  DEFAULT_PACK_TOKEN_BUDGET,
  DEFAULT_EXPANSION_HOPS,
  type PackBuilderOptions,
} from "./context-pack/pack-builder.js";

export type {
  GraphReadPort,
  NodeDetailPort,
  GraphSnapshotFilters,
  GraphSearchHit,
} from "./ports/graph-read.js";

export {
  graphNodeDtoSchema,
  graphLinkDtoSchema,
  graphSnapshotDtoSchema,
  nodeDetailDtoSchema,
  graphQuerySchema,
  searchQuerySchema,
  corpusTreeNodeSchema,
  fileContentDtoSchema,
  chunkAnchorSchema,
  type GraphNodeDTO,
  type GraphLinkDTO,
  type GraphSnapshotDTO,
  type NodeDetailDTO,
  type CorpusTreeNode,
  type FileContentDTO,
  type ChunkAnchorDTO,
} from "./explorer/schemas.js";

export {
  DEFAULT_NODE_VAL_K,
  nodeColor,
  edgeColor,
  isDashedEdge,
  computeNodeVal,
  computeLinkWidth,
  decorateNode,
  decorateLink,
} from "./explorer/graph-theme.js";
