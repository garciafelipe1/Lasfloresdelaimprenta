# syntax=docker/dockerfile:1.7

### BASE
FROM node:20-bullseye AS base
RUN apt-get update && apt-get install -y bash curl && rm -rf /var/lib/apt/lists/* \
    && corepack enable && corepack prepare pnpm@10.17.1 --activate
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

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

RUN pnpm -C apps/www build

# ---------- runtime ----------
FROM node:20-bullseye-slim AS runner
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NODE_ENV=production
ENV PORT=3000 HOSTNAME=0.0.0.0

WORKDIR /app

COPY --from=builder /app/apps/www/.next/standalone ./
COPY --from=builder /app/apps/www/.next/static ./apps/www/.next/static
COPY --from=builder /app/apps/www/public ./apps/www/public

RUN useradd --user-group --create-home --shell /bin/false nextjs \
  && chown -R nextjs:nextjs /app

USER nextjs

EXPOSE 3000
CMD ["node", "apps/www/server.js"]
