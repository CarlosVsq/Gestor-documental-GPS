# Frontend Dockerfile - React + Vite
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Servir con un servidor estático ligero
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de Nginx para SPA
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  client_max_body_size 50M; \
  location / { \
  try_files $uri $uri/ /index.html; \
  } \
  location /api { \
  proxy_pass http://api-gateway:3000; \
  proxy_set_header Host $host; \
  proxy_set_header X-Real-IP $remote_addr; \
  } \
  }' > /etc/nginx/conf.d/default.conf

# Solucionar MIME type error para archivos .mjs en Nginx
RUN sed -i '/application\/javascript/s/js;/js mjs;/' /etc/nginx/mime.types || echo "types { application/javascript mjs; }" > /etc/nginx/conf.d/mjs.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
