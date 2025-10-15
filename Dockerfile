# syntax=docker/dockerfile:1.7

########################
# 1) Base
########################
FROM node:20-alpine AS base
WORKDIR /app

# pnpm + compat libs
RUN apk add --no-cache libc6-compat bash curl \
  && corepack enable \
  && corepack prepare pnpm@10.17.1 --activate

ENV NEXT_TELEMETRY_DISABLED=1

########################
# 2) Dependencias
########################
FROM base AS deps
WORKDIR /app

# Copiamos todo el repo para resolver workspaces sin dolores de cabeza
# (si luego quieres optimizar caché, podemos copiar solo los package.json por workspace)
COPY . .

# Instala TODAS las deps del monorepo (incluye devDeps, necesarias para build)
RUN pnpm install --frozen-lockfile

########################
# 3) Build de apps/www
########################
FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production
# El flag de memoria debe ir en NODE_OPTIONS, no como argumento de pnpm
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Traemos código y node_modules resueltos
COPY --from=deps /app ./

# IMPORTANTE: tu Next debe tener output:'standalone' en apps/www/next.config.js
RUN pnpm --filter ./apps/www build --no-lint

########################
# 4) Runtime mínimo
########################
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Paquete del SO que a veces requiere sharp/swc
RUN apk add --no-cache libc6-compat

# Usuario no root
RUN addgroup --system --gid 1001 nodejs \
  && adduser  --system --uid 1001 nextjs

# Copiamos solo lo necesario desde el build "standalone"
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/public ./apps/www/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/static ./apps/www/.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "apps/www/server.js"]