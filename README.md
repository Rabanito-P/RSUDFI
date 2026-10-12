# UNDC — Sistema de Gestión RSU

**Responsabilidad Social Universitaria · Facultad de Ingeniería · UNDC Cañete**

> Marco legal: Ley N.º 30220, Art. 124-125 · Ley Universitaria · SUNEDU Indicador 29 · SINEACE Estándar 25

---

## Descripción

Plataforma fullstack que administra el ciclo de vida completo de los proyectos de Responsabilidad Social Universitaria, desde la propuesta en borrador hasta el reporte a SUNEDU. El sistema implementa el flujo de aprobación institucional, la ejecución de actividades de campo con evidencias, la evaluación del impacto en beneficiarios y la trazabilidad de cada transición.

**Qué resuelve**

- Flujo BPMN de 17 estados con control de transiciones por rol.
- Publicación centralizada de los 7 formatos oficiales (Word/Excel) y su trazabilidad por etapa.
- Interpretación automática de la planificación de actividades desde Excel.
- Registro de ejecución, evidencias fotográficas y cálculo de horas acumuladas.
- Aplicación y consolidación de encuestas Likert por dimensión.
- Indicadores SUNEDU / SINEACE y reporte de memoria anual.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Go 1.22 · Gin · GORM · PostgreSQL 18 |
| Frontend | React 18 · Vite · TypeScript · Tailwind CSS · Recharts · Lucide React |
| Base de datos | PostgreSQL 18 (Alpine) |
| Autenticación | JWT HS256 + bcrypt (tabla `RSU_Usuario`) |
| Documentación API | Swagger / OpenAPI 2.0 (swaggo) |
| Contenedores | Docker Compose (postgres · backend · frontend/nginx) |

---

## Inicio rápido

```bash
# Levantar el stack completo
cp .env.example .env       # opcional: tiene valores por defecto
docker compose up --build -d

# Verificar
docker compose ps
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8080/health |
| API Docs | http://localhost:5173/swagger/index.html · http://localhost:8080/swagger/index.html |

### Acceso de demostración

Contraseña para todas las cuentas: **`undc2026`**

| Correo | Rol | Función |
|--------|-----|---------|
| `estudiante@undc.edu.pe` | Estudiante proponente | Propone y ejecuta proyectos |
| `ejecutor@undc.edu.pe` | Estudiante ejecutor | Miembro del equipo de campo |
| `docente@undc.edu.pe` | Docente responsable | Asesora y verifica entregables |
| `escuela@undc.edu.pe` | Director de escuela | Revisa y otorga visto bueno |
| `rsfacultad@undc.edu.pe` | Director RSU de facultad | Prioriza y registra proyectos |
| `consejo@undc.edu.pe` | Consejo de facultad | Dictamina y aprueba |
| `admin@undc.edu.pe` | Administrador | Usuarios, permisos y formatos |

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@undc.edu.pe","password":"undc2026"}'
```

La respuesta entrega `token`, `id`, `persona_id`, `rol`, `rol_actor` y `nombre`. El campo `persona_id` es el identificador real de la persona (`Docente.id` o `Estudiante.id`) y debe usarse en las rutas `/docentes/:id` y `/estudiantes/:id`.

### Desarrollo local

```bash
docker compose up postgres -d            # solo la base de datos
cd backend  && cp .env.example .env      # DB_HOST=127.0.0.1
go run ./cmd/server
cd frontend && npm install && npm run dev
```

### Resetear la base de datos

```bash
docker compose down -v && docker compose up -d
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (React 18)                       │
│   páginas · componentes UI · contextos · hooks · cliente axios   │
└───────────────────────────────┬─────────────────────────────────┘
                                │  HTTP + Bearer JWT
┌───────────────────────────────▼─────────────────────────────────┐
│                     NGINX (proxy / seguridad)                   │
│          /api → backend:8080      /uploads → volumen            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    BACKEND (Go 1.22 + Gin)                      │
│                                                                 │
│   router ──► middleware ──► handler ──► service ──► repository   │
│              CORS/Headers     bind DTO    reglas      GORM      │
│              RateLimit                   negocio       │        │
│              Auth JWT                                   │        │
│              Audit                                       │        │
└───────────────────────────────────────────────────────────────┬──┘
                                                                │
                        ┌───────────────────────────────────────┴──────┐
                        ▼                                              ▼
              ┌──────────────────┐                      ┌────────────────────────┐
              │  PostgreSQL 18   │                      │  Almacenamiento        │
              │  51 tablas       │                      │  uploads/ · documentos │
              │  4 vistas        │                      │  · formatos/           │
              └──────────────────┘                      └────────────────────────┘
```

La arquitectura interna del backend sigue **Clean Architecture**: las dependencias apuntan siempre hacia el dominio, nunca al revés. El handler no contiene reglas de negocio y el repository no conoce HTTP.

Detalle completo en **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

---

## Estructura del repositorio

```
.
├── backend/
│   ├── cmd/server/          # entrypoint + Swagger
│   ├── internal/
│   │   ├── config/          # variables de entorno y DSN
│   │   ├── domain/          # entidades GORM (una por archivo)
│   │   ├── dto/             # request/response con validación
│   │   ├── repository/      # acceso a datos (uno por entidad)
│   │   ├── service/         # reglas de negocio
│   │   ├── handler/         # controllers HTTP (28)
│   │   ├── router/          # 114 rutas /api/v1
│   │   ├── middleware/      # CORS, headers, rate limit, JWT, auditoría
│   │   ├── auth/            # proveedor de autenticación
│   │   └── storage/         # almacenamiento local de archivos
│   ├── docs/                # Swagger generado (85 operaciones)
│   └── documentos/          # plantillas y lector Python de planificación
├── frontend/
│   ├── src/
│   │   ├── api/             # cliente HTTP y manejo de sesión
│   │   ├── components/      # UI base y layout
│   │   ├── context/         # autenticación y estado global
│   │   ├── hooks/           # hooks reutilizables
│   │   ├── lib/             # utilidades, roles y permisos
│   │   └── pages/           # 32 pantallas
│   └── nginx.conf           # proxy, cabeceras de seguridad
├── db/
│   ├── init.sql             # esquema, catálogos, 17 estados, 22 transiciones, 7 formatos
│   └── seed_demo.sql        # datos de demostración y permisos por usuario
├── documentos/plantillas/   # formatos Word/Excel de fábrica
├── docker-compose.yml
└── HU_RSU.md                # 62 historias de usuario
```

---

## Base de datos

**PostgreSQL 18 · 51 tablas · 4 vistas · huso horario America/Lima**

### Modelo por dominios

| Dominio | Tablas principales |
|---------|--------------------|
| Estructura | `Facultad`, `Escuela`, `Ciclo_Academico` |
| Personas | `Docente`, `Estudiante`, `Estudiante_Ciclo`, `Persona` |
| Acceso | `RSU_Usuario`, `RSU_Rol_Actor`, `RSU_Usuario_Permiso` |
| Proyecto | `RSU_Proyecto`, `RSU_Tipo_Proyecto`, `RSU_Linea_Accion`, `RSU_Proyecto_Rol` |
| Flujo | `RSU_Estado_Proyecto`, `RSU_Transicion_Estado`, `RSU_Flujo_Aprobacion` |
| Ejecución | `RSU_Actividad_Campo`, `RSU_Actividad_Foto`, `RSU_Entregable` |
| Impacto | `RSU_Beneficiario`, `RSU_Proyecto_Beneficiario`, `RSU_Encuesta_Beneficiario`, `RSU_Respuesta_Encuesta` |
| Finanzas | `RSU_Presupuesto_Movimiento` |
| Formatos | `RSU_Formato` (catálogo fijo de 7) |
| Auditoría | `RSU_Auditoria`, `RSU_Notificacion` |

### Flujo BPMN (17 estados)

```
BORRADOR → EN_REVISION_ESCUELA → CON_VB_ESCUELA → EN_PRIORIZACION_FACULTAD
→ EN_DICTAMEN_CONSEJO → APROBADO_CON_RESOLUCION → EN_ASIGNACION_CARGA
→ REGISTRADO_OFICIAL → EN_EJECUCION → EN_MONITOREO → INFORME_FINAL_PRESENTADO
→ CON_CONFORMIDAD_ESCUELA → CERRADO → EN_EVALUACION_IMPACTO
→ EVALUACION_VALIDADA → REPORTADO_SUNEDU        (RECHAZADO: salida de error)
```

Una transición solo es válida si existe la tupla `(estado_origen, estado_destino, rol_actor)` en `RSU_Transicion_Estado`. El backend rechaza cualquier cambio de estado que no esté autorizado para el rol del token.

### Roles del sistema (6)

| Rol actor | Alcance |
|-----------|---------|
| `ESTUDIANTE_PROP` | Propone, ejecuta y registra evidencias |
| `ESTUDIANTE_EJEC` | Miembro del equipo de campo |
| `DOCENTE_RESP` | Asesoría, verificación de entregables |
| `DIR_ESCUELA` | Revisión y visto bueno de escuela |
| `DIR_RS_FACULTAD` | Priorización facultad, reporte SUNEDU |
| `CONSEJO_FACULTAD` | Dictamen y aprobación con resolución |
| `ADMIN` | Administración del sistema sin intervenir en el flujo |

### Datos de demostración

| Entidad | Registros |
|---------|-----------|
| Proyectos | 5 |
| Estudiantes / Docentes | 5 / 5 |
| Usuarios | 8 |
| Beneficiarios | 11 |
| Entregables | 8 |
| Actividades de campo | 5 |
| Transiciones BPMN | 22 |
| Permisos por usuario | 102 |
| Formatos publicados | 7 |

---

## API REST

114 rutas registradas · 85 operaciones documentadas en Swagger · base `/api/v1`

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Inicio de sesión (bcrypt + JWT) |
| GET | `/auth/me` | Perfil del token activo |
| POST | `/registro/estudiante` | Registro público de estudiante (limitado) |

### Catálogos y estructura

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/catalogos/estados` | 17 estados del flujo |
| GET | `/catalogos/roles-actor` | Roles del sistema |
| GET | `/catalogos/tipos-proyecto` | Modalidades y ciclo mínimo |
| GET | `/catalogos/preguntas` | Preguntas Likert P01-P06 |
| GET | `/catalogos/transiciones` | Transiciones válidas por rol |
| CRUD | `/facultades`, `/escuelas`, `/ciclos` | Estructura académica |
| CRUD | `/docentes`, `/estudiantes` | Padrón de personas |

### Proyectos

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/proyectos` | Crear en `BORRADOR` (valida ciclo mínimo) |
| GET | `/proyectos?search=&estado=&escuela=` | Lista paginada |
| GET | `/proyectos/:id` | Expediente completo |
| GET | `/proyectos/:id/historial` | Trazabilidad de aprobaciones |
| POST | `/proyectos/:id/transicion` | Transición BPMN validada por rol |
| POST | `/proyectos/:id/participantes` | Inscripción del equipo |

### Ejecución

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/actividades` | Actividades de campo |
| POST | `/actividades/planificacion` | Carga masiva desde Excel |
| POST | `/actividades/planificacion/preview` | Previsualización antes de guardar |
| POST | `/actividades/:id/fotos` | Evidencia fotográfica con etapa |
| GET | `/actividades/del-dia` | Agenda del estudiante en sesión |
| POST/GET | `/entregables` | Entregables en PDF |
| PATCH | `/entregables/:id` | Aprobación u observación |

### Evaluación y seguimiento

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST/GET | `/beneficiarios` | Padrón de beneficiarios |
| GET | `/proyectos/:id/encuestas` | Resultados consolidados Likert |
| POST | `/encuestas/beneficiario` | Aplicación de encuesta |
| POST/GET | `/monitoreos` | Monitoreo in situ |
| POST/GET | `/presupuesto/movimientos` | Ejecución presupuestal |
| GET | `/dashboard/kpis` | Indicadores SUNEDU / SINEACE |

### Formatos oficiales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/formatos` | Catálogo de 7 formatos |
| GET | `/formatos/:codigo/descargar` | Descarga del archivo vigente |
| POST | `/formatos/:codigo/archivo` | Reemplazar archivo (solo ADMIN) |
| DELETE | `/formatos/:codigo/archivo` | Restaurar al original (solo ADMIN) |

Códigos del catálogo: `PROPUESTA`, `PLANIFICACION`, `PRIMER_ENTREGABLE`, `SEGUNDO_ENTREGABLE`, `TERCER_ENTREGABLE`, `ENCUESTA`, `INFORME_FINAL`.

### Administración

| Método | Ruta | Descripción |
|--------|------|-------------|
| CRUD | `/usuarios` | Gestión de cuentas (solo ADMIN) |
| PUT | `/usuarios/:id/permisos` | Activar o desactivar funciones |
| GET | `/auditoria` | Registro de acciones (solo ADMIN) |
| GET | `/configuracion` | Parámetros del sistema |
| GET/POST | `/justificaciones`, `/modificaciones-informe` | Trámites del estudiante |

---

## Variables de entorno

### `.env` en la raíz (Docker Compose)

```env
POSTGRES_USER=undc
POSTGRES_PASSWORD=undc2026
POSTGRES_DB=undc_rsu
POSTGRES_PORT=5432
BACKEND_PORT=8080
FRONTEND_PORT=5173
GIN_MODE=release
JWT_SECRET=cambiar-en-produccion-minimo-32-caracteres
CORS_ORIGINS=http://localhost:5173,http://localhost:8080
VITE_API_URL=              # vacío = proxy relativo vía nginx
TZ=America/Lima
```

### `backend/.env` (desarrollo local)

```env
PORT=8080
DB_HOST=127.0.0.1          # 'postgres' dentro de Docker
DB_PORT=5432
DB_USER=undc
DB_PASS=undc2026
DB_NAME=undc_rsu
JWT_SECRET=cambiar-en-produccion
UPLOAD_DIR=./uploads
```

El backend valida la configuración al arrancar: en modo `release` rechaza un `JWT_SECRET` ausente o menor a 32 caracteres.

---

## Reglas de negocio

| Regla | Implementación |
|-------|----------------|
| Ciclo mínimo del estudiante | `ciclo_numerico ≥ ciclo_minimo_estudiante` al inscribir |
| Carga no lectiva | `SUM(horas_asignadas) ≤ carga_no_lectiva_max` (Art. 79/86) |
| Transiciones BPMN | Solo si existe la tupla en `RSU_Transicion_Estado` para el rol del token |
| Encuestas Likert | Sin duplicados `(id_proyecto, id_beneficiario)`, beneficiario vinculado |
| Aislamiento de datos | El estudiante solo accede a sus proyectos; el docente a los que asesora |
| Equipo de proyecto | Mínimo 1 participante, máximo 5 |
| Justificación de faltas | Máximo 2 por estudiante; observar exige motivo |
| Entregables | Solo PDF (≤ 32 MB) |
| Evidencia fotográfica | JPG/PNG (≤ 5 MB), máximo 5 por actividad |
| Identidad en subidas | El `id_usuario_subida` sale del token, nunca del cuerpo de la petición |
| Formatos | Catálogo fijo de 7; la extensión debe coincidir con el tipo declarado |

---

## Seguridad

- **Autenticación**: bcrypt + JWT HS256 con `iss`, `aud`, `nbf`, expiración de 8 horas y validación estricta de algoritmo (`jwt.WithValidMethods`).
- **Mitigación de timing**: comparación contra hash ficticio cuando el correo no existe.
- **CORS**: lista blanca configurable mediante `CORS_ORIGINS`.
- **Cabeceras HTTP**: `X-Frame-Options: DENY`, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, CSP y `Cache-Control: no-store`.
- **Rate limiting**: 10 intentos por minuto en login, 5 por minuto en registro público, respuestas `429`.
- **Límite de cuerpo**: rechazo de peticiones que superen el tamaño máximo permitido.
- **Rutas de archivo**: `filepath.Base` sobre cada nombre, allowlist de plantillas y almacenamiento fuera del árbol servido.
- **Integridad**: hash SHA-256 persistido por cada archivo subido.
- **Auditoría**: middleware que registra acción, entidad, usuario e IP.

---

## Comandos de verificación

```bash
# Backend
cd backend
go vet ./...
go build ./cmd/server

# Regenerar Swagger tras cambiar handlers
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

## Módulos funcionales

| Módulo | Descripción |
|--------|-------------|
| Dashboard | KPIs SUNEDU/SINEACE, gráficos por estado y satisfacción |
| Proyectos | Búsqueda, filtros, expediente con pestañas |
| Crear proyecto | Descarga de formatos, carga de PDF y Excel, equipo |
| Bandeja | Aprobaciones por rol con acciones del flujo BPMN |
| Ejecución | Actividades, cronómetro, etapas y evidencias |
| Entregables | Subida de PDF por orden y verificación |
| Encuestas | Resultados por pregunta, dimensión y beneficiario |
| Beneficiarios | Padrón y vinculación a proyectos |
| Presupuesto | Movimientos y ejecución |
| Monitoreo | Registro de visitas in situ |
| Personas / Estructura | Docentes, estudiantes, facultades, escuelas, ciclos |
| Administración | Usuarios, permisos por módulo y formatos oficiales |
| Reportes | Memoria anual e indicadores |

---

## Notas de implementación

- PostgreSQL **18** (no MySQL); el DSN usa `sslmode=disable TimeZone=America/Lima`.
- Docker Compose usa el hostname `postgres`; en desarrollo local usar `DB_HOST=127.0.0.1`.
- Los scripts SQL en `db/` solo se ejecutan en el **primer** arranque del volumen. Para reaplicarlos: `docker compose down -v`.
- Los archivos subidos se sirven en `/uploads` y las plantillas en `/plantillas/:archivo`, ambos detrás de allowlist.
- La lectura de la planificación Excel se apoya en `documentos/lector_excel.py`; el contenedor del backend instala `python3` y `py3-openpyxl`.
- Swagger se publica tanto en `:8080/swagger` como en `:5173/swagger` (proxy nginx).

---

## Documentación relacionada

- [ARCHITECTURE.md](./ARCHITECTURE.md) — arquitectura detallada, capas y decisiones técnicas
- [HU_RSU.md](./HU_RSU.md) — 62 historias de usuario, épicas y reglas de negocio

---

**UNDC Cañete** — Responsabilidad Social Universitaria como función esencial y obligatoria (Ley N.º 30220, Art. 124).
