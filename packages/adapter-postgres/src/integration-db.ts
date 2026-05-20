import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "./migrate.js";

export interface IntegrationDbHandle {
  readonly databaseUrl: string;
  stop(): Promise<void>;
}

/**
 * Starts ephemeral Postgres via Testcontainers, or reuses DATABASE_URL when
 * KG_TEST_USE_EXTERNAL_DB=1 (docker-compose.test.yml).
 */
export async function startIntegrationDb(): Promise<IntegrationDbHandle> {
  const external =
    process.env.KG_TEST_USE_EXTERNAL_DB === "1" ? process.env.DATABASE_URL : undefined;

  if (external) {
    await runMigrations("up", external);
    return {
      databaseUrl: external,
      async stop() {
        /* compose postgres is torn down with the stack */
      },
    };
  }

  const container: StartedPostgreSqlContainer = await new PostgreSqlContainer(
    "pgvector/pgvector:pg16",
  )
    .withDatabase("kg_test")
    .withUsername("kg")
    .withPassword("kg_test_secret")
    .start();

  const databaseUrl = container.getConnectionUri();
  await runMigrations("up", databaseUrl);

  return {
    databaseUrl,
    async stop() {
      await container.stop();
    },
  };
}
