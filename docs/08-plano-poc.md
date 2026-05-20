# Plano de POC

Roadmap incremental para validar grafo + retrieval híbrido + MCP com o caso **landing page**.

---

## Fase 0 — Fundação

| Item | Status |
|------|--------|
| Documentação conceitual em `/docs` | Em andamento |
| Escolha de stack (ver seção abaixo) | Pendente |
| Corpus de exemplo (subset real ou sintético) | Pendente |

**Entregável:** repositório documentado + corpus mínimo (≥ 20 `.md` heterogêneos).

---

## Fase 1 — Ingestão

- Parser MD: headings, frontmatter, wikilinks `[[...]]`
- Chunking estrutural com proveniência
- Persistência P0: `Document`, `Section`, `Chunk`, `contains`, `linksTo`

**Entregável:** CLI `ingest ./corpus` (ou comando equivalente).

**Verificação:** todo chunk rastreável a `path` + heading.

---

## Fase 2 — Índices

- Gerar embeddings por chunk
- Índice BM25 (FTS5 / tsvector / OpenSearch)
- `hybrid_search` com RRF

**Entregável:** busca híbrida via CLI/API interna.

**Verificação:** benchmark Recall@10 em 10–20 queries rotuladas.

---

## Fase 3 — Grafo GTM (P1)

- Mapear frontmatter → propriedades / tipos
- Wikilinks → `linksTo`
- Menções básicas ou extração LLM com JSON schema fixo

**Entregável:** `expand_graph` com 1–2 hops.

**Verificação:** expansão a partir de `Persona` retorna `PainPoint` e chunks citados.

---

## Fase 4 — Context pack + landing

- Planner de facets ([06-fluxo-landing-page.md](./06-fluxo-landing-page.md))
- `plan_landing_context` / Pack Builder
- Checklist manual de cobertura

**Entregável:** JSON ContextPack a partir de um brief.

**Verificação:** 3 briefs distintos → packs com facets obrigatórias preenchidas.

---

## Fase 5 — MCP

- Adaptador com tools de [07-servidor-mcp.md](./07-servidor-mcp.md)
- Resources `kg://schema`, `kg://stats`
- Teste no Cursor

**Entregável:** servidor MCP registrável no cliente.

---

## Opções de stack (decisão pendente)

| Opção | Prós | Contras |
|-------|------|---------|
| **Postgres** (pgvector + tsvector) + grafo em tabelas | Um banco, simples para POC | Queries de grafo mais verbosas |
| **Neo4j** + vector index | Grafo nativo, Cypher expressivo | Mais operações / infra |
| **SQLite** FTS5 + LanceDB / arquivo vetorial | Local, rápido para dev | Escala limitada |

**Critério de escolha:** time-to-first-demo local < 1 semana para Fases 1–2.

---

## Benchmark sugerido

Criar `benchmark/queries.jsonl`:

```json
{"query": "...", "expected_paths": ["docs/..."], "facet": "positioning"}
```

| Métrica | Meta POC |
|---------|----------|
| Recall@10 | > 70% (ajustar após baseline) |
| Facets cobertas no pack | 100% das obrigatórias |
| Latência p95 `plan_landing_context` | < 3s local |

---

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Grafo ruidoso | Schema fixo; P0 estrutural antes de LLM |
| Chunks duplicados no pack | Dedup + MMR |
| Stack polui landing | `doc_type` + whitelist de arestas |
| Sem ground truth | Montar benchmark cedo na Fase 2 |
| Encoding / parse MD inconsistente | Testes com corpus real |

---

## Fora do roadmap imediato

- UI administrativa do grafo
- Fine-tuning de embeddings
- Templates além de landing (email, deck)
- Detecção automática de `contradicts`
- Multi-tenant / multi-workspace

---

## Leitura relacionada

- [README.md](./README.md) — índice da documentação.
- [01-visao-e-objetivos.md](./01-visao-e-objetivos.md) — escopo e métricas.
