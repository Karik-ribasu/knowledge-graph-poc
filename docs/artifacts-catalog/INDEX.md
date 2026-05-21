# Índice — catálogo de artefatos

Documentação **1:1** dos arquivos em [`artifacts/artifacts/`](../../artifacts/artifacts/) — mock de entregas dos módulos **Opportunity**, **Add Venture** e **Brand-Aid** (venture **B4U.bet**).

Cada `.md` nesta árvore descreve tipo de conteúdo, padrões estruturais, papel no pipeline e dicas de indexação. O espelhamento de pastas segue exatamente `artifacts/artifacts/`.

| Módulo | Pasta | Artefatos |
|--------|-------|-----------|
| Entrega | [`README.md`](README.md) | Índice do corpus fonte |
| Meta | [`_meta/`](_meta/) | `delivery-manifest.json` |
| Opportunity | [`opportunity/`](opportunity/) | 6 |
| Add Venture | [`add-venture/`](add-venture/) | 13 |
| Brand-Aid | [`brand-aid/`](brand-aid/) | 22 |

**Total:** 43 catálogos + este índice.

## Pipeline

```mermaid
flowchart LR
  O[opportunity] -->|ADVANCE score>=75| AV[add-venture]
  AV -->|dossier approved| BA[brand-aid]
```

## Regenerar

```bash
node scripts/generate-artifacts-catalog.mjs
```

IDs: `venture_id` **v-b4u-bet-001**, `opportunity_id` **opp-b4u-bet-2026-001**.
