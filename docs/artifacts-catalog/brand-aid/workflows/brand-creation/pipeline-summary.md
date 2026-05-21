# Catálogo — `brand-aid/workflows/brand-creation/pipeline-summary.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/brand-aid/workflows/brand-creation/pipeline-summary.json`](../../../../../artifacts/artifacts/brand-aid/workflows/brand-creation/pipeline-summary.json)

## Tipo de conteúdo

JSON — manifesto ou resumo de workflow

## Padrões estruturais

- Chaves de topo: workflow_id, pipeline_id, venture_id, brand_name, completed_at, critique_score, status, agents_executed, image_artifacts_pending_generation
- Lista agents_executed (11 itens)

## Papel no pipeline

Módulo **brand-aid** → workflow `brand-creation` → identidade de marca pós-dossier aprovado

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/brand-aid/workflows/brand-creation/pipeline-summary.json
module: brand-aid
workflow: brand-creation
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
