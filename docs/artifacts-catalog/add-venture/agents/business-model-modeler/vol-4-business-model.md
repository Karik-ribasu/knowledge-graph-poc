# Catálogo — `add-venture/agents/business-model-modeler/vol-4-business-model.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/add-venture/agents/business-model-modeler/vol-4-business-model.json`](../../../../../artifacts/artifacts/add-venture/agents/business-model-modeler/vol-4-business-model.json)

## Tipo de conteúdo

JSON estruturado — saída de agente

## Padrões estruturais

- Chaves de topo: volume, volume_title, venture_name, revenue_streams, year_1_targets, unit_economics, scenarios, funding_required_12m_usd

## Papel no pipeline

Módulo **add-venture** → agente `business-model-modeler` → dossiê 8 volumes + crítica; handoff para brand-aid

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/add-venture/agents/business-model-modeler/vol-4-business-model.json
module: add-venture
agent: business-model-modeler
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
