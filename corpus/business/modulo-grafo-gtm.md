---
doc_type: business
title: Módulo grafo GTM
audience: product
tags: [grafo, gtm]
---

# Módulo grafo GTM

Modelamos **Document**, **Persona**, **PainPoint**, **Feature**, **Benefit** e arestas `hasPain`, `linksTo`, `enables`.

## Fases

- **P0:** contains, linksTo (wikilinks)
- **P1:** frontmatter → propriedades de nó
- **P2+:** extração assistida (rules / Cursor)

Expansão 1–2 hops alimenta o [[context-pack]] com entidades relacionadas que busca vetorial sozinha perderia.

Ontologia completa: ver `docs/04-ontologia-grafo.md`.
