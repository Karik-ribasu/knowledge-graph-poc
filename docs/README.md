# Documentação — Knowledge Graph POC

Documentação viva do projeto: grafo de conhecimento alimentado por Markdown, retrieval híbrido (semântico + léxico) e servidor MCP para ferramentas de IA.

## Índice

| Documento                                                      | Conteúdo                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------- |
| [01-visao-e-objetivos.md](./01-visao-e-objetivos.md)           | Problema, escopo, casos de uso (ex.: landing page)              |
| [02-conceitos-fundamentais.md](./02-conceitos-fundamentais.md) | Grafo, chunks, embeddings, BM25, RRF, MCP                       |
| [03-arquitetura.md](./03-arquitetura.md)                       | Camadas, componentes, diagramas                                 |
| [04-ontologia-grafo.md](./04-ontologia-grafo.md)               | Tipos de nós, arestas, proveniência                             |
| [05-retrieval-hibrido.md](./05-retrieval-hibrido.md)           | Pipeline de busca, RRF, expansão no grafo                       |
| [06-fluxo-landing-page.md](./06-fluxo-landing-page.md)         | Caso de referência: context pack para landing                   |
| [07-servidor-mcp.md](./07-servidor-mcp.md)                     | Tools, resources, contratos                                     |
| [08-plano-poc.md](./08-plano-poc.md)                           | Fases, entregáveis, métricas, riscos                            |
| [09-decisoes-stack.md](./09-decisoes-stack.md)                 | TypeScript, Postgres+pgvector, BGE-M3, alternativas descartadas |

## Convenções

- Diagramas em **Mermaid** dentro dos arquivos (renderizam no GitHub e em vários editores).
- Termos em inglês quando são padrão de mercado (RRF, MCP, chunk); explicação em português.
- Esta pasta evolui com o código: ao implementar um módulo, atualizar o doc correspondente.

## Status do projeto

| Área                                         | Status        |
| -------------------------------------------- | ------------- |
| Documentação conceitual                      | Em andamento  |
| Fase 0 — fundação (monorepo, Docker, corpus) | Concluída     |
| Core (ingestão, índices, grafo)              | Fase 1+       |
| Servidor MCP                                 | Stub (Fase 5) |

## Leitura recomendada

1. [Visão e objetivos](./01-visao-e-objetivos.md) — por que o projeto existe.
2. [Conceitos fundamentais](./02-conceitos-fundamentais.md) — glossário e diagrama geral.
3. [Plano de POC](./08-plano-poc.md) — ordem de implementação.
