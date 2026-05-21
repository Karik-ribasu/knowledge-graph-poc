# Catálogo — `_meta/delivery-manifest.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/_meta/delivery-manifest.json`](../../../artifacts/artifacts/_meta/delivery-manifest.json)

## Tipo de conteúdo

JSON — manifesto ou resumo de workflow

## Padrões estruturais

- Chaves de topo: delivery_id, startup_name, delivered_at, source_brief, modules, venture, handoff_chain, image_prompt_files
- Cadeia handoff_chain entre módulos

## Papel no pipeline

Módulo **_meta**

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/_meta/delivery-manifest.json
module: _meta
role: meta
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
