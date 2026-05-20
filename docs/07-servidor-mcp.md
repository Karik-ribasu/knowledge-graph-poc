# Servidor MCP

Exposição do core via **Model Context Protocol** para Cursor, agentes customizados e a ferramenta interna de IA.

---

## 1. Princípio

O adaptador MCP **não** implementa lógica de negócio. Ele:

1. Valida parâmetros (schema JSON).
2. Delega ao core (ingestão, retrieval, pack builder).
3. Serializa respostas.

O core deve ser testável via CLI sem MCP.

---

## 2. Tools (POC)

| Tool | Descrição | Parâmetros principais |
|------|-----------|------------------------|
| `sync_workspace` | Reindexa diretório configurado | `path` (opcional) |
| `hybrid_search` | RRF sobre vetor + BM25 | `query`, `filters`, `limit` |
| `get_entity` | Detalhe de nó + vizinhança | `entity_id`, `include_neighbors` |
| `expand_graph` | Expansão a partir de entidades | `entity_ids`, `hops`, `edge_types` |
| `get_chunk` | Texto + proveniência | `chunk_id` |
| `plan_landing_context` | Brief → ContextPack | `brief` (objeto) |

---

## 3. Resources (read-only)

| URI | Conteúdo |
|-----|----------|
| `kg://schema` | Ontologia: tipos de nó e aresta ([04-ontologia-grafo.md](./04-ontologia-grafo.md)) |
| `kg://stats` | Contagem de documentos, chunks, nós por tipo |

---

## 4. Contrato esboço — `hybrid_search`

**Entrada:**

```json
{
  "query": "diferenciação vs concorrentes para CTO",
  "filters": {
    "doc_type": ["business", "market"]
  },
  "limit": 20
}
```

**Saída:**

```json
{
  "results": [
    {
      "chunk_id": "uuid",
      "score": 0.0,
      "path": "docs/market/competitors.md",
      "heading": "## Enterprise segment",
      "snippet": "..."
    }
  ]
}
```

---

## 5. Contrato esboço — `plan_landing_context`

**Entrada:** objeto `brief` conforme [06-fluxo-landing-page.md](./06-fluxo-landing-page.md).

**Saída:** objeto `ContextPack` completo com `sections` e `meta`.

---

## 6. Configuração do cliente (ex.: Cursor)

```json
{
  "mcpServers": {
    "knowledge-graph": {
      "command": "node",
      "args": ["path/to/mcp-server/dist/index.js"],
      "env": {
        "KG_WORKSPACE": "/path/to/markdown-corpus"
      }
    }
  }
}
```

Variáveis de ambiente esperadas (a definir na implementação):

| Variável | Uso |
|----------|-----|
| `KG_WORKSPACE` | Raiz dos `.md` |
| `KG_DB_URL` | Conexão ao store (se aplicável) |
| `OPENAI_API_KEY` / similar | Embeddings (se cloud) |

---

## 7. Segurança (diretrizes)

- Não expor escrita arbitrária no filesystem via MCP na POC.
- `sync_workspace` limitado ao `KG_WORKSPACE` configurado.
- Sem secrets nos resources.

---

## 8. Leitura relacionada

- [03-arquitetura.md](./03-arquitetura.md) — camada MCP no diagrama.
- [08-plano-poc.md](./08-plano-poc.md) — Fase 5: implementação do servidor.
