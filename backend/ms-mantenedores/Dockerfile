# ms-mantenedores Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY ms-mantenedores/package*.json ./
RUN npm install
COPY ms-mantenedores/ ./
RUN npm run build

# Producción
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY ms-mantenedores/package*.json ./

CMD ["node", "dist/main"]
