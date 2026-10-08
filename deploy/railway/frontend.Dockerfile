FROM node:22-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps
COPY frontend/ .
RUN npm run build
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY deploy/railway/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/railway/owner-auth.sh /docker-entrypoint.d/05-owner-auth.sh
RUN chmod +x /docker-entrypoint.d/05-owner-auth.sh
ENV PORT=8080 NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_HOST)$"
EXPOSE 8080
