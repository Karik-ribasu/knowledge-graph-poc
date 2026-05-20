---
doc_type: business
title: Caso de uso — landing page
audience: marketing
tags: [landing, context-pack]
---

# Caso de uso: landing page

**Entrada:** brief com produto, persona, objetivo e tom.

**Saída:** JSON `ContextPack` com facets (positioning, pain, proof…) pronto para o LLM.

## Fluxo

1. Planner escolhe facets necessários ([[context-pack]]).
2. Hybrid search recupera chunks ([[retrieval-hibrido]]).
3. Expansão 1–2 hops no grafo ([[modulo-grafo-gtm]]).
4. PackBuilder deduplica por `doc_id`.

Ver documentação de fluxo em `docs/06-fluxo-landing-page.md` do repositório da POC.
