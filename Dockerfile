# ---------- 1. Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps (with dev)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# ---------- 2. Production deps stage ----------
FROM node:20-alpine AS deps
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# Install ONLY production deps
RUN npm ci --omit=dev

# ---------- 3. Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Required for Prisma SSL (Postgres)
RUN apk add --no-cache ca-certificates

# Copy prod deps
COPY --from=deps /app/node_modules ./node_modules

# Copy Prisma runtime (engines + client)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled app only
COPY --from=builder /app/dist ./dist

# Optional: reduce attack surface
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
USER nodejs

EXPOSE 8080
CMD ["node", "dist/src/main.js"]