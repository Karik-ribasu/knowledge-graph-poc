# Relatório E2E — MCP × Landing B4U.bet

**Data:** 2026-05-21 (atualizado)  
**Workspace:** `knowledge-graph-poc`  
**Objetivo:** validar pipeline de indexação de **artefatos** (sem agentes) e extrair contexto para landing de alta conversão.

---

## 1. Veredito executivo

| Dimensão | Status |
|----------|--------|
| Documentação v2 | **Concluída** — `docs/11-proposta-indexacao-artifacts.md`, `docs/12-roteiro-landing-via-grafo.md` |
| Implementação P0 | **Concluída** — `ingestArtifacts`, CLI `kg ingest-artifacts`, MCP `kg_ingest_artifacts`, filtro `module` em `kg_search` |
| Teste MCP ao vivo | **Bloqueado** — Docker Desktop inativo (`ECONNREFUSED :5432`); servidor MCP `project-0-knowledge-graph-poc-knowledge-graph` não exposto nesta sessão do agente |
| Prompt de frontend | **Entregue** — `docs/reports/b4u-landing-frontend-prompt.md` (copy + design system dos artefatos reais) |

**Em uma frase:** o código e o roteiro estão prontos; falta subir Postgres, rodar ingest/index e repetir as tools MCP para substituir o fallback manual usado neste relatório.

---

## 2. O que foi implementado

### 2.1 Core (`packages/core/src/artifacts/`)

| Componente | Função |
|------------|--------|
| `ingest-artifacts.ts` | Walk `artifacts/artifacts/**`; nós `Artifact`, `Delivery`, `Module`; chunks = IndexUnits |
| `json-flatten.ts` | JSON → texto indexável (scores, tokens, business model) |
| `vol-sections.ts` | Volumes `vol-*.md` → chunks por `##` |
| `image-prompt-units.ts` | Frontmatter + corpo do prompt |
| `delivery-manifest.ts` | Parse manifest + handoffs |

**Regra respeitada:** segmento `agents/` no path **não** vira entidade; só metadado `module` + `artifact_type`.

### 2.2 CLI & MCP

```bash
pnpm build
pnpm dev:up                    # Docker + Postgres
pnpm migrate:up
pnpm kg ingest-artifacts         # default: artifacts/artifacts
pnpm kg index --provider hash
pnpm kg search "proposta de valor B4U" --module add-venture
pnpm kg pack --brief brief-b4u.json
```

| Tool MCP | Status |
|----------|--------|
| `kg_ingest_artifacts` | Registrada em `packages/mcp-server/src/server.ts` |
| `kg_search` + `filters.module` | `opportunity` \| `add-venture` \| `brand-aid` |
| `kg_pack` | Brief B4U → ContextPack (inalterado, consome chunks) |

---

## 3. Roteiro mínimo executado (design)

Alinhado a `docs/12-roteiro-landing-via-grafo.md`:

| # | Ação | Query / parâmetro | Módulo |
|---|------|-------------------|--------|
| 1 | `kg_ingest_artifacts` | `path: artifacts/artifacts` | — |
| 2 | `kg_index` | `provider: hash` | — |
| 3 | `kg_stats` | — | baseline |
| 4a | `kg_search` | proposta de valor posicionamento B4U intelligence | add-venture |
| 4b | `kg_search` | Intelligence Seekers persona JTBD mobile Brasil | add-venture |
| 4c | `kg_search` | TAM SAM mercado esportivo score oportunidade 82 | opportunity |
| 4d | `kg_search` | diferenciação não somos casa de apostas tipster | add-venture |
| 4e | `kg_search` | features feed IA transparente comunidade moderada | add-venture |
| 4f | `kg_search` | métricas revenue subs CAC LTV year 1 | add-venture |
| 4g | `kg_search` | riscos compliance jogo responsável regulação BR | add-venture |
| 4h | `kg_search` | design tokens teal pitch deep typography | brand-aid |
| 4i | `kg_search` | creative brief logo lockup premium sports | brand-aid |
| 4j | `kg_search` | waitlist GTM lançamento fase 90 dias | add-venture |
| 5 | `kg_pack` | brief §12-roteiro | todos facets |
| 6 | `kg_expand` | `from: doc:<venture-dossier artifact_id>` hops 2 | aggregates → vols |

---

## 4. Resultado do fallback (artefatos lidos offline)

Com DB indisponível, o conteúdo abaixo foi confirmado nos arquivos fonte e incorporado ao prompt final.

| Seção landing | Artefato principal | Snippet validado |
|---------------|------------------|------------------|
| Hero / tagline | `vol-3-value-proposition.md` | “Inteligência antes do apito.” |
| Persona | `vol-2-customer-market.md` | Intelligence Seekers 25–44 BR |
| Anti-positioning | `vol-3-value-proposition.md` | Não casa de apostas / tipster / robô |
| Narrativa | `vol-6-brand-narrative.md` | Manifesto “antes do apito inicial” |
| Proof | `venture-dossier.json`, `opportunity-score.json` | TAM 4.2B, score 82, Y1 1.8M / 22k subs |
| GTM / CTA | `vol-5-gtm.md` | Waitlist + manifesto Phase 0–90 |
| Design | `design-tokens.json` | #0B1220, #14B8A6, Instrument Sans / Inter |

**Gaps sem ingest JSON:** até rodar `ingest-artifacts`, `design-tokens.json` e `vol-4-business-model.json` não entram no BM25 via `kg_ingest` legado (só `.md`).

---

## 5. Artefatos esperados pós-ingest (43 arquivos)

| Módulo | Tipos | IndexUnits estimados |
|--------|-------|----------------------|
| opportunity | JSON scores, MD análise | ~40–80 |
| add-venture | 9 vols MD/JSON + dossier + critique | ~120–200 |
| brand-aid | tokens, strategy, prompts, briefs | ~80–120 |

Arestas: `aggregates` (dossier → vol_0…8), `materializes` (prompt → png), `partOfModule`, `belongsToDelivery`.

---

## 6. Próximos passos (reproduzir MCP de ponta a ponta)

1. Iniciar Docker Desktop → `pnpm dev:up` → `pnpm migrate:up`
2. `pnpm kg ingest-artifacts && pnpm kg index --provider hash`
3. No Cursor, MCP **knowledge-graph**: executar sequência §3
4. Comparar `kg_pack` output com `b4u-landing-frontend-prompt.md`; ajustar copy
5. Gerar UI (v0 / Cursor) colando o prompt final

---

## 7. Entregáveis desta rodada

| Arquivo | Descrição |
|---------|-----------|
| [b4u-landing-frontend-prompt.md](./b4u-landing-frontend-prompt.md) | Prompt completo para gerador frontend |
| [../11-proposta-indexacao-artifacts.md](../11-proposta-indexacao-artifacts.md) | Spec indexação v2 |
| [../12-roteiro-landing-via-grafo.md](../12-roteiro-landing-via-grafo.md) | Roteiro facet → MCP |

---

## 8. Checklist de funcionamento

- [x] Proposta documentada (sem agentes no grafo)
- [x] `ingestArtifacts` implementado
- [x] CLI `ingest-artifacts`
- [x] MCP `kg_ingest_artifacts`
- [x] Filtro `module` na busca
- [x] Prompt landing com copy real B4U
- [ ] Postgres local ativo
- [ ] `kg_pack` executado com hits dos 43 artefatos
- [ ] Validação visual da landing gerada
