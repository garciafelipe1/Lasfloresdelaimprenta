# -------- Base (builder) --------
FROM node:20-bullseye AS base

# Dependencias nativas necesarias para Prisma / Sharp / bcrypt / etc.
RUN apt-get update && apt-get install -y \
  python3 \
  python3-dev \
  build-essential \
  libssl-dev \
  pkg-config \
  make \
  g++ \
  openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/store/package.json apps/store/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm -F ./apps/store build


# -------- Runtime --------
FROM node:20-bullseye AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y \
  openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

ENV NODE_ENV=production

# ✅ ESTA ES LA ÚNICA COPIA CORRECTA
COPY --from=base /app/apps/store/.medusa /app/.medusa

WORKDIR /app/.medusa/server

RUN pnpm install --prod

EXPOSE 9000

CMD ["sh", "-c", \"pnpm predeploy && pnpm seed && pnpm medusa user -e \\\"$ADMIN_EMAIL\\\" -p \\\"$ADMIN_PASSWORD\\\" || true && pnpm start\"]
