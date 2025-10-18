# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat bash curl && corepack enable && corepack prepare pnpm@10.17.1 --activate
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# 👉 asegura que pnpm resuelva binarios para Alpine (musl)
ENV npm_config_platform=linux npm_config_arch=x64 npm_config_libc=musl
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
RUN apk add --no-cache --virtual .build-deps python3 make g++ pkgconfig
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Trae TODAS las dependencias (prod + dev) al store
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm fetch

# Copia el monorepo completo
COPY . .

# Instala offline usando el store ya poblado
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --offline

RUN apk del .build-deps

# ---------- build ----------
FROM base AS builder
COPY --from=deps /app ./

# Exportá los secretos a variables de entorno y compilá
RUN --mount=type=secret,id=DB_URL \
    --mount=type=secret,id=DB_TOKEN \
    --mount=type=secret,id=MERCADO_PAGO_TOKEN \
    --mount=type=secret,id=APP_URL \
    --mount=type=secret,id=S3_URL \
    --mount=type=secret,id=S3_BUCKET \
    --mount=type=secret,id=S3_KEY_ID \
    --mount=type=secret,id=S3_SECRET \
    bash -lc 'set -euo pipefail; \
      for v in DB_URL DB_TOKEN MERCADO_PAGO_TOKEN APP_URL S3_URL S3_BUCKET S3_KEY_ID S3_SECRET; do \
        export "$v=$(cat "/run/secrets/$v")"; \
      done; \
      pnpm -C apps/www build'

# ---------- runtime ----------
FROM node:20-alpine AS runner
ENV NODE_ENV=production

# seguimos como root por ahora
WORKDIR /app

# Copiá el bundle standalone y assets
COPY --from=builder /app/apps/www/.next/standalone ./
COPY --from=builder /app/apps/www/.next/static ./apps/www/.next/static
COPY --from=builder /app/apps/www/public       ./apps/www/public

# crear usuario no-root y dar permisos
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs \
  && chown -R nextjs:nextjs /app

USER nextjs

EXPOSE 3000
WORKDIR /app/apps/www
CMD ["node", "server.js"]