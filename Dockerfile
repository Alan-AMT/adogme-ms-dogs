# --- Etapa 1: Build ---
FROM node:20-alpine AS builder
# Instalar openssl es necesario para que Prisma funcione en Alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/ 

# Instala todas las dependencias
RUN npm ci

# Genera el cliente de Prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# --- Etapa 2: Runner ---
FROM node:20-alpine AS runner
# El runtime también necesita openssl para Prisma
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV production

# Solo copiamos los archivos compilados
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# ESTRATEGIA PARA NODE_MODULES:
# En lugar de copiar los node_modules gigantes del builder (que tienen TS, Nest CLI, etc),
# instalamos solo las dependencias de producción.
RUN npm ci --only=production

# Re-copiamos el cliente de Prisma generado específicamente
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 8080
ENV PORT 8080

CMD ["node", "dist/src/main.js"]