# Catálogo — `add-venture/agents/venture-critic/critique-result.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/add-venture/agents/venture-critic/critique-result.json`](../../../../../artifacts/artifacts/add-venture/agents/venture-critic/critique-result.json)

## Tipo de conteúdo

JSON — resultado de crítica / quality gate

## Padrões estruturais

- Chaves de topo: venture_id, critique_id, overall_score, recommendation, dimension_scores, strengths, improvements, iteration_required

## Papel no pipeline

Módulo **add-venture** → agente `venture-critic` → dossiê 8 volumes + crítica; handoff para brand-aid

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/add-venture/agents/venture-critic/critique-result.json
module: add-venture
agent: venture-critic
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
