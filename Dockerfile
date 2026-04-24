# ---------- 1. Build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npm run build


# ---------- 2. Production deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev


# ---------- 3. Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Needed for Prisma + Postgres SSL
RUN apk add --no-cache ca-certificates

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy Prisma runtime (THIS is enough for Prisma v7)
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled app
COPY --from=builder /app/dist ./dist

# Copy Prisma schema (important for runtime)
COPY --from=builder /app/prisma ./prisma

# Security: run as non-root
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
USER nodejs

EXPOSE 8080
CMD ["node", "dist/src/main.js"]