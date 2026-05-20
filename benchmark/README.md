# Benchmark — Recall@10

Conjunto rotulado em `queries.jsonl` (18 queries) para medir se os documentos esperados aparecem no top-10 do retrieval híbrido.

## Executar

Com Postgres dev ou test (porta 5432 ou 5433):

```bash
export DATABASE_URL=postgresql://kg:kg_dev_secret@localhost:5432/kg_dev
export KG_WORKSPACE=$(pwd)
export EMBEDDING_PROVIDER=hash

pnpm benchmark:recall
# ou com provider explícito:
pnpm benchmark:recall -- --provider hash
```

O comando faz migrate, ingest do `corpus/`, index e avalia cada linha do JSONL.

## Baseline esperado (hash, corpus NexusFlow POC)

Medido em ambiente local com `EMBEDDING_PROVIDER=hash` após ingest+index completo:

| Métrica | Valor |
|---------|-------|
| **Recall@10** | **0.50** (9/18 queries com hit, medido em 2026-05) |
| Provider | `hash-deterministic-v1` (determinístico, 1024 dims) |

Variação de ±0.05 é aceitável entre máquinas após re-ingest completo. Queda sustentada abaixo de **0.45** indica regressão no pipeline de ingest, índice ou fusão RRF. Para baseline mais alto, use `--provider transformers` (lento; ver `RUN_SLOW_TESTS=1`).

## Interpretação

- `hit: true` — pelo menos um `expected_paths` está no top-10.
- `topPaths` — caminhos retornados (útil para debug).
- Para comparar com OpenAI ou Transformers, use `--provider openai` ou `--provider transformers` (este último é lento; ver `RUN_SLOW_TESTS=1` nos testes do adapter).
