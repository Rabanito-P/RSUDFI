# UNDC RSU — AGENTS.md

## Project Overview
Fullstack system for UNDC Cañete RSU management (Ley 30220 Art. 124-125, SUNEDU Ind.29, SINEACE Est.25).
- **Backend**: Go 1.22, Gin, GORM, PostgreSQL 18 — Clean Architecture
- **Frontend**: React 18, Vite, TypeScript, Tailwind, Recharts, Lucide
- **Database**: PostgreSQL 18 (Docker) with init.sql for schema + seed

## Quick Commands

### Local Development (with Docker DB)
```bash
# 1. Start PostgreSQL 18
docker compose up postgres -d

# 2. Backend
cd backend
cp .env.example .env   # adjust DB_HOST=127.0.0.1 if not using Docker
go mod tidy
go run ./cmd/server
# → http://localhost:8080/health

# 3. Frontend
cd frontend
npm install
npm run dev   # http://localhost:5173 (proxies /api → :8080)
```

### Full Docker Stack
```bash
docker compose up --build -d
# Frontend: http://localhost:5173
# Backend:  http://localhost:8080/health
```

### Build & Verify
```bash
# Backend
cd backend && go vet ./... && go build ./cmd/server

# Frontend
cd frontend && npm run build  # outputs to dist/
```

## Architecture Notes

### Backend (Clean Architecture)
```
cmd/server/main.go          → entrypoint
internal/config             → env + DSN (PostgreSQL)
internal/domain/models.go   → 30+ entities (1:1 SQL mapping)
internal/dto/dto.go         → request/response + binding validations
internal/repository/        → GORM repos per module
internal/service/services.go → business rules (ciclo mínimo, carga no lectiva, BPMN, Likert)
internal/handler/           → Gin controllers
internal/router/router.go   → /api/v1 routes (45+ endpoints)
internal/middleware/        → CORS, Logger
pkg/database, pkg/utils
```

### Frontend
```
src/
  api/client.ts        → Axios instance (baseURL from VITE_API_URL)
  components/ui/       → Button, Card, Badge, Input, Alert, Skeleton, PageHeader
  components/layout/   → Sidebar, Header
  pages/               → Dashboard, Proyectos, ProyectoDetalle, Beneficiarios, etc.
  pages/roles/         → EstudianteDashboard, DocenteDashboard, DirectivoDashboard
  lib/utils.ts         → clsx + tailwind-merge helper
```

## Key Business Rules (Ley 30220)
- **Ciclo mínimo**: `RSU_Tipo_Proyecto.ciclo_minimo_estudiante` validated before assigning líder
- **Carga no lectiva**: Sum `horas_asignadas` ≤ `carga_no_lectiva_max` (Art.79/86)
- **BPMN transitions**: Only allowed if tuple exists in `RSU_Transicion_Estado` for `id_rol_actor`
- **Encuestas Likert**: No duplicate `(id_proyecto,id_beneficiario)`, beneficiario must be linked, promedio + label `MUY_MALO..MUY_BUENO`
- **Dates**: `inicio < fin`, percentages 0-100, DNI/RUC per `tipo_beneficiario`

## Database
- **Schema**: `db/init.sql` → mounts at `/docker-entrypoint-initdb.d/01-init.sql`
- **Views**: `vw_rsu_proyectos_resumen`, `vw_rsu_satisfaccion_dimension`, `vw_rsu_cobertura_anual`, `vw_rsu_trazabilidad_aprobacion`
- **Timezone**: America/Lima (configured in DSN and Docker)

## Environment Variables
| Variable | Default | Notes |
|----------|---------|-------|
| `POSTGRES_USER` | `undc` | Docker DB user |
| `POSTGRES_PASSWORD` | `undc2026` | Docker DB password |
| `POSTGRES_DB` | `undc_rsu` | Database name |
| `DB_HOST` | `postgres` | Use `127.0.0.1` for local non-Docker |
| `JWT_SECRET` | `undc-rsu-super-secret-2026` | Change in production |
| `VITE_API_URL` | `` (empty) | Empty = proxy via nginx; set `http://localhost:8080` for direct |

## API Endpoints (Key)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Mock: `{correo, password}` (123456 / undc2026) |
| GET | `/api/v1/dashboard/kpis` | SUNEDU/SINEACE KPIs |
| GET | `/api/v1/catalogos/*` | tipos-proyecto, lineas-accion, estados (16), roles-actor, preguntas |
| CRUD | `/api/v1/{facultades,escuelas,ciclos,docentes,estudiantes}` | Modules 1-2 |
| POST | `/api/v1/proyectos` | Creates in `BORRADOR` (validates ciclo mínimo) |
| GET | `/api/v1/proyectos?search=&estado=&escuela=` | Paginated list |
| POST | `/api/v1/proyectos/:id/transicion` | BPMN validated against `RSU_Transicion_Estado` |
| POST | `/api/v1/asignaciones/docente` | Validates carga no lectiva Art.86 |
| POST | `/api/v1/encuestas/beneficiario` | Likert 1-5, promedio + deduplication |

## Testing / Linting
- **Backend**: `go vet ./...` (no test files present)
- **Frontend**: `npm run lint` (ESLint), `npm run build` (tsc + vite build)

## Common Gotchas
- Backend expects **PostgreSQL 18** (not MySQL) — DSN uses `sslmode=disable TimeZone=America/Lima`
- Frontend proxy in `vite.config.ts` redirects `/api` and `/uploads` to `http://localhost:8080`
- Docker Compose uses `postgres` hostname; local dev needs `DB_HOST=127.0.0.1`
- Uploads served statically at `/uploads` (backend) and proxied (frontend)
- JWT auth is mocked — `authH.Login` accepts any correo with password `123456` or `undc2026`