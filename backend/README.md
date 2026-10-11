# UNDC RSU — Backend Go (Clean Architecture)

Ley 30220 Art 124-125 | SUNEDU Ind.29 | SINEACE Est.25

## Stack

Go 1.22 · Gin · GORM · PostgreSQL 18

## Estructura

```
cmd/server/main.go          → entrypoint
internal/config             → env + DSN PostgreSQL
internal/domain/            → entidades (1 archivo por entidad)
internal/dto                → request/response + validaciones
internal/repository         → GORM repos por entidad
internal/service            → reglas de negocio (carga no lectiva, ciclo mínimo, flujo BPMN, promedio Likert)
internal/handler            → controllers (Gin)
internal/router             → rutas /api/v1 (45+ endpoints)
internal/middleware         → CORS, logger, audit
internal/auth              → mock.go (OAuth presente/desactivado), mock_provider.go
internal/storage            → storage.go (local activo + cloud stub)
pkg/database, pkg/utils
```

## Configuración

### Variables de entorno

Copiar `.env.example` a `.env`:

```env
PORT=8080
GIN_MODE=release
DB_HOST=postgres          # 'postgres' en Docker, '127.0.0.1' en local
DB_PORT=5432
DB_USER=undc
DB_PASS=undc2026
DB_NAME=undc_rsu
JWT_SECRET=undc-rsu-super-secret-2026
UPLOAD_DIR=./uploads
AUTH_MODE=mock
STORAGE_DRIVER=local
```

### DSN PostgreSQL

El backend usa PostgreSQL 18 con el siguiente DSN:

```
host=postgres user=undc password=undc2026 dbname=undc_rsu port=5432 sslmode=disable TimeZone=America/Lima
```

**Desarrollo local sin Docker:**
```env
DB_HOST=127.0.0.1
DB_PORT=5432
```

## Ejecutar

```bash
# Con Docker (recomendado)
docker compose up --build -d

# Desarrollo local
docker compose up postgres -d
cd backend
cp .env.example .env
# Editar .env: DB_HOST=127.0.0.1
go mod tidy
go run ./cmd/server
```

## Verificación

```bash
# Health check
curl http://localhost:8080/health

# Swagger UI (84 ops)
open http://localhost:8080/swagger/index.html

# Lint + build
go vet ./...
go build ./cmd/server

# Regenerar Swagger tras cambiar handlers
swag init -g cmd/server/main.go -o docs --parseDependency --parseInternal
```

## Endpoints clave

- `POST /api/v1/auth/login` — Mock: `{correo, password}` (123456 / undc2026)
- `GET /api/v1/dashboard/kpis` — KPIs SUNEDU/SINEACE
- `GET /api/v1/catalogos/*` — tipos, líneas, estados (16), roles-actor, preguntas
- `POST /api/v1/proyectos` — Crea en BORRADOR (valida ciclo mínimo)
- `GET /api/v1/proyectos` — Lista paginada con filtros
- `POST /api/v1/proyectos/:id/transicion` — Flujo BPMN validado contra `RSU_Transicion_Estado`
- `GET /api/v1/proyectos/:id/historial` — Trazabilidad `vw_rsu_trazabilidad_aprobacion`
- `POST /api/v1/asignaciones/docente` — Valida `carga_no_lectiva_max` Art.86
- `POST /api/v1/beneficiarios` + `/vincular` — Padrón Cañete + vínculo proyecto
- `POST /api/v1/encuestas/beneficiario` — Likert 1-5, promedio + deduplicación
- `POST /api/v1/documentos/upload` — multipart + hash
- `POST /api/v1/indicadores`, `/presupuesto/movimientos` — Impacto y Art.125

## Validaciones Ley 30220

- Ciclo mínimo por tipo proyecto antes de inscribir líder
- Carga no lectiva docente no excede `carga_no_lectiva_max`
- Transición solo si existe en `RSU_Transicion_Estado` para el rol actor
- Fechas coherentes, presupuesto, DNI/RUC según tipo beneficiario
- Encuesta: no duplicada `(id_proyecto,id_beneficiario)`, beneficiario vinculado, promedio + `MUY_MALO..MUY_BUENO`

## Gotchas

- **PostgreSQL 18** obligatorio (no MySQL) — DSN usa `sslmode=disable TimeZone=America/Lima`
- Docker Compose usa hostname `postgres`; desarrollo local necesita `DB_HOST=127.0.0.1`
- Uploads servidos estáticamente en `/uploads`
- JWT auth es mock — acepta cualquier correo con password `123456` o `undc2026`
- `db/init.sql` + `db/seed_demo.sql` se ejecutan automáticamente al primer `docker compose up`
