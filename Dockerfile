# syntax=docker/dockerfile:1.7

########################
# 1) Base
########################
FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat bash curl \
  && corepack enable \
  && corepack prepare pnpm@10.17.1 --activate

ENV NEXT_TELEMETRY_DISABLED=1

########################
# 2) Dependencias
########################
FROM base AS deps
WORKDIR /app

# Copia explícita del lockfile + manifests mínimos
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# Si por .dockerignore no llega el lock, falla acá con mensaje claro
RUN test -f pnpm-lock.yaml || (echo "❌ Falta pnpm-lock.yaml en el contexto. Asegúrate de no ignorarlo en .dockerignore y de tenerlo commiteado." && exit 1)

# Pre-descarga al store basándose en el lock (mejor caché)
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch --frozen-lockfile

# Ahora sí: copia TODO el repo (para workspaces)
COPY . .

# Instala enlazando desde la store (reproducible y rápido)
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline

########################
# 3) Build de apps/www
########################
FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Trae deps y código ya resuelto
COPY --from=deps /app ./

# IMPORTANTE: Next con output:'standalone' en apps/www/next.config.js
RUN --mount=type=secret,id=DB_URL \
    --mount=type=secret,id=DB_TOKEN \
    --mount=type=secret,id=MERCADO_PAGO_TOKEN \
    --mount=type=secret,id=APP_URL \
    --mount=type=secret,id=S3_URL \
    --mount=type=secret,id=S3_BUCKET \
    export DB_URL="$(cat /run/secrets/DB_URL)" && \
    export DB_TOKEN="$(cat /run/secrets/DB_TOKEN)" && \
    export MERCADO_PAGO_TOKEN="$(cat /run/secrets/MERCADO_PAGO_TOKEN)" && \
    export APP_URL="$(cat /run/secrets/APP_URL)" && \
    export S3_URL="$(cat /run/secrets/S3_URL)" && \
    export S3_BUCKET="$(cat /run/secrets/S3_BUCKET)" && \
    pnpm --filter ./apps/www build --no-lint

########################
# 4) Runtime
########################
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache libc6-compat

# Usuario no root
RUN addgroup --system --gid 1001 nodejs \
  && adduser  --system --uid 1001 nextjs

# Sólo lo necesario del standalone de Next
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/public ./apps/www/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/static ./apps/www/.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "apps/www/server.js"]