# Multi-stage build — Node 22 on Debian bookworm-slim (ONNX / native libs friendly)
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/core/package.json ./packages/core/
COPY packages/adapter-postgres/package.json ./packages/adapter-postgres/
COPY packages/adapter-embeddings-transformers/package.json ./packages/adapter-embeddings-transformers/
COPY packages/adapter-embeddings-openai/package.json ./packages/adapter-embeddings-openai/
COPY packages/cli/package.json ./packages/cli/
COPY packages/mcp-server/package.json ./packages/mcp-server/
RUN pnpm install --frozen-lockfile || pnpm install

FROM deps AS build
COPY . .
RUN pnpm run build

FROM base AS runtime
ENV NODE_ENV=production
ENV HF_HOME=/root/.cache/huggingface
COPY --from=build /app /app
WORKDIR /app
CMD ["node", "packages/cli/dist/index.js"]
