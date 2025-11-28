# syntax=docker/dockerfile:1.7

####################################
# BASE
####################################
FROM node:20-bullseye AS base
RUN apt-get update && apt-get install -y bash curl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable && corepack prepare pnpm@10.17.1 --activate

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app


####################################
# DEPS (instala dependencias del monorepo una sola vez)
####################################
FROM base AS deps

RUN apt-get update && apt-get install -y python3 make g++ pkg-config \
  && rm -rf /var/lib/apt/lists/*

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch

COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile --offline


####################################
# BUILDER – NEXT.JS
####################################
FROM base AS builder_www

ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_DEFAULT_REGION

ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION

COPY --from=deps /app .
RUN pnpm -C apps/www build


####################################
# BUILDER – MEDUSA STORE
####################################
FROM base AS builder_store

# Traemos todo el monorepo ya resuelto desde deps
COPY --from=deps /app .

# Nos paramos dentro del backend de Medusa
WORKDIR /app/apps/store

# Ejecutamos explícitamente lo mismo que tu script "build"
# "build": "pnpm medusa build && npm run resolve:aliases && rm -rf public && ln -s .medusa/server/public public"
RUN pnpm medusa build \
 && npm run resolve:aliases \
 && rm -rf public \
 && ln -s .medusa/server/public public


####################################
# RUNTIME – NEXTJS
####################################
FROM node:20-bullseye-slim AS runner_www

ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_DEFAULT_REGION

ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION

ENV NODE_ENV=production
ENV PORT=3000 HOSTNAME=0.0.0.0

WORKDIR /app

COPY --from=builder_www /app/apps/www/.next/standalone ./
COPY --from=builder_www /app/apps/www/.next/static ./apps/www/.next/static
COPY --from=builder_www /app/apps/www/public ./apps/www/public

USER node
EXPOSE 3000

CMD ["node", "apps/www/server.js"]


####################################
# RUNTIME – MEDUSA
####################################
FROM node:20-bullseye-slim AS runner_store

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

ENV NODE_ENV=production
ENV PORT=9000

# Ahora ya sabemos que, si el build pasó, existe .medusa/server
COPY --from=builder_store /app/apps/store/.medusa/server ./

RUN pnpm install --prod

EXPOSE 9000
CMD ["pnpm", "start"]
