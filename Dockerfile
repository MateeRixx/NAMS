FROM node:20-slim AS base
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN apt-get update -y && apt-get install -y openssl chromium --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

FROM base AS development
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY . .
RUN pnpm db:generate
CMD ["sh", "-c", "pnpm --filter=database db:push && pnpm --filter=database db:seed && pnpm dev"]

FROM base AS builder
COPY . .
RUN pnpm db:generate && pnpm build

FROM node:20-slim AS production
RUN apt-get update -y && apt-get install -y openssl chromium --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
EXPOSE 3000
CMD ["node", "apps/backend/dist/server.js"]
