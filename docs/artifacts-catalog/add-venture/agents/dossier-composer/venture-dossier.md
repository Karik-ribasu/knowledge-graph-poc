# Catálogo — `add-venture/agents/dossier-composer/venture-dossier.json`

> Análise para indexação no knowledge graph. Fonte: [`artifacts/artifacts/add-venture/agents/dossier-composer/venture-dossier.json`](../../../../../artifacts/artifacts/add-venture/agents/dossier-composer/venture-dossier.json)

## Tipo de conteúdo

JSON — dossiê agregado / manifest executivo

## Padrões estruturais

- Chaves de topo: venture_id, opportunity_id, venture_name, legal_entity_suggested, created_date, created_by, status, critique_result, executive_summary, key_metrics, volume_artifacts, artifact_refs
- Mapa volume_artifacts vol_0…vol_8

## Papel no pipeline

Módulo **add-venture** → agente `dossier-composer` → dossiê 8 volumes + crítica; handoff para brand-aid

## Dicas para indexação

- Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown
- Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001

## Metadados sugeridos

```yaml
source_path: artifacts/artifacts/add-venture/agents/dossier-composer/venture-dossier.json
module: add-venture
agent: dossier-composer
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
```
