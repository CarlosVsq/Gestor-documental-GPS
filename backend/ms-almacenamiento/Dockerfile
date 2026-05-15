# ms-almacenamiento Dockerfile
FROM node:20-alpine AS builder

# sharp necesita herramientas de compilación nativas
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY ms-almacenamiento/package*.json ./
RUN npm install
COPY ms-almacenamiento/ ./
RUN npm run build

# Producción
FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY ms-almacenamiento/package*.json ./

CMD ["node", "dist/main"]
