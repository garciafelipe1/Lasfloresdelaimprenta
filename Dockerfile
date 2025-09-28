# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

# --- deps ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar todo el monorepo
COPY . .

# Activar Corepack y pnpm
RUN corepack enable
RUN corepack prepare pnpm@10.17.1 --activate

# Instalar todas las dependencias del workspace
RUN pnpm install --frozen-lockfile

# --- builder ---
FROM base AS builder
WORKDIR /app

# Activar Corepack y pnpm
RUN corepack enable
RUN corepack prepare pnpm@10.17.1 --activate

# Copiar node_modules y el resto del proyecto
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build de la app www
RUN pnpm --filter @floreria/www build --max-old-space-size=4096

# --- runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar la build
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/public ./apps/www/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/static ./apps/www/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/www/server.js"]
