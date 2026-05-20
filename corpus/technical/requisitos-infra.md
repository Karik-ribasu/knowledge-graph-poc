---
doc_type: technical
title: Requisitos de infraestrutura
audience: devops
tags: [infra]
---

# Requisitos de infra

## Mínimo (POC / Team)

- 4 vCPU, 16 GB RAM (embeddings CPU)
- Postgres 16 + pgvector
- 20 GB disco + volume HF cache

## Recomendado Enterprise

- 8 vCPU, 32 GB RAM
- Postgres HA, backups diários

Arquitetura lógica: [[arquitetura]]. Deploy Docker: `docker/docker-compose.dev.yml`.
