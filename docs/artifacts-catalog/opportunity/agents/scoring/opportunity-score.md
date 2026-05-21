# Catálogo — `opportunity/agents/scoring/opportunity-score.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/opportunity/agents/scoring/opportunity-score.json`](../../../../../artifacts/artifacts/opportunity/agents/scoring/opportunity-score.json)

## Tipo de conteúdo

JSON — scoring, ranking ou pesquisa estruturada

## Padrões estruturais

- Chaves de topo: opportunity_id, title, scored_at, dimensions, bonuses, penalties, total_score, recommendation, recommendation_rationale

## Papel no pipeline

Módulo **opportunity** → agente `scoring` → discovery; handoff para add-venture (score ≥ 75)

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/opportunity/agents/scoring/opportunity-score.json
module: opportunity
agent: scoring
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
