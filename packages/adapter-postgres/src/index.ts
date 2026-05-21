export { createPool, pingDatabase } from "./client.js";
export { runMigrations, type MigrationDirection } from "./migrate.js";
export { startIntegrationDb, type IntegrationDbHandle } from "./integration-db.js";
export {
  PostgresGraphStore,
  getGraphCounts,
  countChunksWithoutProvenance,
  type GraphCounts,
} from "./repositories/graph-repository.js";
export { PostgresChunkIndexStore } from "./repositories/chunk-index-repository.js";
export {
  PostgresSearchStore,
  updateChunkLexicalIndex,
} from "./repositories/search-repository.js";
export { PostgresGraphExpansionStore } from "./repositories/graph-expansion-repository.js";
export { PostgresGraphReadRepository } from "./repositories/graph-read-repository.js";
export { PostgresCorpusReadRepository } from "./repositories/corpus-read-repository.js";
