# Artefatos — B4U.bet

Entrega simulada de artefatos gerados pelos módulos **Opportunity**, **Add Venture** e **Brand-Aid** para a venture global **B4U.bet** (sports intelligence premium, nascida no Brasil).

## Estrutura

```
artifacts/
├── {module}/                    # opportunity | add-venture | brand-aid
│   ├── workflows/{workflow}/    # saídas agregadas do pipeline
│   └── agents/{agent}/          # saída por agente
└── _meta/                       # manifest da entrega
```

## Imagens (Ideogram)

Arquivos `*.image-prompt.md` contêm o prompt e metadados (frontmatter YAML). Para materializar as imagens:

```bash
# Na raiz do repositório — requer IDEOGRAM_API_KEY no ambiente ou .env
node scripts/generate-image-artifacts.mjs
```

O script percorre todos os `*.image-prompt.md` sob `artifacts/`, chama a API Ideogram v3 e grava o PNG no mesmo diretório do prompt (nome definido em `output_file`).

## Venture

| Campo | Valor |
|-------|-------|
| Startup | B4U.bet |
| opportunity_id | opp-b4u-bet-2026-001 |
| venture_id | v-b4u-bet-001 |
| scan_cycle_id | scan-2026-05-20-b4u |

## Módulos incluídos

1. **opportunity** — discovery, análise, scoring e priorização (ADVANCE → Add Venture)
2. **add-venture** — dossiê estruturado em 8 volumes + crítica + composição final
3. **brand-aid** — estratégia, naming, sistema visual, estudos de logo, imagens de marca, brand book

Base estratégica: [`B4U.bet.md`](../B4U.bet.md).
