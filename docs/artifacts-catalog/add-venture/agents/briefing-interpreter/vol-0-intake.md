# Catálogo — `add-venture/agents/briefing-interpreter/vol-0-intake.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/add-venture/agents/briefing-interpreter/vol-0-intake.json`](../../../../../artifacts/artifacts/add-venture/agents/briefing-interpreter/vol-0-intake.json)

## Tipo de conteúdo

JSON — intake / briefing interpretado

## Padrões estruturais

- Chaves de topo: volume, volume_title, venture_id, opportunity_id, venture_name, interpreted_brief, confidence, gaps_flagged

## Papel no pipeline

Módulo **add-venture** → agente `briefing-interpreter` → dossiê 8 volumes + crítica; handoff para brand-aid

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/add-venture/agents/briefing-interpreter/vol-0-intake.json
module: add-venture
agent: briefing-interpreter
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
