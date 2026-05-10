# api-gateway Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY api-gateway/package*.json ./
RUN npm install
COPY api-gateway/ ./
RUN npm run build

# Producción
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY api-gateway/package*.json ./

EXPOSE 3000

CMD ["node", "dist/main"]
