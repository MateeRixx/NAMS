FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

FROM base AS development
COPY . .
RUN pnpm db:generate
CMD ["sh", "-c", "pnpm --filter=database db:push && pnpm dev"]

FROM base AS builder
COPY . .
RUN pnpm db:generate && pnpm --filter=backend build

FROM node:20-slim AS production
RUN apt-get update -y && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/ ./apps/
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "apps/backend/dist/server.js"]
