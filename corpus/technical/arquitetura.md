---
doc_type: technical
title: Arquitetura de referência
audience: engenharia
tags: [arquitetura, hexagonal]
---

# Arquitetura

Hexagonal: `core` + adapters (`postgres`, `embeddings`, `mcp-server`, `cli`).

```text
corpus → ingest → chunks + grafo → índices → search → ContextPack → MCP/CLI
```

## Componentes

- **Postgres** — docs, chunks, nodes, edges, embeddings ([[postgres-pgvector]])
- **Embeddings** — BGE-M3 local default
- **MCP** — [[servidor-mcp]]

Requisitos de deploy: [[requisitos-infra]].
