# syntax=docker/dockerfile:1.7

########################
# 1) Base
########################
FROM node:20-alpine AS base
WORKDIR /app

# Herramientas mínimas + pnpm activado vía corepack
RUN apk add --no-cache libc6-compat bash curl \
  && corepack enable \
  && corepack prepare pnpm@10.17.1 --activate

ENV NEXT_TELEMETRY_DISABLED=1

########################
# 2) Dependencias
########################
FROM base AS deps
WORKDIR /app

# 🔧 toolchain solo en etapa de deps (por si hay node-gyp/sharp/etc.)
RUN apk add --no-cache --virtual .build-deps python3 make g++ pkgconfig

# Copia lock/manifests mínimos
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN test -f pnpm-lock.yaml || (echo "❌ Falta pnpm-lock.yaml en el contexto. Asegúrate de no ignorarlo en .dockerignore y de tenerlo commiteado." && exit 1)

# Pre-descarga al store basándose en el lock (mejor caché)
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch --frozen-lockfile

# Resto del repo (workspaces)
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

# ✅ Secretos solo en build (NO quedan en la imagen)
RUN --mount=type=secret,id=DB_URL \
    --mount=type=secret,id=DB_TOKEN \
    --mount=type=secret,id=MERCADO_PAGO_TOKEN \
    --mount=type=secret,id=APP_URL \
    --mount=type=secret,id=S3_URL \
    --mount=type=secret,id=S3_BUCKET \
    --mount=type=secret,id=S3_KEY_ID \
    --mount=type=secret,id=S3_SECRET \
    for v in DB_URL DB_TOKEN MERCADO_PAGO_TOKEN APP_URL S3_URL S3_BUCKET S3_KEY_ID S3_SECRET; do \
      [ -f "/run/secrets/$v" ] || { echo "Missing secret: $v"; exit 1; }; \
    done && \
    export DB_URL="$(cat /run/secrets/DB_URL)" \
           DB_TOKEN="$(cat /run/secrets/DB_TOKEN)" \
           MERCADO_PAGO_TOKEN="$(cat /run/secrets/MERCADO_PAGO_TOKEN)" \
           APP_URL="$(cat /run/secrets/APP_URL)" \
           S3_URL="$(cat /run/secrets/S3_URL)" \
           S3_BUCKET="$(cat /run/secrets/S3_BUCKET)" \
           S3_KEY_ID="$(cat /run/secrets/S3_KEY_ID)" \
           S3_SECRET="$(cat /run/secrets/S3_SECRET)" && \
    pnpm --filter ./apps/www build --no-lint && \
    # 🔎 Falla rápido si no se generó el standalone
    ls -la apps/www/.next || true && \
    test -f apps/www/.next/standalone/apps/www/server.js || \
    test -f apps/www/.next/standalone/server.js || \
    (echo "❌ No se encontró .next/standalone. ¿Tienes output:'standalone' en apps/www/next.config.* ?" && exit 1)

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

# Solo lo necesario del standalone
# - Copiamos el standalone completo en /app
# - Copiamos los estáticos en su ruta esperada
# - Copiamos public
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/static ./apps/www/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/public ./apps/www/public

USER nextjs
EXPOSE 3000

# 🟢 Arranque tolerante a ruta de server.js (depende de la versión de Next)
CMD [ "sh", "-lc", "node server.js 2>/dev/null || node apps/www/server.js" ]