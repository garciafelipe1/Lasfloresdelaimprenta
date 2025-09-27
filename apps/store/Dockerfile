# -------- Builder Stage --------
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# Copy dependency files
COPY package.json ./

# Install dependencies
RUN pnpm install

# Copy source
COPY . .

# Build Medusa app
RUN cat package.json && pnpm build

# -------- Runtime Stage --------
FROM node:20-alpine AS runtime

WORKDIR /app

RUN npm install -g pnpm

# Copy only built output and minimal project metadata
COPY --from=builder /app/.medusa ./.medusa

# Set production env
ENV NODE_ENV=production

WORKDIR /app/.medusa/server

RUN pnpm install

# Expose port
EXPOSE 9000

# Default: run predeploy + start
CMD ["sh", "-c", "pnpm predeploy && pnpm seed && pnpm medusa user -e \"$ADMIN_EMAIL\" -p \"$ADMIN_PASSWORD\" || true && pnpm start"]

