# Catálogo — `brand-aid/agents/brand-strategy/brand-strategy.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/brand-aid/agents/brand-strategy/brand-strategy.json`](../../../../../artifacts/artifacts/brand-aid/agents/brand-strategy/brand-strategy.json)

## Tipo de conteúdo

JSON — dados estruturados de marca/negócio

## Padrões estruturais

- Chaves de topo: venture_id, brand_name, positioning, primary_archetype, secondary_archetype, brand_promise, personality_traits, values, anti_values, competitive_context

## Papel no pipeline

Módulo **brand-aid** → agente `brand-strategy` → identidade de marca pós-dossier aprovado

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/brand-aid/agents/brand-strategy/brand-strategy.json
module: brand-aid
agent: brand-strategy
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
