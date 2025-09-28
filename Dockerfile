# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar package.json y lockfiles
COPY package.json pnpm-lock.yaml* ./
COPY apps/www/package.json ./apps/www/
COPY apps/store/package.json ./apps/store/
COPY packages/utils/package.json ./packages/utils/

# Activar Corepack y pnpm
RUN corepack enable
RUN corepack prepare pnpm@10.17.1 --activate

# Instalar dependencias
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build de la app (sin romper ESLint/TS errors)
RUN pnpm --filter ./apps/www build --max-old-space-size=4096 --no-lint

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Crear usuario para correr la app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar build al contenedor final
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/public ./apps/www/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/static ./apps/www/.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/www/server.js"]
