# Catálogo — `add-venture/workflows/venture-structuring/structuring-summary.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/add-venture/workflows/venture-structuring/structuring-summary.json`](../../../../../artifacts/artifacts/add-venture/workflows/venture-structuring/structuring-summary.json)

## Tipo de conteúdo

JSON — manifesto ou resumo de workflow

## Padrões estruturais

- Chaves de topo: workflow_id, pipeline_id, venture_id, opportunity_id, venture_name, completed_at, status, critique_overall_score, volumes_produced, agents_executed, next_module, next_workflow
- Lista agents_executed (11 itens)

## Papel no pipeline

Módulo **add-venture** → workflow `venture-structuring` → dossiê 8 volumes + crítica; handoff para brand-aid

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/add-venture/workflows/venture-structuring/structuring-summary.json
module: add-venture
workflow: venture-structuring
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
