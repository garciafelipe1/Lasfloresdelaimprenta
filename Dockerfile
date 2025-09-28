# syntax=docker/dockerfile:1

FROM node:18-alpine AS base

# --- Etapa de Builder: Instalación y Construcción ---
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia los archivos de gestión de paquetes (necesario para el pnpm install)
COPY package.json pnpm-lock.yaml* ./
COPY apps/www/package.json ./apps/www/
COPY apps/store/package.json ./apps/store/
COPY packages/utils/package.json ./packages/utils/

# Instala todas las dependencias en esta misma etapa.
# Esto asegura que los binarios (como 'next') estén disponibles.
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copia el resto del código fuente y ejecuta el build
COPY . .

# Build de la app sin romper por ESLint/TS errors
RUN corepack enable pnpm && \
    pnpm --filter ./apps/www exec next build --max-old-space-size=4096 --no-lint

# --- Etapa Final de Runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/www/public ./apps/www/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/static ./apps/www/.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/www/server.js"]