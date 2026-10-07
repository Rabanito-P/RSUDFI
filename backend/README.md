# UNDC RSU — Backend Go (Clean Architecture)

Ley 30220 Art 124-125 | SUNEDU Ind.29 | SINEACE Est.25

## Stack
Go 1.22 · Gin · GORM · MySQL 8

## Estructura
```
cmd/server/main.go          → entrypoint
internal/config             → env + DSN
internal/domain/models.go   → entidades (100% mapeo .sql)
internal/dto               → request/response + validaciones
internal/repository        → GORM repos por módulo
internal/service           → reglas de negocio (carga no lectiva, ciclo mínimo, flujo BPMN, promedio Likert)
internal/handler           → controllers (Gin)
internal/router            → rutas /api/v1
internal/middleware        → CORS, logger
pkg/database, pkg/utils
```

## Variables
Copiar `.env.example` a `.env` y ajustar DB.

## Ejecutar
```bash
go mod tidy
go run ./cmd/server
# http://localhost:8080/health
# http://localhost:8080/api/v1
```

## Endpoints clave
- `POST /api/v1/auth/login` {correo, password} → mock (123456 / undc2026) | admin@undc.edu.pe
- `GET /api/v1/dashboard/kpis`
- `POST /api/v1/proyectos` + `GET /api/v1/proyectos` + `POST /api/v1/proyectos/:id/transicion` (flujo BPMN validado contra RSU_Transicion_Estado)
- `POST /api/v1/beneficiarios` + `POST /api/v1/beneficiarios/vincular`
- `POST /api/v1/encuestas/beneficiario` (Likert 1-5, cálculo promedio + deduplicación)
- `POST /api/v1/documentos/upload` multipart
- `GET /api/v1/catalogos/*` (tipos, líneas, estados, preguntas)

## Validaciones Ley 30220
- Ciclo mínimo por tipo proyecto antes de inscribir líder
- Carga no lectiva docente no excede `carga_no_lectiva_max`
- Transición solo si existe en `RSU_Transicion_Estado` para el rol actor
- Fechas coherentes, presupuesto, DNI/RUC según tipo beneficiario
