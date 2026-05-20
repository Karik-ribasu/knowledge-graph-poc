---
doc_type: technical
title: Onboarding de workspace
audience: engenharia
tags: [onboarding]
---

# Onboarding de workspace

## Passos

1. Criar tenant + `KG_WORKSPACE` apontando para clone Git do corpus
2. `kg ingest ./corpus` — parse, chunk, grafo P0
3. Indexar embeddings (pode levar minutos na 1ª vez — cache HF)
4. Validar benchmark Recall@10

Jornada comercial: [[jornada-implementacao]].
