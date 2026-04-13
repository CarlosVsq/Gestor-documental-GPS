# Backend Dockerfile - NestJS
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Producción
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main"]
