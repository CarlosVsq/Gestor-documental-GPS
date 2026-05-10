# ms-documentos Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY ms-documentos/package*.json ./
RUN npm install
COPY ms-documentos/ ./
RUN npm run build

# Producción
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY ms-documentos/package*.json ./

CMD ["node", "dist/main"]
