# Decisões de stack (POC Knowledge Graph)

Documento de referência para Fase 0+. Alinha implementação com [08-plano-poc.md](./08-plano-poc.md) e critério **time-to-first-demo**.

---

## 1. Linguagem: TypeScript (Node 22 LTS)

| Critério        | Decisão                                                                          |
| --------------- | -------------------------------------------------------------------------------- |
| MCP oficial     | SDK maduro em npm (`@modelcontextprotocol/sdk` na Fase 5)                        |
| Produtividade   | Monorepo pnpm, tipos compartilhados, Vitest                                      |
| Performance POC | I/O-bound (Postgres + embeddings); TS suficiente para centenas–milhares de `.md` |

**Go** seria preferível apenas para ingestão CPU-bound em escala de milhões de arquivos — não é o gargalo desta POC.

**Padrão:** Hexagonal (ports & adapters). O `packages/core` permanece testável sem Docker; adapters substituíveis.

---

## 2. Persistência: PostgreSQL 16 + pgvector + tsvector

| Requisito              | Como atendemos                                                       |
| ---------------------- | -------------------------------------------------------------------- |
| Similaridade semântica | `chunk_embeddings.embedding vector(1024)` + índice HNSW (Fase 2)     |
| Busca lexical PT       | `chunks.search_vector` tsvector + GIN `portuguese`                   |
| Grafo GTM P0–P3        | Tabelas `nodes`, `edges`; expansão 1–2 hops via CTE recursivo        |
| Um serviço no Docker   | `pgvector/pgvector:pg16` em dev (5432) e test (5433, rede `kg-test`) |

### Por que não Neo4j?

- Segundo banco, segundo deploy, curva operacional.
- Para 1–2 hops e ontologia fixa, SQL relacional + índices por `edge_type` é suficiente na POC.
- **Evolução:** Neo4j se queries de grafo dominarem latência ou expressividade.

### Por que não SQLite?

- Dificulta isolar testes paralelos com o mesmo padrão que CI/produção.
- Sem pgvector/tsvector nativos no mesmo modelo mental do time.

### Por que não Chroma / Vectra / arquivo local?

- Contradiz decisão de **fonte única de verdade** em Postgres.
- Evita sincronizar grafo + vetores + FTS em stores diferentes.

---

## 3. Embeddings: qualidade máxima (default local)

| Item           | Decisão                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| Biblioteca     | `@xenova/transformers` (Transformers.js)                                |
| Modelo default | `Xenova/bge-m3` — **1024 dims**, multilíngue (PT/EN)                    |
| Normalização   | L2 antes de persistir (cosine ≈ dot product no pgvector)                |
| Onde roda      | Processo Node do `kg ingest` / worker; sem API externa no caminho feliz |

### Opções descartadas ou reservadas

| Opção                           | Veredito                                                            |
| ------------------------------- | ------------------------------------------------------------------- |
| MiniLM / BGE 384d (Embrix etc.) | Descartado como padrão — sacrifica recall                           |
| FastEmbed-js                    | Reserva — menos flexível para trocar modelo                         |
| **EmbedJS**                     | **Não usar** — framework RAG completo; duplica ingest/chunk/storage |
| ModelFusion / AI SDK só         | Adapter opcional cloud, não core                                    |
| TurboQuant-js                   | **Não** — quantização reduz qualidade                               |
| Vectra / Chroma                 | **Não** — storage fora do Postgres                                  |

### Fallback cloud (benchmark A/B)

- Pacote `packages/adapter-embeddings-openai`
- `EMBEDDING_PROVIDER=openai` + Vercel AI SDK `embed()` (`text-embedding-3-large`)
- Uso: comparar Recall@10 vs BGE-M3; **não é default**

### CI / testes rápidos

- `HashEmbeddingProvider` (Fase 2) — dimensão configurável **1024** para bater schema sem GPU

---

## 4. Docker e runtime

| Ambiente | Compose                          | Porta | Volume                           |
| -------- | -------------------------------- | ----- | -------------------------------- |
| Dev      | `docker/docker-compose.dev.yml`  | 5432  | `pgdata_dev`, `hf_cache`         |
| Test     | `docker/docker-compose.test.yml` | 5433  | **Sem** volume nomeado (efêmero) |

- **Imagem base:** `node:22-bookworm-slim` (não Alpine minimal) — libs nativas para ONNX futuro.
- **Cache Hugging Face:** volume `hf_cache` no serviço `app` (profile opcional) evita re-download do BGE-M3 (~1–2 GB na 1ª execução).

---

## 5. Ferramentas de engenharia

| Área              | Escolha                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| Monorepo          | pnpm workspaces                                                              |
| Migrations        | `node-pg-migrate` (SQL versionado em `packages/adapter-postgres/migrations`) |
| Testes            | Vitest — unit sem Docker; integration com Testcontainers                     |
| Contratos         | Zod em `@kg/core`                                                            |
| Parse MD (Fase 1) | `gray-matter` + `remark`                                                     |

---

## 6. Resumo por camada

| Camada           | Pacote / artefato                     | Propósito em uma frase                   |
| ---------------- | ------------------------------------- | ---------------------------------------- |
| Domínio          | `@kg/core`                            | Schemas, ports e casos de uso sem infra  |
| Postgres         | `@kg/adapter-postgres`                | Pool, migrations, repositórios (Fase 1+) |
| Embeddings local | `@kg/adapter-embeddings-transformers` | BGE-M3 via Transformers.js               |
| Embeddings cloud | `@kg/adapter-embeddings-openai`       | Benchmark opcional OpenAI                |
| CLI              | `@kg/cli`                             | `kg ingest`, `search`, `pack`            |
| MCP              | `@kg/mcp-server`                      | Tools/resources para Cursor (Fase 5)     |
| Corpus           | `corpus/`                             | Docs sintéticos NexusFlow (PT-BR)        |
| Benchmark        | `benchmark/queries.jsonl`             | Recall@10 rotulado (Fase 2)              |

---

## 7. Referências internas

- [03-arquitetura.md](./03-arquitetura.md) — camadas e fluxos
- [05-retrieval-hibrido.md](./05-retrieval-hibrido.md) — RRF, BM25, dense
- [04-ontologia-grafo.md](./04-ontologia-grafo.md) — tipos e arestas GTM
- [07-servidor-mcp.md](./07-servidor-mcp.md) — contrato MCP alvo
