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
# toolchain para compilar deps nativas si hace falta
RUN apk add --no-cache --virtual .build-deps python3 make g++ pkgconfig
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# prefetch del store (descarga lo necesario para linux-musl)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm fetch --prod
# copia del monorepo completo
COPY . .
# instalación offline usando el store ya “prefetcheado”
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
FROM base AS runner
ENV NODE_ENV=production
# usuario no-root
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
USER nextjs
WORKDIR /app

# Copiá el bundle standalone completo (respeta subcarpetas).
COPY --from=builder /app/apps/www/.next/standalone ./
# Assets estáticos y public de la app
COPY --from=builder /app/apps/www/.next/static ./apps/www/.next/static
COPY --from=builder /app/apps/www/public ./apps/www/public

EXPOSE 3000
# El server.js queda en apps/www dentro del bundle standalone
WORKDIR /app/apps/www
CMD ["node", "server.js"]