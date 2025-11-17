# syntax=docker/dockerfile:1.7

### BASE → usar Debian/GLIBC
FROM node:20-bullseye AS base
RUN apt-get update && apt-get install -y bash curl && rm -rf /var/lib/apt/lists/* \
    && corepack enable && corepack prepare pnpm@10.17.1 --activate
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# IMPORTANTÍSIMO: eliminar esto (rompe GLIBC)
# ❌ ENV npm_config_platform=linux npm_config_arch=x64 npm_config_libc=musl

WORKDIR /app

# ---------- deps ----------
FROM base AS deps
RUN apt-get update && apt-get install -y python3 make g++ pkg-config && rm -rf /var/lib/apt/lists/*
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm fetch

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --offline

# ---------- build ----------
FROM base AS builder
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_RUNTIME=nodejs

COPY --from=deps /app ./

RUN --mount=type=secret,id=DB_URL \
    --mount=type=secret,id=DB_TOKEN \
    --mount=type=secret,id=MERCADO_PAGO_TOKEN \
    --mount=type=secret,id=APP_URL \
    --mount=type=secret,id=S3_URL \
    --mount=type=secret,id=S3_BUCKET \
    --mount=type=secret,id=S3_KEY_ID \
    --mount=type=secret,id=S3_SECRET \
    --mount=type=secret,id=PAYLOAD_SECRET \
    bash -lc 'set -euo pipefail; \
      for v in DB_URL DB_TOKEN MERCADO_PAGO_TOKEN APP_URL S3_URL S3_BUCKET S3_KEY_ID S3_SECRET PAYLOAD_SECRET; do \
        export "$v=$(cat "/run/secrets/$v")"; \
      done; \
      export DATABASE_URL="${DATABASE_URL:-$DB_URL}"; \
      export DATABASE_URI="${DATABASE_URI:-$DB_URL}"; \
      pnpm -C apps/www build'

# ---------- runtime ----------
FROM node:20-bullseye-slim AS runner
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NODE_ENV=production
ENV PORT=3000 HOSTNAME=0.0.0.0

WORKDIR /app

COPY --from=builder /app/apps/www/.next/standalone ./
COPY --from=builder /app/apps/www/.next/static ./apps/www/.next/static
COPY --from=builder /app/apps/www/public       ./apps/www/public

RUN useradd --user-group --create-home --shell /bin/false nextjs \
  && chown -R nextjs:nextjs /app

USER nextjs

EXPOSE 3000
CMD ["node", "apps/www/server.js"]
