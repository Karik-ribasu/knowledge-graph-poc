---
doc_type: technical
title: Context Pack — contrato
audience: engenharia
tags: [context-pack, api]
---

# Context Pack

Estrutura JSON entregue ao LLM com facets obrigatórios para landing:

- `positioning`, `persona`, `pain`, `differentiation`, `proof`

Cada item inclui `text`, `citations[]` com `chunk_id`, `path`, `heading`.

Gerado pelo PackBuilder (Fase 4). Caso de negócio: [[caso-uso-landing]].
