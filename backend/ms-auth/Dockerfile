# ms-auth Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY ms-auth/package*.json ./
RUN npm install
COPY ms-auth/ ./
RUN npm run build

# Producción
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY ms-auth/package*.json ./

CMD ["node", "dist/main"]
