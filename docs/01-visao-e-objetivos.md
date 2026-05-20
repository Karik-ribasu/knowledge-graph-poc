# Visão e objetivos

## Problema

Organizações acumulam grandes volumes de documentação heterogênea — negócio, pesquisa de mercado, stack técnica — em arquivos Markdown (ou exportados para `.md`). Uma ferramenta de IA que precisa **sintetizar** algo concreto (ex.: uma landing page) não pode enviar todo o corpus em um único prompt:

- Custo e limite de contexto.
- Ruído: trechos semanticamente similares mas irrelevantes para a tarefa.
- Lacunas: falta de **cobertura** entre dimensões (posicionamento, persona, diferenciação, prova social, etc.).

Cenário típico: centenas de docs, **≥ 5k linhas** no total (e crescendo), insuficiente para "colar tudo" no prompt com eficiência.

## Proposta

Construir um **grafo de conhecimento** sobre o corpus, combinado com **índices de retrieval** (vetorial e léxico), exposto via **servidor MCP** para agentes e ferramentas internas.

O sistema deve:

1. **Ingerir** centenas de `.md` com proveniência (documento, seção, heading).
2. **Modelar** entidades e relações de negócio/GTM (não apenas "documento contém texto").
3. **Recuperar** contexto relevante por linguagem natural e por navegação no grafo.
4. **Entregar** pacotes de contexto estruturados para tarefas downstream (geração de landing, briefs, etc.).

## Caso de uso de referência: landing page

**Entrada:** brief (`produto`, `persona`, `objetivo`, `tom`).

**Saída:** `ContextPack` — conjunto estruturado e limitado em tokens, com citações aos trechos/fontes, pronto para um LLM gerar copy e estrutura da página.

| Papel | Responsabilidade |
|-------|------------------|
| **Grafo** | Descoberta relacionada — o que mais ler além do óbvio |
| **Embeddings** | Onde está escrito em linguagem natural |
| **BM25** | Termos exatos — concorrentes, siglas, stack |
| **Planner (facets)** | O que uma landing precisa conter |

Ver [06-fluxo-landing-page.md](./06-fluxo-landing-page.md).

## Escopo da POC

| Dentro do escopo | Fora do escopo (inicial) |
|------------------|---------------------------|
| Ingestão de `.md`, chunking por estrutura | OCR de PDF, crawlers web |
| Grafo com ontologia GTM mínima | Extração LLM em escala industrial sem schema |
| Híbrido: embeddings + BM25 + RRF | Fine-tuning de embeddings |
| Expansão 1–2 hops no grafo | Raciocínio multi-hop complexo (GraphRAG completo) |
| Servidor MCP com tools essenciais | UI administrativa |
| Caso landing como validação | Outros templates (email, pitch deck) — fase 2 |

## Princípios de design

1. **Separação de camadas:** core (ingestão, grafo, índices) independente do adaptador MCP.
2. **Proveniência sempre:** todo chunk e afirmação rastreável ao arquivo e seção.
3. **Schema antes de extração livre:** ontologia fixa reduz ruído no grafo.
4. **Medir cedo:** benchmark pequeno com perguntas reais sobre o corpus.
5. **Evolução incremental:** grafo mínimo (links + headings) antes de extração pesada por LLM.

## Métricas de sucesso (POC)

- **Recall@10** em perguntas rotuladas sobre o corpus.
- **Cobertura de facets** no ContextPack da landing (checklist manual).
- **Citação correta** — trecho recuperado corresponde à fonte declarada.
- **Latência p95** da tool `plan_landing_context` (meta inicial: < 3s em corpus POC).
