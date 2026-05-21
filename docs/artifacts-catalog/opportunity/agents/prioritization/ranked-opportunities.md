# Catálogo — `opportunity/agents/prioritization/ranked-opportunities.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/opportunity/agents/prioritization/ranked-opportunities.json`](../../../../../artifacts/artifacts/opportunity/agents/prioritization/ranked-opportunities.json)

## Tipo de conteúdo

JSON — scoring, ranking ou pesquisa estruturada

## Padrões estruturais

- Chaves de topo: prioritization_id, prioritization_timestamp, ranked_opportunities, summary

## Papel no pipeline

Módulo **opportunity** → agente `prioritization` → discovery; handoff para add-venture (score ≥ 75)

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/opportunity/agents/prioritization/ranked-opportunities.json
module: opportunity
agent: prioritization
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
