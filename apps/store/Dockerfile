# -------- Base (builder) --------
FROM node:20-alpine AS base

# Paquetes útiles para dependencias nativas / OpenSSL (Prisma, etc.)
RUN apk add --no-cache libc6-compat openssl python3 make g++

WORKDIR /app

# Usar pnpm via corepack (mejor que instalar global)
RUN corepack enable

# Copia mínima para cache de instalación
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/store/package.json apps/store/

# Instalar deps del monorepo respetando el lockfile
RUN pnpm install --frozen-lockfile

# Copiar el resto del repo (código)
COPY . .

# Build SOLO la app de store (Medusa)
RUN pnpm -F ./apps/store build

# -------- Runtime --------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl && corepack enable

ENV NODE_ENV=production

# Copiar el resultado del build. Algunas plantillas de Medusa generan .medusa
# dentro de apps/store; otras en la raíz. Cubrimos ambos casos.
# Preferencia: si existe en apps/store, úsalo; si no, copia el de raíz.
# (El segundo COPY no pisa si no existe el primero)
COPY --from=base /app/apps/store/.medusa /app/.medusa
COPY --from=base /app/.medusa /app/.medusa

# Instalar deps de runtime dentro del server generado
WORKDIR /app/.medusa/server
RUN pnpm install --prod

# Exponer puerto típico de Medusa
EXPOSE 9000

# Nota: si tu build no genera .medusa/server, ajustá el WORKDIR y el CMD.
# El siguiente CMD corre migraciones/seed opcional y levanta el server.
# Variables esperadas (inyectalas al run/deploy): ADMIN_EMAIL, ADMIN_PASSWORD
CMD ["sh", "-c", "pnpm predeploy && pnpm seed && pnpm medusa user -e \"$ADMIN_EMAIL\" -p \"$ADMIN_PASSWORD\" || true && pnpm start"]