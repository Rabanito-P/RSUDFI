# UNDC — Sistema de Gestión RSU (Responsabilidad Social Universitaria)

> Base legal: Ley 30220 Art. 124-125 · SUNEDU Indicador 29 · SINEACE Estándar 25 — Cañete, Lima

Sistema fullstack para gestión del ciclo de vida completo de los proyectos de Responsabilidad Social Universitaria (RSU) de UNDC Cañete.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| **Backend** | Go 1.22 · Gin · GORM · PostgreSQL 18 |
| **Frontend** | React 18 · Vite · TypeScript · Tailwind · Recharts · Lucide |
| **Base de datos** | PostgreSQL 18 (Docker) |
| **Auth** | JWT HS256 + bcrypt contra tabla `RSU_Usuario` |
| **Contenedores** | Docker Compose (postgres + backend + frontend) |

---

## Quick Start

```bash
# 1. Configurar (opcional, hay defaults)
cp .env.example .env

# 2. Levantar todo el stack
docker compose up --build -d

# 3. Verificar
docker compose ps
# Frontend:  http://localhost:5173
# Backend:   http://localhost:8080/health
# Swagger:   http://localhost:8080/swagger/index.html  (o http://localhost:5173/swagger/index.html)
```

### Desarrollo local (sin Docker para backend/frontend)

```bash
docker compose up postgres -d     # solo la BD (carga init.sql + seed_demo.sql)
cd backend && cp .env.example .env   # DB_HOST=127.0.0.1
go run ./cmd/server
cd frontend && npm install && npm run dev   # http://localhost:5173
```

### Resetear la base de datos (aplica seed demo desde cero)

```bash
docker compose down -v && docker compose up -d
```

---

## Arquitectura (Clean Architecture — backend)

```
cmd/server/main.go            → entrypoint
internal/
  config/                     → env + DSN (TimeZone America/Lima)
  domain/                     → entidades GORM (1 archivo por dominio)
  dto/                        → request/response + binding tags
  repository/                 → acceso a datos (1 repo por entidad)
  service/                    → reglas de negocio (BPMN, ciclo mínimo, carga no lectiva, Likert)
  handler/                    → controllers HTTP
  router/                     → rutas /api/v1 + Swagger
  middleware/                 → CORS, Logger, Auditoría, JWT
  auth/                       → DBProvider (bcrypt + JWT, sin mocks)
  storage/                    → almacenamiento local de archivos
pkg/database, pkg/utils
```

**Flujo:** `router → middleware (CORS/Logger/Audit/Auth) → handler (bind DTO) → service (reglas) → repository (GORM) → PostgreSQL`

---

## Estructura del proyecto

```
.
├── db/
│   ├── init.sql              # Schema + catálogos + 16 estados + 12 roles + transiciones + índices
│   └── seed_demo.sql         # Datos demo (usuarios, proyectos, equipos, beneficiarios…)
├── backend/                  # Go 1.22 + Gin + GORM
├── frontend/                 # React 18 + Vite + TS + Tailwind
├── HU_RSU.md                 # 62 Historias de Usuario consolidadas
├── docker-compose.yml
└── README.md
```

---

## Autenticación (sin mocks)

Login real contra la tabla `RSU_Usuario` (bcrypt + JWT):

| Correo | Rol actor | Tipo |
|--------|-----------|------|
| estudiante@undc.edu.pe | ESTUDIANTE_PROP | Estudiante |
| ejecutor@undc.edu.pe | ESTUDIANTE_EJEC | Estudiante |
| docente@undc.edu.pe | DOCENTE_RESP | Docente |
| colaborador@undc.edu.pe | DOCENTE_COLAB | Docente |
| escuela@undc.edu.pe | DIR_ESCUELA | Authority |
| comite@undc.edu.pe | COMITE_PS | Authority |
| rsfacultad@undc.edu.pe | DIR_RS_FACULTAD | Authority |
| consejo@undc.edu.pe | CONSEJO_FACULTAD | Authority |
| departamento@undc.edu.pe | DIR_DEPTO | Authority |
| central@undc.edu.pe | DIR_CENTRAL_RS | Authority |
| abastecimiento@undc.edu.pe | UNIDAD_ABAST | Authority |
| calidad@undc.edu.pe | COMITE_CALIDAD | Authority |
| admin@undc.edu.pe | ADMIN | Authority |

**Password de todos: `undc2026`** (hash bcrypt en `db/seed_demo.sql`)

Los 13 accesos del formulario de login coinciden 1:1 con los usuarios de `RSU_Usuario`.

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"estudiante@undc.edu.pe","password":"undc2026"}'
```

Respuesta: `{token, id, persona_id, rol, rol_actor, rol_actor_id, tipo_actor, nombre, correo}`

- `id` → `RSU_Usuario.id`
- `persona_id` → `Docente.id` o `Estudiante.id` (usa este en `/docentes/:id` y `/estudiantes/:id`)

Todos los demás endpoints requieren `Authorization: Bearer <token>`. Si el token expira o es inválido, la API responde `401` y el frontend cierra la sesión automáticamente y redirige al login.

---

## Base de datos

### Catálogos

- **17 estados** BPMN: `BORRADOR` → `EN_REVISION_ESCUELA` → `CON_VB_ESCUELA` → `EN_PRIORIZACION_FACULTAD` → `EN_DICTAMEN_CONSEJO` → `APROBADO_CON_RESOLUCION` → `EN_ASIGNACION_CARGA` → `REGISTRADO_OFICIAL` → `EN_EJECUCION` → `EN_MONITOREO` → `INFORME_FINAL_PRESENTADO` → `CON_CONFORMIDAD_ESCUELA` → `CERRADO` → `EN_EVALUACION_IMPACTO` → `EVALUACION_VALIDADA` → `REPORTADO_SUNEDU` (+ `RECHAZADO`)
- **12 roles actor**: DOCENTE_RESP, DOCENTE_COLAB, ESTUDIANTE_PROP, ESTUDIANTE_EJEC, DIR_ESCUELA, COMITE_PS, DIR_RS_FACULTAD, CONSEJO_FACULTAD, DIR_DEPTO, DIR_CENTRAL_RS, UNIDAD_ABAST, COMITE_CALIDAD (+ ADMIN)
- **5 modalidades**: SSU, PEP_FINANCIADO, PEP_AUTOFINANCIADO, VOLUNTARIADO, PUBLICACION_CIENTIFICA
- **Transiciones BPMN**: tuplas `(estado_origen, estado_destino, rol_actor)` — una transición solo es válida si existe la tupla
- **4 vistas**: `vw_rsu_proyectos_resumen`, `vw_rsu_trazabilidad_aprobacion`, `vw_rsu_satisfaccion_dimension`, `vw_rsu_cobertura_anual`
- **16 parámetros** de configuración + ~120 índices de optimización

### Seed demo (verificado)

| Tabla | Registros |
|-------|-----------|
| RSU_Proyecto | 5 |
| Estudiante / Docente | 4 / 5 |
| RSU_Usuario | 12 |
| RSU_Beneficiario / RSU_Proyecto_Beneficiario | 11 / 11 |
| RSU_Entregable | 8 |
| RSU_Actividad_Campo | 5 |
| RSU_Flujo_Aprobacion | 21 |
| RSU_Notificacion | 29 |
| RSU_Presupuesto_Movimiento | 5 |
| RSU_Encuesta_Beneficiario | 3 |

---

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Login (bcrypt + JWT) |
| GET | `/api/v1/auth/me` | Perfil autenticado |
| GET | `/api/v1/dashboard/kpis` | KPIs SUNEDU/SINEACE |
| GET | `/api/v1/catalogos/*` | estados, roles, tipos, líneas, preguntas P01-P06, transiciones |
| CRUD | `/api/v1/facultades`, `/escuelas`, `/ciclos`, `/docentes`, `/estudiantes` | Estructura y personas |
| POST | `/api/v1/proyectos` | Crear proyecto (BORRADOR, valida ciclo mínimo) |
| GET | `/api/v1/proyectos?search=&estado=&escuela=` | Lista paginada |
| GET | `/api/v1/proyectos/resumen` | Vista resumen |
| GET | `/api/v1/proyectos/:id/historial` | Trazabilidad de aprobaciones |
| POST | `/api/v1/proyectos/:id/transicion` | Transición BPMN validada por rol. Acepta `estado_destino` (código) o lo resuelve solo si hay una única opción válida |
| GET | `/api/v1/estudiantes/:id/proyectos` | Proyectos del estudiante (aislamiento) |
| GET | `/api/v1/docentes/:id/proyectos` | Proyectos asesorados |
| POST | `/api/v1/asignaciones/docente` | Valida carga no lectiva (Art.86) |
| POST/GET | `/api/v1/beneficiarios`, `/proyectos/:id/beneficiarios` | Padrón y vinculación |
| POST/GET | `/api/v1/actividades`, `/actividades/:id/fotos` | Ejecución y evidencias |
| POST/GET | `/api/v1/monitoreos` | Monitoreo in situ |
| POST/GET | `/api/v1/entregables`, `/proyectos/:id/entregables/registrar` | Entregables (PDF) |
| PATCH | `/api/v1/entregables/:id` | Verificar (APROBADO/OBSERVADO) |
| POST | `/api/v1/documentos/upload` | Subida de documentos |
| POST/GET | `/api/v1/encuestas/beneficiario` | Likert 1-5 con promedio |
| POST/GET | `/api/v1/presupuesto/movimientos` | Presupuesto (Art.125) |
| POST/GET | `/api/v1/constancias` | Solicitudes de constancia |
| GET/POST/PATCH | `/api/v1/notificaciones*` | Notificaciones por rol |
| GET | `/swagger/index.html` | Swagger UI |

---

## Variables de entorno

### `.env` (raíz — Docker Compose)

```env
POSTGRES_USER=undc
POSTGRES_PASSWORD=undc2026
POSTGRES_DB=undc_rsu
POSTGRES_PORT=5432
BACKEND_PORT=8080
FRONTEND_PORT=5173
GIN_MODE=release
JWT_SECRET=undc-rsu-super-secret-2026
VITE_API_URL=          # vacío = proxy relativo vía nginx
UPLOAD_DIR=/app/uploads
TZ=America/Lima
```

### `backend/.env` (desarrollo local)

```env
PORT=8080
DB_HOST=127.0.0.1      # 'postgres' dentro de Docker
DB_PORT=5432
DB_USER=undc
DB_PASS=undc2026
DB_NAME=undc_rsu
JWT_SECRET=undc-rsu-super-secret-2026
UPLOAD_DIR=./uploads
```

---

## Reglas de negocio implementadas (Ley 30220)

- **Ciclo mínimo** — `RSU_Tipo_Proyecto.ciclo_minimo_estudiante` validado al inscribir
- **Carga no lectiva** — `SUM(horas_asignadas) ≤ carga_no_lectiva_max` (Art.79/86)
- **BPMN** — transición válida solo si existe la tupla en `RSU_Transicion_Estado` para el rol
- **Encuestas Likert** — sin duplicados `(id_proyecto, id_beneficiario)`, beneficiario vinculado, promedio + calificación
- **Aislamiento del estudiante** — solo accede a proyectos donde es líder o miembro activo
- **Equipo mínimo** — 2 estudiantes para registrar entregables
- **Límites** — máx 5 estudiantes/proyecto, 2 justificaciones, 5 fotos/actividad
- **Archivos** — entregables solo PDF (≤32MB), fotos JPG/PNG (≤5MB)
- **Presupuesto** — 2% del presupuesto institucional (Art.125)

---

## Comandos de verificación

```bash
# Backend
cd backend
go vet ./...
go build ./cmd/server
swag init -g cmd/server/main.go -o docs --parseDependency --parseInternal

# Frontend
cd frontend
npm run lint
npm run build

# Docker
docker compose ps
docker compose logs -f backend
docker compose restart backend
```

---

## Módulos frontend

- **Dashboard** — KPIs, gráficos por estado/facultad, satisfacción Likert
- **Proyectos** — lista con filtros y búsqueda, creación, expediente con tabs
- **Bandeja** — aprobación por rol (BPMN) con acciones APROBADO/OBSERVADO
- **Actividades / Evidencias** — programación, ejecución, fotos, asistencia
- **Entregables** — subida de PDF por orden, verificación docente/directivo
- **Beneficiarios** — padrón, vinculación a proyectos
- **Presupuesto** — movimientos, ejecución y vouchers
- **Encuestas** — aplicación Likert P01-P06
- **Monitoreo** — registro de monitoreos in situ
- **Personas / Estructura** — docentes, estudiantes, facultades, escuelas, ciclos
- **Roles** — dashboards por Estudiante / Docente / Directivo

> UI: sidebar `undc-700` (#1b5e20), header con notificaciones, tarjetas `rounded-2xl`, Tailwind, Recharts, Lucide.

---

## Historias de Usuario

Las 62 HU consolidadas están en [`HU_RSU.md`](./HU_RSU.md): 11 épicas, matriz de 12 roles, mapeo HU → endpoint → tabla, y 35 reglas de negocio.

---

## Gotchas

- PostgreSQL **18** (no MySQL) — DSN con `sslmode=disable TimeZone=America/Lima`
- Docker Compose usa hostname `postgres`; en local `DB_HOST=127.0.0.1`
- Uploads servidos en `/uploads` (backend) y proxied por nginx
- El password del seed es `undc2026` (hash bcrypt); cambiarlo implica regenerar el hash
- Los archivos `db/init.sql` y `db/seed_demo.sql` solo se ejecutan en el **primer** arranque del volumen (para reaplicar: `docker compose down -v`)
- Swagger se sirve tanto en `:8080/swagger` como en `:5173/swagger` (proxy nginx)

---

Hecho para UNDC Cañete — RSU como función esencial y obligatoria (Art.124).