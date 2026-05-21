# Catálogo — `brand-aid/agents/naming/naming-shortlist.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/brand-aid/agents/naming/naming-shortlist.json`](../../../../../artifacts/artifacts/brand-aid/agents/naming/naming-shortlist.json)

## Tipo de conteúdo

JSON — dados estruturados de marca/negócio

## Padrões estruturais

- Chaves de topo: venture_id, selected_name, selection_rationale, shortlist, taglines

## Papel no pipeline

Módulo **brand-aid** → agente `naming` → identidade de marca pós-dossier aprovado

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/brand-aid/agents/naming/naming-shortlist.json
module: brand-aid
agent: naming
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
