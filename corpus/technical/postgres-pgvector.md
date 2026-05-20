---
doc_type: technical
title: Postgres e pgvector
audience: engenharia
tags: [postgres, pgvector]
---

# Postgres + pgvector + tsvector

- Extensão `vector` com dimensão **1024** (BGE-M3)
- `chunks.search_vector` com config `portuguese`
- Índice HNSW cosine (Fase 2)

Migrations em `packages/adapter-postgres/migrations`.

Decisões: ver `docs/09-decisoes-stack.md`.

Relacionado: [[retrieval-hibrido]].
