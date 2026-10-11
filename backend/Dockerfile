# syntax=docker/dockerfile:1
# ── UNDC RSU Backend — Go 1.23 + Gin + GORM + PostgreSQL 18 ──
FROM golang:1.23-alpine AS builder
WORKDIR /src
RUN apk add --no-cache git ca-certificates tzdata
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Build estático, sin CGO, para Alpine
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /out/server ./cmd/server && \
    chmod +x /out/server

FROM alpine:3.19
LABEL maintainer="UNDC RSU <rsu@undc.edu.pe>" \
      description="UNDC RSU Backend — Ley 30220 Art.124-125 — PostgreSQL 18"
RUN apk add --no-cache ca-certificates tzdata curl && \
    addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/uploads && chown -R appuser:appgroup /app
WORKDIR /app
COPY --from=builder /out/server ./server
COPY --from=builder /src/docs ./docs
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
# Plantillas y lector de Excel: se montan por volumen desde docker-compose.yml
# (carpeta documentos/ al nivel del backend) en /app/documentos.
# Python solo para interpretar el Excel de planificación de actividades.
# openpyxl se instala desde los repositorios de Alpine (py3-pip no es necesario).
RUN apk add --no-cache python3 py3-openpyxl
ENV TZ=America/Lima \
    GIN_MODE=release \
    PORT=8080 \
    UPLOAD_DIR=/app/uploads
EXPOSE 8080
USER appuser
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=10s \
  CMD curl -f http://localhost:8080/health || exit 1
CMD ["./server"]
