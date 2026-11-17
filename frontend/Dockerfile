# syntax=docker/dockerfile:1
# ── UNDC RSU Frontend — React 18 + Vite 5 + TypeScript + Tailwind — Nginx 1.27 ──
FROM node:20-alpine AS builder
WORKDIR /app
# Cache deps por separado (sin BuildKit mounts para compatibilidad Windows)
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
# Build produccion (tsc + vite)
RUN npm run build

FROM nginx:1.27-alpine
LABEL maintainer="UNDC RSU <rsu@undc.edu.pe>"
RUN apk add --no-cache curl tzdata && \
    rm -rf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
# La conf es una PLANTILLA: el entrypoint oficial de nginx le aplica envsubst
# (solo variables de entorno definidas) y escribe /etc/nginx/conf.d/default.conf.
COPY nginx.conf /etc/nginx/templates/default.conf.template
# Upstream del API por defecto (nombre del servicio en docker-compose.yml).
ENV API_UPSTREAM=backend:8080
# Permisos y healthcheck
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html
ENV TZ=America/Lima
EXPOSE 80
HEALTHCHECK --interval=20s --timeout=5s --retries=3 CMD curl -f http://localhost/ || exit 1
CMD ["nginx","-g","daemon off;"]
