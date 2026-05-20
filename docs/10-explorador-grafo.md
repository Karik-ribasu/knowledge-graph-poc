# Graph Explorer — guia de UX e operação

Ferramenta web para **humanos** explorarem o grafo da POC (estilo GitNexus): visualização force-directed, filtros, detalhe de nós com Markdown. **Não** substitui o MCP (canal para IAs).

Plano de implementação: `.cursor/plans/graph_explorer_ui.plan.md` (somente leitura no repositório).

---

## 1. Pré-requisitos e subida

### Postgres + corpus

1. `pnpm dev:up` — Postgres dev na porta 5432
2. `pnpm migrate:up`
3. `pnpm kg ingest ./corpus` (e opcionalmente `pnpm kg index --provider hash`)

### Modo desenvolvimento (recomendado)

| Terminal | Comando | URL |
|----------|---------|-----|
| 1 | `pnpm explorer:api` | `http://localhost:3001/api/v1` |
| 2 | `pnpm explorer:web` | `http://localhost:4200` |

O dev server Angular faz proxy de `/api` para a API (ver `packages/web/proxy.conf.json`).

### Docker (profile `explorer`)

```bash
pnpm explorer:up
```

| Serviço | Porta |
|---------|-------|
| `kg-postgres-dev` | 5432 |
| `kg-api` | 3001 |
| `kg-web` | 4200 |

---

## 2. Layout da interface

```
┌─────────────────────────────────────────────────────────────┐
│ Toolbar: título · stats · busca de nó (autocomplete)        │
├──────────┬──────────────────────────────────────┬───────────┤
│ Filtros  │ Canvas force-graph + legenda         │ (hover)   │
│ (painel) │                                      │ dialog    │
├──────────┴──────────────────────────────────────┴───────────┤
│ Sidenav direita: detalhe do nó (Markdown, chunks, arestas)  │
└─────────────────────────────────────────────────────────────┘
```

| Área | Componente | Função |
|------|------------|--------|
| Toolbar | `GraphExplorerComponent` | Título, contadores (`/stats`), busca |
| Filtros | `GraphFiltersComponent` | Tipos de nó, `doc_type`, ocultar P0 |
| Canvas | `ForceGraphComponent` | Simulação d3-force, pan/zoom, clique |
| Legenda | `GraphLegendComponent` | Cores de nós e arestas (`graph-theme`) |
| Hover | `NodeHoverDialogComponent` | Resumo rápido ao passar o mouse |
| Detalhe | `NodeDetailSidenavComponent` | Conteúdo completo após clique |

---

## 3. Filtros e comportamento do grafo

### Ocultar estrutura P0 (default ligado)

O toggle **「Ocultar Chunk / Section (P0)」** remove `Chunk` e `Section` da consulta. O grafo inicial foca entidades GTM e documentos, evitando poluição visual.

### Tipos de nó

Checkboxes para cada tipo em `EXPLORER_NODE_TYPES` (estruturais + GTM). Desmarcar um tipo exclui-o do snapshot.

### `doc_type`

Campo de texto livre; quando preenchido, a API filtra nós `Document` (e derivados) pelo metadado `doc_type` do corpus.

### Recarregar grafo

O botão **「Recarregar grafo」** reaplica filtros e busca `GET /api/v1/graph` com os parâmetros atuais.

### Expansão local

No painel de detalhe, **「Expandir vizinhos」** recarrega o grafo com `seed=<nodeId>` e `hops=1`, centrando a vizinhança do nó selecionado.

---

## 4. Interações no canvas

| Ação | Efeito |
|------|--------|
| Arrastar fundo | Pan |
| Scroll / pinch | Zoom |
| Hover em nó | Dialog com label, tipo e grau |
| Clique em nó | Abre sidenav; carrega `GET /nodes/:id` |
| Busca na toolbar | Autocomplete via `GET /search?q=`; seleção foca o nó |

A simulação roda fora do `NgZone` para performance; eventos de UI reentram na zone apenas em hover/click.

---

## 5. Paleta e legenda

Cores definidas em `packages/core/src/explorer/graph-theme.ts` e espelhadas na legenda flutuante.

### Nós

| `node_type` | Cor |
|-------------|-----|
| `Document` | `#3b82f6` |
| `Section` | `#93c5fd` |
| `Chunk` | `#cbd5e1` |
| `Product` | `#8b5cf6` |
| `Competitor` | `#ef4444` |
| `Persona` / `ICP` | `#f59e0b` |
| `Feature` | `#10b981` |
| default GTM | `#64748b` |

### Arestas

| `edge_type` | Cor | Estilo |
|-------------|-----|--------|
| `contains` | `#94a3b8` | fino |
| `linksTo` | `#2563eb` | — |
| `mentions` | `#a855f7` | tracejado |
| `competesWith` | `#dc2626` | grosso |
| `targetsICP` | `#d97706` | — |

**Aceite visual:** `competesWith` (vermelho) deve ser distinguível de `linksTo` (azul) à distância, com apoio da legenda.

---

## 6. Painel de detalhe (sidenav)

Após clicar em um nó:

1. **Cabeçalho** — label, tipo, id
2. **Propriedades** — Markdown renderizado (`ngx-markdown`, sanitizado)
3. **Chunks relacionados** — snippets expansíveis
4. **Arestas incidentes** — lista clicável para navegar ao nó ligado

### Caso `Competitor`

Com corpus NexusFlow ingerido, um nó `Competitor` deve listar arestas `mentions` / `competesWith` e chunks que citam o competidor. Use a busca 「competidor」 ou filtre tipos `Competitor` + `Document`.

---

## 7. API REST (somente leitura)

Base: `{NG_APP_API_URL}` (default `http://localhost:3001/api/v1`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | `{ ok: true }` |
| GET | `/stats` | Contagens (como `kg_stats`) |
| GET | `/graph` | Snapshot `{ nodes[], links[] }` |
| GET | `/nodes/:nodeId` | Detalhe + arestas + chunks |
| GET | `/search?q=` | Busca por label / path |

Exemplo:

```bash
curl "http://localhost:3001/api/v1/graph?nodeTypes=Document&nodeTypes=Competitor&limit=50"
```

---

## 8. Variáveis de ambiente

| Variável | Default | Uso |
|----------|---------|-----|
| `API_PORT` | `3001` | bind Fastify |
| `GRAPH_MAX_NODES` | `300` | cap snapshot |
| `GRAPH_MAX_EDGES` | `600` | cap snapshot |
| `NG_APP_API_URL` | `http://localhost:3001/api/v1` | build Angular / Docker web |
| `CORS_ORIGIN` | `http://localhost:4200` | CORS da API |
| `DATABASE_URL` | — | pool Postgres (obrigatório) |

Ver também `.env.example` na raiz do repositório.

---

## 9. Testes

| Comando | Escopo |
|---------|--------|
| `pnpm test:explorer` | Vitest (api, core/explorer, graph-read) + Karma + Playwright |
| `pnpm test:coverage:api` | Cobertura `@kg/api` (≥80% linhas, script `verify-api-coverage.mjs`) |

Playwright (`packages/web/e2e/graph-explorer.smoke.spec.ts`):

- Carrega toolbar e filtros
- Renderiza canvas quando API está no ar
- Clique abre sidenav quando o grafo tem nós

Variáveis opcionais: `PLAYWRIGHT_BASE_URL`, `PLAYWRIGHT_API_URL`.

Com a API em execução (`pnpm explorer:api`), os três testes Playwright rodam sem skip. Sem API, apenas o smoke de toolbar/filtros passa (os demais são ignorados).

**Testcontainers:** se `pnpm test:explorer` falhar com `Failed to connect to Reaper` após uma suíte longa de integração, aguarde alguns segundos e repita, ou use `KG_TEST_USE_EXTERNAL_DB=1` com Postgres local.

---

## 10. Checklist QA manual

- [ ] Após `explorer:api` + `explorer:web`, grafo visível em &lt; 3s (corpus já ingerido)
- [ ] Toggle P0 oculta Chunk/Section; grafo fica legível
- [ ] Cores na legenda batem com o canvas
- [ ] Clique em `Document` abre Markdown / metadados
- [ ] Clique em `Competitor` mostra menções e arestas vermelhas (`competesWith`) quando existirem
- [ ] Busca na toolbar encontra nó e foca no canvas
- [ ] `Expandir vizinhos` recentra subgrafo
- [ ] API retorna 400 para query inválida (`hops` &gt; 2)
- [ ] Sem `DATABASE_URL`, `explorer:api` falha com mensagem clara

---

## 11. Resumo por camada

| Camada | Componente | Propósito em uma frase |
|--------|------------|------------------------|
| Web | `GraphExplorerComponent` | Orquestra filtros, canvas, busca e sidenav |
| Web | `GraphExplorerService` | HTTP para `/graph`, `/stats`, `/search` |
| Web | `ForceGraphComponent` | Wrapper `force-graph` + tema |
| API | `packages/api` Fastify | REST read-only sobre Postgres |
| Core | `GraphReadPort` + schemas | Contratos Zod/DTO compartilhados |
| Adapter | `PostgresGraphReadRepository` | SQL snapshot, detalhe, busca |

---

## Leitura relacionada

- [04-ontologia-grafo.md](./04-ontologia-grafo.md) — tipos e arestas
- [08-plano-poc.md](./08-plano-poc.md) — POC original; UI explorer é iniciativa separada
- [README.md](../README.md) — setup e scripts `explorer:*`
