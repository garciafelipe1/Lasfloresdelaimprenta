# ---------- BUILDER ----------
FROM node:20-bullseye AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Copiamos monorepo configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalamos dependencias raíz
RUN pnpm install

# Copiamos TODO el repositorio
COPY . .

# Build de Medusa
RUN pnpm -F apps/store build


# ---------- RUNTIME ----------
FROM node:20-bullseye-slim AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

ENV NODE_ENV=production
ENV PORT=9000
EXPOSE 9000

# Copiamos el build estático de Medusa
COPY --from=builder /app/apps/store/.medusa .medusa
COPY --from=builder /app/apps/store/package.json .

# Instalamos solo dependencias de producción
RUN pnpm install --prod

CMD ["pnpm", "start"]
