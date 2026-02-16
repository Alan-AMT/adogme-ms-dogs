# --- Etapa 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/ 

# Instala dependencias e incluye prisma
RUN npm install

# ¡ESTE ES EL PASO QUE FALTA!
# Genera el cliente de Prisma basado en tu schema.prisma
RUN npx prisma generate

# Copia el resto del código y compila NestJS
COPY . .
RUN npm run build

# --- Etapa 2: Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Copiamos solo lo necesario desde el builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
# Copiamos las dependencias de producción y el cliente generado
COPY --from=builder /app/node_modules ./node_modules

# Si tu estrategia requiere copiar específicamente la carpeta .prisma:
# COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 8080
ENV PORT 8080

CMD ["node", "dist/src/main.js"]