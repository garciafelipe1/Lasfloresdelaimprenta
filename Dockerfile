# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# -----------------------------
# STAGE: deps
# -----------------------------
FROM base AS deps

# Copiar manifests y estructura de monorepo
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml* ./
COPY apps/ ./apps/
COPY packages/ ./packages/

# Activar Corepack y pnpm
RUN corepack enable
RUN corepack prepare pnpm@10.17.1 --activate

# Instalar todas las dependencias (dev + prod)
RUN pnpm install --frozen-lockfile

# -----------------------------
# STAGE: builder
# -----------------------------
FROM base AS builder
WORKDIR /app

# Activar Corepack y pnpm
RUN corepack enable
RUN corepack prepare pnpm@10.17.1 --activate

# Copiar node_modules y código fuente
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build de la app www
RUN pnpm --filter ./apps/www build --max-old-space-size=4096 --no-lint

# -----------------------------
# STAGE: runner (producción lean)
# -----------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Crear usuario no root
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copiar solo artefactos necesarios para producción
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/standalone ./ 
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/static ./public/.next/static

# Copiar node_modules necesarias para standalone
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
