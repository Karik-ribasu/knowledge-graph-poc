---
doc_type: technical
title: Retrieval híbrido
audience: engenharia
tags: [rrf, bm25, embeddings]
---

# Retrieval híbrido

1. Dense top 50 (pgvector cosine)
2. Lexical top 50 (`tsvector` português)
3. **RRF** com k=60
4. Dedup por `doc_id`, retorno top 20

Embeddings: BGE-M3 1024d. Detalhes em `docs/05-retrieval-hibrido.md` e [[postgres-pgvector]].
