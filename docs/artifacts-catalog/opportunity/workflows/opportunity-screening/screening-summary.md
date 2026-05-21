# Catálogo — `opportunity/workflows/opportunity-screening/screening-summary.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/opportunity/workflows/opportunity-screening/screening-summary.json`](../../../../../artifacts/artifacts/opportunity/workflows/opportunity-screening/screening-summary.json)

## Tipo de conteúdo

JSON — manifesto ou resumo de workflow

## Padrões estruturais

- Chaves de topo: workflow_id, pipeline_id, startup_name, run_id, completed_at, input_type, outcome, steps_completed, notes

## Papel no pipeline

Módulo **opportunity** → workflow `opportunity-screening` → discovery; handoff para add-venture (score ≥ 75)

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/opportunity/workflows/opportunity-screening/screening-summary.json
module: opportunity
workflow: opportunity-screening
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
