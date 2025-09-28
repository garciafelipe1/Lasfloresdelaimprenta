# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- deps ---
FROM base AS deps

# Copiar package.json, lockfile y workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/www/package.json ./apps/www/
COPY apps/store/package.json ./apps/store/
COPY packages/utils/package.json ./packages/utils/

# Activar Corepack y pnpm
RUN corepack enable
RUN corepack prepare pnpm@10.17.1 --activate

# Instalar todas las dependencias del workspace
RUN pnpm install --frozen-lockfile --recursive

# --- builder ---
FROM base AS builder
WORKDIR /app

# Activar Corepack y pnpm
RUN corepack enable
RUN corepack prepare pnpm@10.17.1 --activate

# Copiar node_modules desde deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Hacer build de la app www
RUN pnpm --filter @floreria/www build --max-old-space-size=4096 --no-lint

# --- runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar solo lo necesario de la build
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/public ./apps/www/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/static ./apps/www/.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
