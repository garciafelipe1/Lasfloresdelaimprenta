# ---------- BUILDER ----------
FROM node:20-bullseye AS builder

# Carpeta donde trabajaremos dentro del contenedor
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# 👇 Copiamos los archivos raíz del monorepo (subiendo un nivel)
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./

# 👇 Copiamos TODO el monorepo (subiendo un nivel)
COPY ../../ ./

# Instalamos dependencias del monorepo
RUN pnpm install

# Build de Medusa (workspace apps/store)
RUN pnpm -F apps/store build


# ---------- RUNTIME ----------
FROM node:20-bullseye-slim AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

ENV NODE_ENV=production
ENV PORT=9000
EXPOSE 9000

# Copiamos el build generado
COPY --from=builder /app/apps/store/.medusa .medusa
COPY --from=builder /app/apps/store/package.json .

# Instalamos dependencias de PRODUCCIÓN
RUN pnpm install --prod

CMD ["pnpm", "start"]
