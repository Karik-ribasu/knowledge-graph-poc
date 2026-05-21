# Catálogo — `opportunity/agents/market-scanner/market-research.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/opportunity/agents/market-scanner/market-research.json`](../../../../../artifacts/artifacts/opportunity/agents/market-scanner/market-research.json)

## Tipo de conteúdo

JSON — scoring, ranking ou pesquisa estruturada

## Padrões estruturais

- Chaves de topo: scan_id, scan_timestamp, startup_context, scan_metadata, opportunities_found
- Array opportunities_found[]

## Papel no pipeline

Módulo **opportunity** → agente `market-scanner` → discovery; handoff para add-venture (score ≥ 75)

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/opportunity/agents/market-scanner/market-research.json
module: opportunity
agent: market-scanner
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
