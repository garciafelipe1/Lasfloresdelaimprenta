# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Instalar libc y pnpm
RUN apk add --no-cache libc6-compat bash curl \
    && npm install -g pnpm@10.17.1

# --- deps ---
FROM base AS deps

# Copiar solo los archivos necesarios para instalar dependencias
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/ ./apps/
COPY packages/ ./packages/

# Instalar dependencias del monorepo
RUN pnpm install --frozen-lockfile

# --- builder ---
FROM base AS builder
WORKDIR /app

# Copiar node_modules desde deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY apps/ ./apps/
COPY packages/ ./packages/

# Build de la app www
RUN pnpm --filter ./apps/www build --max-old-space-size=4096 --no-lint

# --- runner ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no root
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copiar build de www
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/public ./apps/www/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/static ./apps/www/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/www/server.js"]
