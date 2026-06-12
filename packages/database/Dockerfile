FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app
COPY ../.. .
RUN pnpm install --frozen-lockfile
CMD ["pnpm", "db:generate"]
