# Catálogo — `brand-aid/agents/brand-critique/critique-result.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/brand-aid/agents/brand-critique/critique-result.json`](../../../../../artifacts/artifacts/brand-aid/agents/brand-critique/critique-result.json)

## Tipo de conteúdo

JSON — resultado de crítica / quality gate

## Padrões estruturais

- Chaves de topo: brand_name, overall_score, dimensions, approved, notes

## Papel no pipeline

Módulo **brand-aid** → agente `brand-critique` → identidade de marca pós-dossier aprovado

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/brand-aid/agents/brand-critique/critique-result.json
module: brand-aid
agent: brand-critique
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
