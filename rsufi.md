# RSUFI — Requisitos del Sistema de Gestión RSU (Responsabilidad Social Universitaria)

> **Proyecto:** Plataforma de RSU — Nivel Facultad · Universidad Nacional de Cañete (UNDC)
> **Código:** R-M03-RSU-001-PF · **Versión documento:** 1.0 · **Fecha:** Octubre 2026
> **Base legal:** Ley 30220 Art. 124-125 · SUNEDU Indicador 29 · SINEACE Estándar 25 · Reglamento RSU UNDC (R-M03-RSU-001, Versión 04, 14/05/2026)
> **Propósito de este archivo:** Especificación completa (estado actual + requisitos) para **reconstruir un proyecto similar** desde cero.

---

## ÍNDICE

1. [Propósito, alcance y convenciones](#1-propósito-alcance-y-convenciones)
2. [Estado actual del sistema (as-built)](#2-estado-actual-del-sistema-as-built)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Arquitectura](#4-arquitectura)
5. [Requisitos funcionales — Historias de usuario](#5-requisitos-funcionales--historias-de-usuario)
6. [Reglas de negocio (R01–R35)](#6-reglas-de-negocio-r01r35)
7. [Modalidades y flujos](#7-modalidades-y-flujos)
8. [Requisitos no funcionales](#8-requisitos-no-funcionales)
9. [API — inventario de endpoints](#9-api--inventario-de-endpoints)
10. [Plan de implementación (sprints)](#10-plan-de-implementación-sprints)
11. [Definition of Ready / Definition of Done global](#11-definition-of-ready--definition-of-done-global)
12. [Glosario y referencias](#12-glosario-y-referencias)

---

# 1. PROPÓSITO, ALCANCE Y CONVENCIONES

## 1.1 Propósito

Gestionar el **ciclo de vida completo** de los proyectos de Responsabilidad Social Universitaria en la Facultad de Ingeniería de Sistemas (UNDC Cañete): creación, formulación, revisión, aprobación (Director de Escuela → Decano), ejecución, monitoreo, informes, evaluación de impacto (encuestas Likert), cierre con Resolución, y **transferencia a la plataforma de universidad (DRSU/SERUS)**.

## 1.2 Alcance

| En el alcance | Fuera del alcance |
|---|---|
| Creación de proyectos por 5 modalidades (SSU, PEP financiado, PEP autofinanciado, Voluntariado, Publicación Científica) | Evaluación técnica de la DRSU (universidad) |
| Registro de avances, evidencias, informes | Registro en SERUS / SISTEMA RSU (solo transferencia manual) |
| Revisión y aprobación por Director de Escuela y Decano | Emisión de constancias y certificados oficiales (DRSU) |
| Consolidación, aprobación y descarga por el Decano | Consolidación SINEACE/SUNEDU a nivel universidad |
| Transferencia manual a la plataforma de universidad (punto de quiebre) | Publicación en repositorio institucional |

## 1.3 Convenciones del documento

- **SP:** story points en escala Fibonacci (1, 2, 3, 5, 8, 13).
- **Prioridad:** P0 crítica (bloquea el flujo BPMN), P1 alta, P2 media, P3 baja / pendiente.
- **Valor:** Alto / Medio / Bajo para el negocio (cumplimiento normativo = Alto).
- **CA:** criterios de aceptación numerados; la historia se da por terminada solo si se cumplen **todos**.
- **DoD:** Definition of Done por historia; **DoD-global** en §11.
- **Épica → Historias de usuario → Tareas** es la jerarquía de planificación.
- Nomenclatura de tablas/endpoints proviene del código actual (`RSU_*`, `/api/v1/...`).

---

# 2. ESTADO ACTUAL DEL SISTEMA (AS-BUILT)

## 2.1 Inventario de lo que existe hoy

| # | Componente | Estado |
|---|---|---|
| 1 | **Backend** Go 1.22 + Gin + GORM, Clean Architecture (`cmd/server`, `internal/{config,domain,dto,repository,service,handler,router,middleware}`, `pkg/{database,utils}`) | ✅ Compilable (`go vet ./...`, `go build ./cmd/server`) |
| 2 | **Frontend** React 18 + Vite 5 + TypeScript 5.5 + Tailwind 3.4 + Recharts + Lucide (`npm run build` ✓, ~607 kB) | ✅ |
| 3 | **BD** PostgreSQL 18 (Docker) con `db/init.sql`: **48 tablas**, **4 vistas**, seed de catálogos (estados, roles, tipos de proyecto, preguntas P01–P06, notificaciones) | ✅ |
| 4 | **API** ~83 endpoints `/api/v1` (auth, CRUD, BPMN, notificaciones, roles dinámicos, comité, configuración, auditoría) | ✅ |
| 5 | **Flujo BPMN** validado contra `RSU_Transicion_Estado` (solo transiciones permitidas por rol actor) | ✅ |
| 6 | **Vistas SQL**: `vw_rsu_proyectos_resumen`, `vw_rsu_trazabilidad_aprobacion`, `vw_rsu_satisfaccion_dimension`, `vw_rsu_cobertura_anual` | ✅ |
| 7 | **62 HU** mapeadas backend+frontend (`HU_62_COBERTURA.md`) | ✅ (2 con Excel/importación pendiente) |
| 8 | **Documento de diseño funcional** `info/objetivo.txt` V1.1 (módulos M01–M12, reglas R01–R35, roles dinámicos, notificaciones, auditoría, reportes, configuración, presupuesto) | 📐 Diseño (parte migrado a seed V1.1) |
| 9 | **Mapa SERUS/DRSU vista estudiante** (`info/reporte.html`): 9 módulos, 34 campos, 9 tablas | 📐 Referencia de UI estudiante |

## 2.2 Módulos M01–M12 — estado actual

| Módulo | Descripción | Estado |
|---|---|---|
| **M01 Proyectos** | Creación por modalidad, datos generales, línea de acción, ODS, beneficiarios, presupuesto, documentos | ✅ implementado (modalidad en `RSU_Tipo_Proyecto`) |
| **M02 Avances** | Informes de avance, evidencias (≥5 fotos/actividad), asistencia beneficiarios | ✅ (actividades, fotos, asistencia) |
| **M03 Informe Final** | Informe final, encuestas a beneficiarios, informe del docente asesor | ✅ (encuestas P01–P06 Likert) |
| **M04 Comité RSU** | Integrantes, propuesta del Director de Escuela, resolución de designación, período 2 años ratificable | ✅ endpoints CRUD `/comite-rsu` |
| **M05 Indicadores** | 5 indicadores de desempeño (proyectos, % estudiantes, % docentes, % presupuesto, % informes finales) | ✅ KPIs + `RSU_Indicador_Impacto` |
| **M06 Exportación** | Paquete ZIP con PDF de proyectos aprobados (Decano) | 🟡 pendiente |
| **M07 Usuarios** | Roles dinámicos por proyecto (asignación/revocación) | ✅ `/proyectos/:id/roles` |
| **M08 Notificaciones** | Campana en plataforma + correo + push | 🟡 en plataforma ✅; correo/push pendiente |
| **M09 Auditoría** | Registro en BD con IP y user-agent | ✅ `RSU_Auditoria_Log` + middleware |
| **M10 Reportes** | 10 reportes PDF/Excel con acceso por rol | 🟡 vistas ✅; exportación Excel/PDF pendiente |
| **M11 Configuración** | Parámetros del sistema (plazos, mínimos, catálogos, modo mantenimiento) | ✅ `/configuracion` |
| **M12 Presupuesto** | Control del 2% (Ley 30220 Art.125): asignado, ejecutado, por proyecto/escuela, saldo | ✅ movimientos + vouchers |

## 2.3 Decisiones de modelo (duplicidad documentada — importante para replicar)

El código actual convive con **dos modelos de roles/estados**. Quien replante el sistema debe elegir uno:

| Aspecto | Modelo A — BPMN 12 lanes (frontend V3, `utils/permissions.ts`) | Modelo B — V1.1 funcional (`db/init.sql` seed actual) |
|---|---|---|
| Roles | 12: `DOCENTE_RESP, DOCENTE_COLAB, ESTUDIANTE_PROP, ESTUDIANTE_EJEC, DIR_ESCUELA, COMITE_PS, DIR_RS_FACULTAD, CONSEJO_FACULTAD, DIR_DEPTO, DIR_CENTRAL_RS, UNIDAD_ABAST, COMITE_CALIDAD` | 10: `ESTUDIANTE, EGRESADO, DOCENTE_ASESOR, DOCENTE_RESPONSABLE, PRESIDENTE_COMITE_RSU, MIEMBRO_COMITE_RSU, DIRECTOR_ESCUELA, DECANO, COMITE_CALIDAD, ADMINISTRADOR` |
| Estados (16) | Flujo aprobación interno: `BORRADOR→EN_REVISION_ESCUELA→CON_VB_ESCUELA→EN_PRIORIZACION_FACULTAD→EN_DICTAMEN_CONSEJO→APROBADO_CON_RESOLUCION→EN_ASIGNACION_CARGA→REGISTRADO_OFICIAL→EN_EJECUCION→EN_MONITOREO→INFORME_FINAL_PRESENTADO→CON_CONFORMIDAD_ESCUELA→CERRADO→EN_EVALUACION_IMPACTO→EVALUACION_VALIDADA→REPORTADO_SUNEDU` | Flujo por modalidad: `BORRADOR→EN_REVISION_ESCUELA→APROBADO_ESCUELA→EN_REVISION_DECANO→APROBADO_DECANO→EN_EVALUACION_DRSU→APROBADO_DRSU→APROBADO_CONSEJO_UNIV→LISTO_DESCARGA→DESCARGADO_TRANSFERIDO→EN_EJECUCION→EN_MONITOREO→INFORME_FINAL_PRESENTADO→CERRADO→DERIVADO_VP_INVESTIGACION→REGISTRADO_REPOSITORIO` (+ `RECHAZADO` como rebote, orden 99) |
| Modalidades | Implícitas en tipo de proyecto | Explícitas: SSU, PEP_FINANCIADO, PEP_AUTOFINANCIADO, VOLUNTARIADO, PUBLICACION_CIENTIFICA (con `ciclo_minimo_estudiante`, `horas_docente_max`, `requiere_presupuesto`) |
| Recomendación | — | **Usar Modelo B** (alineado a `info/objetivo.txt` V1.1 y al Reglamento RSU); migrar `permissions.ts` a los 10 roles |

## 2.4 Métricas del sistema

- 48 tablas · 4 vistas · ~83 endpoints · 16 estados · 5 modalidades · 10 roles seed · 6 preguntas Likert (P01–P06) · 28 HU detalladas + 34 HU de cobertura adicional (62 total) · 35 reglas de negocio (R01–R35) · 22 modelos oficiales descargables (F-M03.01-RSU-001…019).

---

# 3. STACK TECNOLÓGICO

## 3.1 Backend

| Capa | Tecnología | Versión | Uso |
|---|---|---|---|
| Lenguaje | Go | 1.22 | API REST |
| Framework HTTP | Gin | 1.10.0 | Routing, binding, validación |
| ORM | GORM + driver postgres | 1.25.12 / 1.5.9 | Mapeo 1:1 con las 48 tablas |
| Env | joho/godotenv | 1.5.1 | Configuración por ambiente |
| Validación | go-playground/validator | v10 (indirecto) | DTO binding |
| Estructura | Clean Architecture | — | `domain → dto → repository → service → handler → router` |

## 3.2 Frontend

| Capa | Tecnología | Versión | Uso |
|---|---|---|---|
| Framework | React | 18.3.1 | UI |
| Build | Vite | 5.3.1 | Dev server + build (proxy `/api` → `:8080`) |
| Lenguaje | TypeScript | 5.5.2 | Tipado estricto |
| Routing | react-router-dom | 6.23.0 | Rutas + `RoleGuard` |
| Gráficos | Recharts | 2.12.4 | Dashboards (KPIs, tortas, barras, Likert) |
| UI | Tailwind CSS + PostCSS + Autoprefixer | 3.4.4 | Utilidades; paleta `undc-700 #1b5e20` |
| Iconos | Lucide React | 0.400.0 | Iconografía |
| Utilidades | clsx + tailwind-merge | 2.1.1 / 2.3.0 | `cn()` en `lib/utils.ts` |

## 3.3 Base de datos

- **PostgreSQL 18** (`postgres:18-alpine`), TZ `America/Lima`, UTF8.
- Schema en `db/init.sql` (montado en `/docker-entrypoint-initdb.d/01-init.sql`): DDL + constraints (UNIQUE, CHECK 1–5 Likert) + seed.
- JSONB en `RSU_Auditoria_Log` (valor anterior/nuevo).
- Vistas de lectura para reportes SUNEDU/SINEACE.

## 3.4 DevOps / Infraestructura

| Componente | Detalle |
|---|---|
| Orquestación | Docker Compose (`postgres`, `backend`, `frontend`), red bridge `undc-rsu-net`, volúmenes `pgdata`, `backend_uploads` |
| Backend image | `backend/Dockerfile` (Go), healthcheck `/health`, uploads en `/app/uploads` |
| Frontend image | `frontend/Dockerfile` (Node build → Nginx 1.27), `nginx.conf` con proxy `/api` y `/uploads` → backend |
| Variables | `.env.example`: `POSTGRES_*`, `BACKEND_PORT`, `FRONTEND_PORT`, `JWT_SECRET`, `VITE_API_URL` (vacío = proxy relativo) |
| Auth | JWT mock (`authH.Login` acepta correo + `123456`/`undc2026`) — **reemplazar por LDAP/correo institucional en producción** |

## 3.5 Por qué este stack (justificación para replicar)

- **Go**: binario estático, bajo consumo, ideal para API con validaciones de negocio (BPMN, carga no lectiva) y despliegue simple en Docker.
- **GORM**: esquema 1:1 con dump SQL heredado (`undc_rsu.sql`), migraciones mínimas.
- **React+Vite+TS**: DX rápida, tipado para matriz de permisos compleja (16 estados × 10 roles).
- **Tailwind**: consistencia visual con paleta institucional sin design system propio.
- **PostgreSQL 18**: JSONB para auditoría, vistas para reportes, CHECK constraints para Likert.

---

# 4. ARQUITECTURA

## 4.1 Arquitectura de plataformas (punto de quiebre)

```
┌───────────────────────────────────────────────────────────────┐
│  PLATAFORMA DE FACULTAD (este sistema)                        │
│  • Presidente Comité RSU registra proyectos                   │
│  • Docente Asesor registra avances y evidencias               │
│  • Director de Escuela revisa y aprueba                       │
│  • Decano consolida, aprueba y DESCARGA                       │
│  FIN: Decano descarga el paquete de documentos (ZIP, M06)     │
└───────────────────────────┬───────────────────────────────────┘
                            │ PUNTO DE QUIEBRE
                            │ (descarga + transferencia manual)
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  PLATAFORMA DE UNIVERSIDAD (DRSU / SERUS) — fuera de alcance │
│  • DRSU recibe, evalúa, verifica y aprueba                    │
│  • Registra en SERUS/SISTEMA RSU                              │
│  • Emite constancias y certificados                           │
│  • Consolida para SINEACE / SUNEDU                            │
└───────────────────────────────────────────────────────────────┘
```

El **Decano es el punto de transferencia** (Reglamento RSU Art. 23, 26): consolida, aprueba por Resolución de Decanatura, descarga y transfiere.

## 4.2 Arquitectura backend (Clean Architecture)

```
cmd/server/main.go ─→ arranca Gin, conecta PostgreSQL (pkg/database), monta router
internal/
  config/      → env + DSN (sslmode=disable, TimeZone=America/Lima)
  domain/      → models.go: 30+ entidades 1:1 con tablas SQL
  dto/         → request/response + validaciones (binding tags)
  repository/  → repos GORM por módulo (proyecto, beneficiario, encuesta…)
  service/     → reglas Ley 30220: ciclo mínimo, carga no lectiva (Art.79/86),
                 transición BPMN (RSU_Transicion_Estado), Likert (promedio +
                 calificación MUY_MALO..MUY_BUENO), notificaciones automáticas
  handler/     → controllers Gin (auth, proyecto, transición, notificación…)
  router/      → /api/v1 (~83 rutas), CORS, Logger, AuditMiddleware
  middleware/  → CORS, Logger, Auditoría (escribe RSU_Auditoria_Log)
pkg/database, pkg/utils
```

**Flujo de una petición:** `router → middleware (CORS/Logger/Audit) → handler (bind DTO) → service (reglas de negocio) → repository (GORM) → PostgreSQL`. Los uploads se sirven estáticos en `/uploads`.

## 4.3 Arquitectura frontend

```
src/
  api/client.ts            → instancia HTTP (baseURL = VITE_API_URL o proxy)
  context/AuthContext.tsx  → sesión, rol_actor, permisos
  components/
    layout/                → Sidebar, RoleSidebar (dinámico por rol), Header (campana notificaciones, polling 30s)
    ui/                    → Button, Card, Badge, Input, Alert, Skeleton, Empty, PageHeader
    RoleGuard.tsx, ErrorBoundary.tsx
  pages/                   → Dashboard, Login, Proyectos, CrearProyecto, ProyectoDetalle (tabs: General·Flujo BPMN·Beneficiarios·Actividades·Presupuesto·Documentos·Encuestas·Indicadores), Beneficiarios, Estructura, Actividades, Bandeja, DocenteCarga, DocenteEntregables, Documentos, Encuestas, Monitoreo, Personas, Presupuesto, Reportes, Catalogos, EstudianteConstancias, EstudianteHoras
  pages/roles/             → EstudianteDashboard, DocenteDashboard, DirectivoDashboard
  pages/estudiante/        → AutorizacionImagen, Ejecucion, EncuestaDocente, Evidencias, Fases, Justificacion, ModificarInforme
  utils/permissions.ts     → matriz ejecutable: ESTADOS[16], ROLES, canStudentUploadDocs, canAccessRoute, estudianteProyectosEndpoint
  types/models.ts, lib/utils.ts (cn), hooks/
```

**Aislamiento estudiante (regla clave):** el estudiante **solo** consume `GET /estudiantes/:id/proyectos` (join líder O participante `ACTIVO/INSCRITO`); la ruta `/proyectos` redirige a `/mis-proyectos`; abrir un proyecto ajeno muestra banner rojo "Acceso denegado" y el backend responde 403 en upload.

## 4.4 Modelo de datos (48 tablas por dominio)

| Dominio | Tablas |
|---|---|
| Estructura | `Facultad`, `Escuela`, `Departamento_Academico`, `Ciclo_Academico` |
| Personas | `Docente`, `Estudiante`, `Estudiante_Ciclo` |
| Catálogos RSU | `RSU_Tipo_Proyecto` (5 modalidades), `RSU_Linea_Accion` (Línea 01–05), `RSU_Rol_Proyecto`, `RSU_Rol_Actor` (10), `RSU_Estado_Proyecto` (16), `RSU_Tipo_Documento` (etapa FORMULACION/EJECUCION/EVALUACION/TRANSVERSAL + `obligatorio`), `RSU_Transicion_Estado` (motor BPMN), `RSU_Configuracion` |
| Proyecto | `RSU_Proyecto`, `RSU_Proyecto_Rol`, `RSU_Comite_RSU`, `RSU_Entregable`, `RSU_Asignacion_Docente`, `RSU_Participante_Estudiante`, `RSU_Documento` (hash + tamaño), `RSU_Resolucion`, `RSU_Declaracion_Jurada`, `RSU_Flujo_Aprobacion` (trazabilidad), `RSU_Verificacion`, `RSU_Modificacion_Informe` |
| Ejecución | `RSU_Actividad_Campo`, `RSU_Actividad_Foto`, `RSU_Justificacion_Falta` (máx 2), `RSU_Monitoreo` (% avance slider 0–100), `RSU_Beneficiario` (padrón Cañete), `RSU_Proyecto_Beneficiario`, `RSU_Asistencia_Beneficiario` |
| Presupuesto | `RSU_Presupuesto_Movimiento` (ASIGNACION/EJECUCION/TRANSFERENCIA/DEVOLUCION), `RSU_Pago_Voucher` |
| Impacto | `RSU_Instrumento_Impacto`, `RSU_Encuesta_Satisfaccion` (docente), `RSU_Pregunta_Encuesta` (P01–P06 Likert), `RSU_Encuesta_Beneficiario` (UNIQUE `id_proyecto,id_beneficiario`, promedio + calificación), `RSU_Respuesta_Encuesta` (CHECK 1–5), `RSU_Respuesta_Encuesta_Simple` (1–3), `RSU_Indicador_Impacto` (línea base/meta/% logro), `RSU_Leccion_Aprendida`, `RSU_Reporte_Anual` (2% SUNEDU Ind.29), `RSU_Solicitud_Constancia` |
| Cross | `RSU_Auditoria_Log` (JSONB old/new, IP), `RSU_Notificacion` (`rol_destino` FK → `RSU_Rol_Actor.codigo`) |

**Vistas:** `vw_rsu_proyectos_resumen` (reporte SUNEDU), `vw_rsu_trazabilidad_aprobacion` (timeline BPMN), `vw_rsu_satisfaccion_dimension` (promedio por dimensión Likert), `vw_rsu_cobertura_anual` (indicadores Ind.29: % docentes, % estudiantes, % presupuesto).

## 4.5 Motor de flujo (BPMN)

- `RSU_Estado_Proyecto`: 16 estados con `orden_flujo`, `es_final`, `color_ui` (badges por color).
- `RSU_Transicion_Estado`: tabla de tuplas `(estado_origen, estado_destino, id_rol_actor)` — **una transición solo es válida si existe la tupla**; el servicio `Transicion()` la valida, persiste en `RSU_Flujo_Aprobacion` y dispara notificación `TRANSICION` al actor del estado destino.
- `RECHAZADO` (orden 99) funciona como **rebote al emisor** (R31/R32): el proyecto vuelve a `BORRADOR` para modificaciones y puede reenviarse.

## 4.6 Matriz de permisos (roles × acciones — Modelo B, V1.1)

| Rol | Crear | Editar | Ver | Aprobar | Rechazar | Descargar | Transferir | Configurar |
|---|---|---|---|---|---|---|---|---|
| Estudiante | Sí | Sí | Sí | No | No | No | No | No |
| Egresado | Sí | Sí | Sí | No | No | No | No | No |
| Docente Asesor | Sí | Sí | Sí | Sí | Sí | No | No | No |
| Docente Responsable | Sí | Sí | Sí | No | No | No | No | No |
| Presidente Comité RSU | Sí | Sí | Sí | Sí | Sí | No | No | No |
| Miembro Comité RSU | No | Sí | Sí | No | No | No | No | No |
| Director de Escuela | No | No | Sí | Sí | Sí | No | No | No |
| Decano | No | No | Sí | Sí | Sí | Sí | Sí | No |
| Comité de Calidad | No | No | Sí | No | No | Sí | No | No |
| Administrador | No | No | Sí | No | No | No | No | Sí |

> Los roles son **dinámicos**: un usuario acumula roles por proyecto/modalidad/etapa; el Administrador asigna/revoca (`/proyectos/:id/roles`).

## 4.7 Notificaciones

- `RSU_Notificacion`: `rol_destino` (código de rol), `tipo` (PROYECTO_CREADO, TRANSICION, AVANCE_EQUIPO, ASIGNACION, EVALUACION, REPORTE, PRESUPUESTO…), título, mensaje, `id_proyecto`, `leido`.
- Disparo automático en `service.Create()` y `service.Transicion()`; endpoints `GET /notificaciones`, `/count`, `/counts`, `PATCH /:id/leido`, `/marcar-todas-leidas`.
- Header con campana + polling 30s + badge de no leídas. **Pendiente:** canal correo institucional y push (M08).

## 4.8 Auditoría

`RSU_Auditoria_Log` (solo DB, middleware automático): usuario, proyecto, acción (crear/editar/ver/aprobar/rechazar/descargar/transferir/configurar), tabla e id afectado, `valor_anterior`/`valor_nuevo` JSONB, IP. Eventos auditables: login, logout, creación/edición de proyecto, cambio de estado, aprobación, rechazo, descarga, transferencia, configuración, asignación/revocación de rol. Lectura por `/auditoria` (solo Administrador).

## 4.9 Seguridad

- JWT en mock (password `123456`/`undc2026`) — **pendiente SSO institucional**.
- CORS middleware; uploads validados por formato/tamaño/hash; aislamiento estudiantil en backend (`isMiembro` → 403); validaciones DTO (DNI 8 dígitos, RUC 11, fechas `inicio < fin`, porcentajes 0–100, Likert 1–5).

## 4.10 Quickstart (para replicar el proyecto)

```bash
docker compose up postgres -d        # PostgreSQL 18 con init.sql
cd backend && cp .env.example .env   # DB_HOST=127.0.0.1 si no usas Docker
go mod tidy && go run ./cmd/server   # http://localhost:8080/health
cd frontend && npm install && npm run dev   # http://localhost:5173 (proxy /api→8080)
# o todo en Docker: docker compose up --build -d
```

---

# 5. REQUISITOS FUNCIONALES — HISTORIAS DE USUARIO

> 82 historias: **HU-001…HU-062** (as-built, trazables a `HU_62_COBERTURA.md` / `HU_RSU_V3_MEJORADAS.md`) y **HU-101…HU-120** (nuevas desde `info/objetivo.txt` V1.1 y `info/reporte.html`).
> Convenciones: botón `[TEXTO color ubicación]` · documento `PDF*` = obligatorio · 🔔 = notificación disparada.

## ÉPICA E1 — FORMULACIÓN Y APROBACIÓN (M01)

### HU-001 — Crear proyecto de RSU (BORRADOR)
- **Épica:** E1 · Formulación y aprobación
- **Actor:** ESTUDIANTE (proponente) / DOCENTE_RESPONSABLE / PRESIDENTE_COMITE_RSU según modalidad
- **Descripción:** Como proponente quiero crear un proyecto en borrador con código autogenerado `UNDC-RSU-AAAA-NNN` para iniciar su tramitación.
- **Valor:** Alto — origen del ciclo de vida RSU (Ley 30220 Art.124). **Prioridad:** P0 crítica. **Estimación:** 8 SP
- **Criterios de aceptación:**
  1. Formulario 4 pasos (datos generales, descripción/objetivos, fechas/presupuesto, documentos) con barra de progreso y validación en tiempo real (título 20–300 caracteres, presupuesto >0 y ≤ 50 000, fecha fin > inicio, N° beneficiarios entero >0).
  2. `GUARDAR BORRADOR` guarda sin validar; `ENVIAR A ESCUELA` valida y pasa a `EN_REVISION_ESCUELA`.
  3. Al primer guardado se autogenera el código `UNDC-RSU-2026-NNN`; estado inicial `BORRADOR` editable en totalidad.
  4. Aislamiento: solo el creador (luego miembros invitados) ve el proyecto.
  5. Se registra `RSU_Proyecto`, `RSU_Documento` (etapa FORMULACION, Perfil del Proyecto PDF obligatorio ≤10 MB) y `RSU_Flujo_Aprobacion`; el líder se auto-inscribe como participante ACTIVO.
  6. 🔔 Notificación `PROYECTO_CREADO` al proponente/ejecutor y `ASIGNACION` al docente asesor.
- **Tareas:** BE: `POST /proyectos` + validaciones + autogeneración de código + insert participante; FE: `CrearProyecto.tsx` wizard 4 pasos; QA: casos de límite (presupuesto 0/50 000/50 001, fechas iguales).
- **Definition of Done:** CA1–CA6 verificados; `go vet` y `npm run build` pasan; probado con seed; documentado en README de API.

### HU-002 — Registrar docente asesor
- **Épica:** E1 · **Actor:** ESTUDIANTE_PROP · **Valor:** Alto (R01/R02, Art.21.A) · **Prioridad:** P0 · **Estimación:** 3 SP
- **CA:** 1) Modal lista docentes de la misma escuela con búsqueda por nombre/código; 2) muestra carga disponible = `carga_no_lectiva_max − SUM(horas APROBADAs)`; 3) docente con 0h disponible aparece deshabilitado; 4) al confirmar se actualiza `RSU_Proyecto.id_docente_asesor` y se notifica al docente (correo mock).
- **Tareas:** BE: filtro por escuela + cálculo de carga; FE: modal `Seleccionar Docente Asesor`; QA: docente sin disponibilidad no seleccionable.
- **DoD:** CA cumplidos; tablas `Docente`, `RSU_Proyecto`, `RSU_Asignacion_Docente` actualizadas; build verde.

### HU-003 — Validar ciclo mínimo del estudiante
- **Épica:** E1 · **Actor:** SISTEMA · **Valor:** Alto (Art.21.B, ciclo V–X para SSU) · **Prioridad:** P0 · **Estimación:** 2 SP
- **CA:** 1) Al inscribir, el sistema compara `Estudiante_Ciclo.ciclo_numerico` vs `RSU_Tipo_Proyecto.ciclo_minimo_estudiante` de la modalidad; 2) si no cumple, bloquea y muestra modal "Estudiante no elegible — requiere ciclo ≥ N" y no permite continuar; 3) si cumple, marca `validacion_ciclo=TRUE`; 4) la regla aplica también en `InscribirEstudiante` (no solo al crear).
- **Tareas:** BE: validación en `service.Create` + `InscribirEstudiante`; FE: modal de error; QA: estudiante ciclo III intentando SSU (bloqueo) y ciclo V (paso).
- **DoD:** CA cumplidos; sin fuga de inscripción inválida en DB.

### HU-004 — Enviar proyecto a revisión de Escuela
- **Épica:** E1 · **Actor:** ESTUDIANTE_PROP / DOCENTE_RESPONSABLE · **Valor:** Alto · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Botón `[▶️ ENVIAR A ESCUELA] verde` solo visible en `BORRADOR`; 2) valida que existan los documentos obligatorios de etapa FORMULACION; si falta, muestra modal con la lista pendiente; 3) al enviar cambia a `EN_REVISION_ESCUELA`, crea `RSU_Flujo_Aprobacion` con actor DOCENTE/DIR_ESCUELA; 4) 🔔 `DIRECTOR_ESCUELA` (TRANSICION) + correo con deep link; 5) transición inválida (sin tupla en `RSU_Transicion_Estado`) se rechaza con error explícito.
- **Tareas:** BE: `POST /proyectos/:id/transicion` con validación de tupla; FE: tarjeta de fases con botones contextuales; QA: intentar envío sin documentos.
- **DoD:** CA cumplidos; trazabilidad visible en tab Flujo BPMN; notificación en DB.

### HU-005 — Evaluar viabilidad técnica (Director de Escuela)
- **Épica:** E1 · **Actor:** DIRECTOR_ESCUELA · **Valor:** Alto (R20, Art.22) · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Panel "Viabilidades pendientes" lista proyectos en `EN_REVISION_ESCUELA`; 2) checklist de 5 ítems (viabilidad técnica, presupuesto justificado, no duplicidad, alineado al Plan RS, beneficiarios correctos); 3) `[✅ APROBAR V°B°]` exige adjuntar Informe Técnico de Viabilidad (PDF obligatorio); 4) `[⚠️ OBSERVAR]` y `[❌ RECHAZAR]` requieren observaciones y rebotan al emisor (R31); 5) al aprobar → `APROBADO_ESCUELA`, registra `RSU_Verificacion(VIABILIDAD_TECNICA, NO_DUPLICIDAD)`; 6) 🔔 `COMITE_CALIDAD`/`DECANO` y al creador.
- **Tareas:** BE: transición + `RSU_Verificacion`; FE: panel con checklist y 3 botones; QA: aprobar sin PDF debe fallar.
- **DoD:** CA cumplidos; el Decano solo ve proyectos con V°B° de Escuela (R21).

### HU-006 — Consolidar banco de proyectos (Director RS Facultad / Decano)
- **Épica:** E1 · **Actor:** DIRECTOR_ESCUELA (en Modelo B: consolidación del Decano) · **Valor:** Alto (Art.23) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Tabla filtrable (escuela, tipo, búsqueda) con checkbox múltiple y prioridad Alta/Media/Baja; 2) cálculo en tiempo real de presupuesto priorizado vs disponible con alerta si supera el 2% del presupuesto de la facultad; 3) `[📄 GENERAR PLAN ANUAL]` produce PDF; 4) `[➡️ ENVIAR A DECANO]` → `EN_REVISION_DECANO`; 5) 🔔 `DECANO` (TRANSICION).
- **Tareas:** BE: filtros + agregación de presupuesto; FE: tabla priorizable + barra de progreso; QA: alerta de techo del 2%.
- **DoD:** CA cumplidos; plan anual PDF descargable; presupuesto consistente con `RSU_Presupuesto_Movimiento`.

### HU-007 — Dictaminar y aprobar con Resolución (Decano)
- **Épica:** E1 · **Actor:** DECANO · **Valor:** Alto — validez legal (Art.26) · **Prioridad:** P0 · **Estimación:** 8 SP
- **CA:** 1) Panel de dictámenes con expediente completo descargable; 2) campos obligatorios: N° de Resolución (`R.D. N° 045-2026-UNDC`), fecha, tipo (APROBACION/RECHAZO/OBSERVACION) y PDF firmado; 3) al aprobar guarda `id_resolucion_aprobacion`, `fecha_aprobacion` en `RSU_Resolucion` y pasa a `APROBADO_DECANO`; 4) 🔔 al creador, `COMITE_CALIDAD` y equipo (AVANCE_EQUIPO); 5) el rechazo rebota al emisor con motivo (R31/R32).
- **Tareas:** BE: `POST /transicion` tipo RESOLUCION + CRUD `RSU_Resolucion`; FE: formulario de dictamen; QA: aprobar sin PDF falla; resolución única por proyecto.
- **DoD:** CA cumplidos; resolución inmutable una vez emitida; trazabilidad completa.

### HU-008 — Asignar carga no lectiva (Director de Departamento)
- **Épica:** E1 · **Actor:** DIRECTOR_ESCUELA/DEPARTAMENTO (Modelo A: `DIR_DEPTO`) · **Valor:** Alto (Art.18/79/86, 3h semanales RSU) · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Muestra carga actual y disponible del docente (`carga_no_lectiva_max`); 2) valida en tiempo real `SUM(horas_asignadas) + horas_nuevas ≤ carga_no_lectiva_max` y bloquea en rojo si excede; 3) registra `RSU_Asignacion_Docente(APROBADA)` con Plan de Carga Horaria (PDF obligatorio); 4) 🔔 `DOCENTE_RESPONSABLE` (ASIGNACION); 5) el docente solo puede asesorar máx 2 proyectos SSU por semestre (R06).
- **Tareas:** BE: `POST /asignaciones/docente` + validación Art.86; FE: panel de carga con semáforo; QA: asignación que excede 8h se bloquea.
- **DoD:** CA cumplidos; suma de carga consistente en reportes; notificación registrada.

### HU-009 — Registrar en padrón oficial (Director Central RS / VRA)
- **Épica:** E1 · **Actor:** DECANO/ADMINISTRADOR (Modelo A: `DIR_CENTRAL_RS`) · **Valor:** Alto (reporte SUNEDU) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Tabla de todos los proyectos `APROBADO_DECANO` con resumen en tiempo real (N° proyectos, docentes, estudiantes, beneficiarios, S/ invertido y % del presupuesto); 2) `[REGISTRAR OFICIAL]` pasa a `LISTO_DESCARGA`/`REGISTRADO_OFICIAL`; 3) `[📄 GENERAR PADRÓN PDF]` y `[📊 EXPORTAR EXCEL]`; 4) 🔔 reporte generado (REPORTE).
- **Tareas:** BE: vista `vw_rsu_proyectos_resumen` + `RSU_Reporte_Anual`; FE: panel con resumen y exportadores; QA: el % de presupuesto se calcula contra el 2%.
- **DoD:** CA cumplidos; padrón PDF coincide con la vista SQL; métricas Ind.29 correctas.

## ÉPICA E2 — EJECUCIÓN DEL PROYECTO (M02)

### HU-010 — Coordinar cronograma de campo
- **Épica:** E2 · Ejecución · **Actor:** DOCENTE_RESPONSABLE / ESTUDIANTE · **Valor:** Alto · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Tabla editable de actividades (agregar/eliminar) con N°, actividad, fecha, hora, lugar; 2) obligatorio adjuntar Acta de Compromiso con la comunidad (PDF) antes de iniciar; 3) `[▶️ INICIAR EJECUCIÓN]` pasa a `EN_EJECUCION`; 4) cualquier miembro del equipo ve el mismo cronograma filtrado a su proyecto (aislamiento); 5) 🔔 equipo (AVANCE_EQUIPO).
- **Tareas:** BE: `POST /actividades` (`RSU_Actividad_Campo`); FE: tabla editable + botón iniciar; QA: iniciar sin acta se bloquea.
- **DoD:** CA cumplidos; actividades solo visibles para el equipo; transición válida por BPMN.

### HU-011 — Registrar actividad de campo (equipo completo)
- **Épica:** E2 · **Actor:** ESTUDIANTE (cualquier miembro ACTIVO) / DOCENTE · **Valor:** Alto · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Fecha autocompleta hoy, editable, no futura; 2) horas (0–23) y minutos (0–59) validados; hora fin > hora inicio; 3) descripción ≥ 20 caracteres; 4) ≥1 fotografía JPG/PNG ≤ 5 MB cada una (máx 5); 5) cualquier miembro del equipo puede registrar (no solo el líder) — verificación backend `isMiembro` (403 si no lo es); 6) la actividad se vincula a un entregable y suma horas al estudiante.
- **Tareas:** BE: `POST /actividades` + membresía; FE: formulario de registro con captura de 3 pasos; QA: usuario ajeno al equipo recibe 403.
- **DoD:** CA cumplidos; horas acumuladas consistentes; fotos almacenadas con hash.

### HU-012 — Subir fotografías de actividad
- **Épica:** E2 · **Actor:** ESTUDIANTE (miembro) · **Valor:** Medio (Art.21.7) · **Prioridad:** P1 · **Estimación:** 3 SP
- **CA:** 1) Drag & drop + selección múltiple con previsualización; 2) descripción opcional por foto y eliminación individual; 3) validación de formato (JPG/PNG) y tamaño (≤5 MB) antes de subir; 4) se persiste en `RSU_Actividad_Foto`; 5) botón deshabilitado si el usuario no es miembro del equipo.
- **Tareas:** BE: `POST /documentos/upload` con validación de tipo/tamaño/hash; FE: modal de upload; QA: archivo PNG de 6 MB es rechazado.
- **DoD:** CA cumplidos; fotos servidas desde `/uploads`; sin XSS en nombres de archivo.

### HU-013 — Registrar asistencia de beneficiarios
- **Épica:** E2 · **Actor:** DOCENTE / ESTUDIANTE (miembro) · **Valor:** Alto (evidencia de impacto) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Lista de beneficiarios vinculados al proyecto con checkbox; 2) firma escaneada JPG/PNG por beneficiario; 3) contador en tiempo real (N de M); 4) obliga Ficha de Asistencia firmada (PDF); 5) se guarda `RSU_Asistencia_Beneficiario` y actualiza `nro_beneficiarios` de la actividad.
- **Tareas:** BE: `RSU_Asistencia_Beneficiario` + contador; FE: tabla de asistencia + `[📄 IMPRIMIR FICHA]`; QA: guardar sin PDF falla.
- **DoD:** CA cumplidos; asistencia coherente con el padrón vinculado.

### HU-014 — Justificar falta (máximo 2)
- **Épica:** E2 · **Actor:** ESTUDIANTE (aislado — solo sus justificaciones) · **Valor:** Medio · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Formulario: actividad (dropdown), fecha de ausencia, hora inicio/fin, motivo ≥ 50 caracteres, evidencia PDF obligatoria; 2) contador "Máx 2 permitidas (1/2)" en ámbar; botón `[+Nueva Justificación]` deshabilitado al llegar a 2; 3) tabla de historial con estados coloreados (PENDIENTE/REVISADO/APROBADA/RECHAZADA); 4) 🔔 `DIRECTOR_ESCUELA`/`DOCENTE_ASESOR` (EVALUACION) al crear.
- **Tareas:** BE: `RSU_Justificacion_Falta` + constraint de máximo 2 por estudiante; FE: `Justificacion.tsx`; QA: tercera justificación bloqueada.
- **DoD:** CA cumplidos; el conteo ignora justificaciones de otros estudiantes.

### HU-015 — Modificar informe inicial
- **Épica:** E2 · **Actor:** ESTUDIANTE (aislado) · **Valor:** Medio · **Prioridad:** P2 · **Estimación:** 3 SP
- **CA:** 1) Historial de modificaciones con estado coloreado y botón de detalle (👁️); 2) `[+Nueva Modificación]` registra motivo, archivo y fecha; 3) se guarda `RSU_Modificacion_Informe`; 4) 🔔 al verificador correspondiente.
- **Tareas:** BE: CRUD `RSU_Modificacion_Informe`; FE: `ModificarInforme.tsx`; QA: modificación sin motivo falla.
- **DoD:** CA cumplidos; trazabilidad de motivos intacta.

### HU-016 — Ejecutar recursos presupuestales
- **Épica:** E2 · **Actor:** DOCENTE_RESPONSABLE / UNIDAD_ABAST (Modelo A) · **Valor:** Alto (Art.125, 2%) · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Barra de progreso de ejecución (ejecutado/aprobado, % en tiempo real); 2) tipo (ASIGNACION/EJECUCION/TRANSFERENCIA/DEVOLUCION), monto ≤ saldo disponible, fecha, descripción; 3) comprobante obligatorio (Pecosa/Factura/Boleta PDF); 4) guarda `RSU_Presupuesto_Movimiento`; 5) 🔔 `UNIDAD_ABAST` (PRESUPUESTO) si es EJECUCION y al `DECANO`/Director RS.
- **Tareas:** BE: `POST /presupuesto/movimientos` + validación de saldo; FE: `Presupuesto.tsx`; QA: monto mayor al saldo se rechaza.
- **DoD:** CA cumplidos; el movimiento es irreversible (solo se compensa con DEVOLUCION).

### HU-017 — Registrar pago con voucher
- **Épica:** E2 · **Actor:** ESTUDIANTE/DOCENTE (aislado) · **Valor:** Medio · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Autocompletado de nombres, carrera y ciclo (desde `Estudiante_Ciclo`, no editable); 2) N° de operación, banco, monto ≤ presupuesto aprobado, fecha, voucher JPG/PNG/PDF obligatorio; 3) estado inicial `REGISTRADO`; 4) guarda `RSU_Pago_Voucher`.
- **Tareas:** BE: `RSU_Pago_Voucher`; FE: formulario de pago; QA: monto excedente se bloquea.
- **DoD:** CA cumplidos; voucher verificable por `UNIDAD_ABAST` (HU-038).

### HU-018 — Monitoreo in situ (Director RS Facultad)
- **Épica:** E2 · **Actor:** DIRECTOR_ESCUELA/DECANO (Modelo A: `DIR_RS_FACULTAD`) · **Valor:** Alto (supervisión Reglamento) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Formulario con fecha, monitor, slider de % avance (0–100), checklist de hitos, observaciones y resultado (CONFORME/CON_OBSERVACION/NO_CONFORME); 2) obliga Informe de Monitoreo (PDF); 3) pasa a `EN_MONITOREO`; 4) 🔔 `COMITE_CALIDAD` + equipo; 5) guarda `RSU_Monitoreo`.
- **Tareas:** BE: `POST /monitoreos`; FE: `Monitoreo.tsx` con slider; QA: guardar sin PDF falla.
- **DoD:** CA cumplidos; el % de avance queda histórico por proyecto.

### HU-019 — Presentar informe final
- **Épica:** E2 · **Actor:** DOCENTE_RESPONSABLE / equipo · **Valor:** Alto (Art.24/25) · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Tabla de entregables con guía descargable (.docx), fecha límite, archivo, horas y estado (APROBADO/PENDIENTE); 2) barras de progreso (entregas 5/5, finalización 3/3); 3) si el proyecto está `CERRADO` se bloquea la subida con mensaje; 4) botones `[📥 Descargar formato]`, `[📋 Historial]`, `[✅ Justif.]`; 5) al completar → `INFORME_FINAL_PRESENTADO`.
- **Tareas:** BE: `POST /entregables` + transición; FE: `DocenteEntregables.tsx`; QA: subida en proyecto cerrado se bloquea.
- **DoD:** CA cumplidos; cada entregable registra horas y PDF.

### HU-020 — Visar conformidad de informes (Director de Escuela)
- **Épica:** E2 · **Actor:** DIRECTOR_ESCUELA · **Valor:** Alto (R20) · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Panel "Conformidad de informes" con visor de informe y evidencias; 2) checklist de 5 (informe, rendición, fotos, padrón, encuestas); 3) resultado (CONFORME/CON_OBSERVACION/NO_CONFORME) y proveído (PDF obligatorio); 4) `[✅ DAR CONFORMIDAD]` → `CON_CONFORMIDAD_ESCUELA` (o `APROBADO_DECANO` en Modelo B); 5) registra `RSU_Verificacion`; 6) 🔔 `DECANO`/`CONSEJO_FACULTAD` (TRANSICION).
- **Tareas:** BE: transición + verificación; FE: panel de conformidad; QA: conformidad sin checklist completo falla.
- **DoD:** CA cumplidos; solo proyectos conformes avanzan a cierre.

### HU-021 — Aprobar cierre con Resolución (Decano / Consejo de Facultad)
- **Épica:** E2 · **Actor:** DECANO / DIRECTOR_ESCUELA (Modelo A: `CONSEJO_FACULTAD`) · **Valor:** Alto — validez legal · **Prioridad:** P0 · **Estimación:** 8 SP
- **CA:** 1) Formulario de cierre con N° de Resolución, fecha y PDF obligatorio; 2) checklist de emisión de constancias para cada estudiante y el docente; 3) al aprobar guarda `id_resolucion_cierre`, `fecha_cierre` y pasa a `CERRADO`; 4) crea `RSU_Solicitud_Constancia` por participante; 5) 🔔 `COMITE_CALIDAD` y `DECANO`/Director Central.
- **Tareas:** BE: `RSU_Resolucion` tipo CIERRE + constancias; FE: panel de cierre; QA: cierre sin constancias marcadas falla.
- **DoD:** CA cumplidos; proyecto cerrado es de solo lectura; constancias quedan pendientes de emisión.

## ÉPICA E3 — EVALUACIÓN DE IMPACTO (M03/M05)

### HU-022 — Aplicar encuesta de satisfacción a beneficiario (Likert P01–P06)
- **Épica:** E3 · Evaluación de impacto · **Actor:** DOCENTE_RESPONSABLE / COMITE_CALIDAD · **Valor:** Alto (SINEACE Est.25) · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) 6 preguntas del catálogo `RSU_Pregunta_Encuesta` en escala Likert 1–5 (P01 utilidad … P06); 2) calcula automáticamente promedio y calificación cualitativa (`MUY_MALO <2, MALO 2–2.9, REGULAR 3–3.4, BUENO 3.5–4.4, MUY_BUENO ≥4.5`); 3) modalidad (PRESENCIAL/TELEFONICA/VIRTUAL), comentario abierto y PDF firmado obligatorio; 4) **no admite duplicados** `(id_proyecto, id_beneficiario)` — UNIQUE en DB; 5) beneficiario debe estar vinculado al proyecto; 6) botones `[💾 GUARDAR ENCUESTA]` y `[➡️ SIGUIENTE BENEFICIARIO]`; 7) 🔔 `COMITE_CALIDAD` (EVALUACION).
- **Tareas:** BE: `POST /encuestas/beneficiario` + deduplicación + promedio; FE: `Encuestas.tsx`; QA: segundo intento del mismo beneficiario es rechazado.
- **DoD:** CA cumplidos; respuestas en `RSU_Respuesta_Encuesta` con CHECK 1–5; vista `vw_rsu_satisfaccion_dimension` refleja el promedio.

### HU-023 — Encuesta de satisfacción al docente asesor
- **Épica:** E3 · **Actor:** ESTUDIANTE (aislado) · **Valor:** Medio · **Prioridad:** P2 · **Estimación:** 3 SP
- **CA:** 1) Autocompletado de asesor, carrera, tipo y nombre; 2) registro con estado `REGISTRADO`; 3) PDF adjunto opcional; 4) guarda `RSU_Encuesta_Satisfaccion`.
- **Tareas:** BE: CRUD encuesta docente; FE: `EncuestaDocente.tsx`; QA: solo el equipo del proyecto puede encuestar a su asesor.
- **DoD:** CA cumplidos; sin duplicado estudiante-asesor-proyecto.

### HU-024 — Procesar información de impacto (Comité de Calidad)
- **Épica:** E3 · **Actor:** COMITE_CALIDAD · **Valor:** Alto (indicadores SINEACE) · **Prioridad:** P1 · **Estimación:** 8 SP
- **CA:** 1) Tabla por dimensión: promedio, N° de respuestas, % de logro; 2) indicadores con línea base, meta y valor alcanzado (% logro calculado); 3) % de satisfacción global; 4) `[📊 EXPORTAR EXCEL]` y `[📄 GENERAR MATRIZ PDF]`; 5) persiste `RSU_Indicador_Impacto`.
- **Tareas:** BE: agregación desde `vw_rsu_satisfaccion_dimension`; FE: `indicadores`; QA: % logro = alcanzado/meta redondeado a 2 decimales.
- **DoD:** CA cumplidos; matriz PDF descargable; datos consistentes con encuestas.

### HU-025 — Informe de evaluación de impacto (Director de Escuela)
- **Épica:** E3 · **Actor:** DIRECTOR_ESCUELA · **Valor:** Alto · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Informe de 5 secciones (resumen, metas vs línea base, impacto social, sostenibilidad, conclusiones); 2) adjunto PDF obligatorio; 3) `[➡️ ENVIAR A DIR. RS FACULTAD]` → `EN_EVALUACION_IMPACTO`; 4) 🔔 al Director RS Facultad.
- **Tareas:** BE: transición + `RSU_Documento` etapa EVALUACION; FE: editor de informe; QA: envío sin PDF falla.
- **DoD:** CA cumplidos; el informe queda en la pestaña de indicadores del proyecto.

### HU-026 — Formular lecciones aprendidas
- **Épica:** E3 · **Actor:** DIRECTOR_ESCUELA / docente · **Valor:** Medio (mejora curricular) · **Prioridad:** P2 · **Estimación:** 3 SP
- **CA:** 1) `[+ NUEVA LECCIÓN]` con descripción y recomendación curricular (asignatura opcional); 2) `[📄 GENERAR PLAN DE RECOMENDACIONES]` en PDF; 3) guarda `RSU_Leccion_Aprendida`; 4) `[➡️ ENVIAR A CONSEJO]` disponible.
- **Tareas:** BE: CRUD lecciones; FE: formulario; QA: lección sin descripción no se guarda.
- **DoD:** CA cumplidos; lecciones visibles en el dashboard de calidad.

### HU-027 — Validar evaluación con Resolución
- **Épica:** E3 · **Actor:** DECANO / DIRECTOR_ESCUELA (Modelo A: `CONSEJO_FACULTAD`) · **Valor:** Alto — validez legal · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Visor del informe de impacto; 2) N° de Resolución, fecha y PDF obligatorios; 3) `[✅ VALIDAR EVALUACIÓN]` → `EVALUACION_VALIDADA` y guarda `RSU_Resolucion` tipo `CONFORMIDAD_EVALUACION`; 4) 🔔 al Director Central RS.
- **Tareas:** BE: transición + resolución; FE: panel de validación; QA: validar sin resolución falla.
- **DoD:** CA cumplidos; la evaluación validada alimenta la Memoria Anual.

### HU-028 — Consolidar Memoria Anual (Director Central RS / Decano)
- **Épica:** E3 · **Actor:** DECANO/ADMINISTRADOR · **Valor:** Alto (SUNEDU Ind.29) · **Prioridad:** P1 · **Estimación:** 8 SP
- **CA:** 1) Resumen ejecutivo: N° proyectos, docentes, estudiantes, beneficiarios, monto invertido y % del presupuesto (meta ≥ 2%); 2) desglose por facultad/escuela; 3) indicadores SUNEDU Ind.29 (proyectos, % docentes, % estudiantes, % presupuesto) con semáforo de cumplimiento; 4) `[📄 GENERAR MEMORIA PDF]` y `[📊 EXPORTAR EXCEL]`; 5) marca `REPORTADO_SUNEDU` y guarda `RSU_Reporte_Anual`.
- **Tareas:** BE: vista `vw_rsu_cobertura_anual` + reporte anual; FE: `Reportes.tsx`; QA: el % presupuesto se calcula sobre el 2% institucional.
- **DoD:** CA cumplidos; memoria PDF coincide con las vistas; cierre de año consistente.


## ÉPICA E4 — BENEFICIARIOS (PADRÓN CAÑETE)

### HU-029 — Registrar beneficiario
- **Épica:** E4 · Beneficiarios · **Actor:** DOCENTE/ESTUDIANTE/ADMINISTRADOR · **Valor:** Alto · **Prioridad:** P0 · **Estimación:** 3 SP
- **CA:** 1) Formulario por tipo: PERSONA_NATURAL (DNI 8 dígitos, nombres, apellidos, fecha nacimiento, sexo) o INSTITUCION/COMUNIDAD (RUC 11, razón social, representante legal); 2) contactos (celular, fijo, correo), dirección, distrito (Cañete), provincia (Cañete), departamento (Lima); 3) valida unicidad de DNI/RUC; 4) guarda `RSU_Beneficiario`.
- **Tareas:** BE: `POST /beneficiarios` con validaciones DNI/RUC; FE: `Personas.tsx`; QA: DNI de 7 dígitos es rechazado.
- **DoD:** CA cumplidos; beneficiario activo por defecto; auditoría de creación.

### HU-030 — Vincular beneficiario a proyecto
- **Épica:** E4 · **Actor:** DOCENTE/ESTUDIANTE · **Valor:** Alto · **Prioridad:** P0 · **Estimación:** 3 SP
- **CA:** 1) Selector de beneficiario existente + fecha de incorporación obligatoria + rol en el proyecto; 2) UNIQUE `(id_proyecto, id_beneficiario)` — no permite doble vinculación; 3) guarda `RSU_Proyecto_Beneficiario`; 4) el beneficiario queda disponible para asistencia y encuestas.
- **Tareas:** BE: `POST /beneficiarios/vincular`; FE: tabla de beneficiarios del proyecto; QA: segunda vinculación es rechazada.
- **DoD:** CA cumplidos; el conteo de beneficiarios del KPI se actualiza.

### HU-031 — Importar beneficiarios desde Excel
- **Épica:** E4 · **Actor:** ADMINISTRADOR/DOCENTE · **Valor:** Medio · **Prioridad:** P2 (🟡 pendiente) · **Estimación:** 5 SP
- **CA:** 1) Descarga de plantilla Excel con columnas obligatorias; 2) carga masiva con validación por fila (DNI/RUC, distrito); 3) reporte de errores descargable (filas rechazadas con motivo); 4) inserción transaccional (todo o nada).
- **Tareas:** BE: parser Excel (ej. `excelize`/`xlsx`), validación por fila; FE: wizard de importación; QA: archivo con 1 fila mala no inserta nada.
- **DoD:** CA cumplidos; importación masiva de 500 registros < 30 s; log de errores.

### HU-032 — Consultar padrón de beneficiarios
- **Épica:** E4 · **Actor:** todos los roles (ver) · **Valor:** Alto · **Prioridad:** P1 · **Estimación:** 3 SP
- **CA:** 1) Búsqueda por DNI/RUC y texto libre; 2) filtros por distrito, tipo (NATURAL/INSTITUCION/COMUNIDAD) y proyecto; 3) vista de detalle con histórico de vinculaciones; 4) exportación del padrón del proyecto.
- **Tareas:** BE: `GET /beneficiarios` + `GET /proyectos/:id/beneficiarios` con filtros; FE: `Beneficiarios.tsx`; QA: búsqueda por DNI exacto.
- **DoD:** CA cumplidos; paginación funcional; cobertura anual visible (`vw_rsu_cobertura_anual`).

## ÉPICA E5 — DOCUMENTOS Y ENTREGABLES

### HU-033 — Subir entregables y documentos (equipo completo)
- **Épica:** E5 · **Actor:** ESTUDIANTE (miembro ACTIVO) / DOCENTE · **Valor:** Alto · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Cualquier miembro del equipo (líder o participante) puede subir documentos; 2) el backend valida membresía (`isMiembro` → 403 si no); 3) formatos y tamaños según `RSU_Tipo_Documento` (ej. PDF ≤10 MB, JPG/PNG ≤5 MB) con cálculo de hash; 4) se registra etapa del documento (FORMULACION/EJECUCION/EVALUACION/TRANSVERSAL) y `obligatorio`; 5) en estados finales (`CERRADO`, `REPORTADO_SUNEDU`, `EVALUACION_VALIDADA`) la subida está bloqueada.
- **Tareas:** BE: `POST /documentos/upload` + `POST /entregables` con membresía; FE: `Documentos.tsx` + `Evidencias.tsx`; QA: usuario no miembro recibe 403.
- **DoD:** CA cumplidos; el hash permite verificar integridad; listado por proyecto actualizado.

### HU-034 — Verificar entregable (Director de Escuela / docente)
- **Épica:** E5 · **Actor:** DIRECTOR_ESCUELA / DOCENTE_RESPONSABLE · **Valor:** Medio · **Prioridad:** P1 · **Estimación:** 3 SP
- **CA:** 1) Lista de entregables con estado (APROBADO/OBSERVADO/PENDIENTE); 2) acción de aprobar u observar con comentarios obligatorios al observar; 3) el entregable observado permite reenvío; 4) el cambio queda en `RSU_Entregable.estado`.
- **Tareas:** BE: `PATCH /entregables/:id`; FE: panel de verificación; QA: observar sin comentario falla.
- **DoD:** CA cumplidos; el historial de estados del entregable es visible.

### HU-035 — Firmar declaración jurada y autorizar uso de imagen
- **Épica:** E5 · **Actor:** ESTUDIANTE · **Valor:** Medio (LGPD/imagen) · **Prioridad:** P2 · **Estimación:** 3 SP
- **CA:** 1) Formulario de declaración jurada con aceptación explícita; 2) guarda `RSU_Declaracion_Jurada` (estado REGISTRADO, verificador anulable); 3) autorización de uso de imagen firmada (PDF opcional); 4) visible en "Mis horas/constancias".
- **Tareas:** BE: `RSU_Declaracion_Jurada`; FE: `AutorizacionImagen.tsx`; QA: no se puede cerrar proyecto sin declaración.
- **DoD:** CA cumplidos; la declaración queda asociada al proyecto y estudiante.

### HU-036 — Solicitar constancia de participación
- **Épica:** E5 · **Actor:** ESTUDIANTE · **Valor:** Medio · **Prioridad:** P2 · **Estimación:** 3 SP
- **CA:** 1) Solicitud con tipo de constancia (PARTICIPACION/SSU/ETC.); 2) estado `PENDIENTE` → emisión por el Consejo/Decano; 3) guarda `RSU_Solicitud_Constancia` con documento emitido; 4) 🔔 al estudiante cuando la constancia está disponible.
- **Tareas:** BE: CRUD `RSU_Solicitud_Constancia`; FE: `EstudianteConstancias.tsx`; QA: solicitud duplicada del mismo tipo se evita.
- **DoD:** CA cumplidos; la constancia solo se emite para proyectos `CERRADO`.

## ÉPICA E6 — PRESUPUESTO Y EJECUCIÓN DEL 2% (M12)

### HU-037 — Asignar presupuesto a proyecto
- **Épica:** E6 · Presupuesto · **Actor:** DECANO/ADMINISTRADOR · **Valor:** Alto (Ley 30220 Art.125) · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Asignación por movimiento `ASIGNACION` con monto, fecha y sustento (PDF); 2) el techo de la facultad es el 2% del presupuesto institucional — alerta si se excede; 3) solo el PEP_FINANCIADO puede recibir financiamiento institucional (`requiere_presupuesto=true`); 4) el saldo se calcula como asignado − ejecutado.
- **Tareas:** BE: `POST /presupuesto/movimientos` tipo ASIGNACION + validación de techo; FE: `Presupuesto.tsx`; QA: asignación a proyecto autofinanciado se rechaza.
- **DoD:** CA cumplidos; el reporte del 2% (HU-039) refleja la asignación.

### HU-038 — Verificar voucher (Unidad de Abastecimiento)
- **Épica:** E6 · **Actor:** UNIDAD_ABAST (Modelo A) · **Valor:** Alto (contabilidad) · **Prioridad:** P1 · **Estimación:** 3 SP
- **CA:** 1) Lista de pagos `REGISTRADO` con comprobante; 2) `[✓ VERIFICAR VOUCHER]` pasa a `VERIFICADO_FACULTAD` registrando verificador y fecha; 3) solo movimientos en `EN_EJECUCION`/`TRANSFERENCIA` son verificables; 4) 🔔 al creador del pago.
- **Tareas:** BE: `PATCH` de estado en `RSU_Pago_Voucher`; FE: panel de vouchers; QA: verificar dos veces no duplica registro.
- **DoD:** CA cumplidos; el voucher verificado cierra el flujo de pago.

### HU-039 — Reporte de ejecución del 2% (Art.125)
- **Épica:** E6 · **Actor:** DECANO/ADMINISTRADOR · **Valor:** Alto (SUNEDU) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) KPI de % de presupuesto ejecutado = ejecutado/asignado del 2%; 2) desglose por modalidad y escuela; 3) semáforo de cumplimiento (meta ≥ 2%); 4) exportación PDF/Excel; 5) alimenta `RSU_Reporte_Anual.porcentaje_presupuesto`.
- **Tareas:** BE: agregación de `RSU_Presupuesto_Movimiento`; FE: widget en `DirectivoDashboard`; QA: el % con 0 asignado no divide por cero.
- **DoD:** CA cumplidos; cifras cuadran con los movimientos; indicador SUNEDU visible.

## ÉPICA E7 — SEGURIDAD, ROLES DINÁMICOS Y AUDITORÍA (M07/M09)

### HU-040 — Inicio de sesión con correo institucional
- **Épica:** E7 · **Actor:** todos los usuarios · **Valor:** Alto · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Login con correo institucional y contraseña; 2) mock actual acepta cualquier correo con `123456`/`undc2026` (10–12 demos por rol); 3) devuelve JWT + rol_actor y permisos; 4) `/auth/me` devuelve el perfil; 5) auditoría de login/logout.
- **Tareas:** BE: `POST /auth/login`, `GET /auth/me`; FE: `Login.tsx` con selector de rol demo; QA: credencial inválida devuelve 401.
- **DoD:** CA cumplidos; sesión persiste en contexto; cierra sesión invalida el token.

### HU-041 — Roles dinámicos por proyecto (10 roles)
- **Épica:** E7 · **Actor:** ADMINISTRADOR · **Valor:** Alto (diseño V1.1) · **Prioridad:** P0 · **Estimación:** 8 SP
- **CA:** 1) Un usuario puede tener varios roles simultáneamente, asignados **por proyecto/modalidad/etapa**; 2) endpoints de asignación/revocación (`GET/POST/DELETE /proyectos/:id/roles`, `GET /usuarios/:tipo/:id/roles`); 3) la sidebar y las rutas se filtran dinámicamente por rol (`RoleSidebar`, `RoleGuard`, `canAccessRoute`); 4) la matriz de permisos (§4.6) se aplica en backend y frontend; 5) estudiante queda aislado a sus proyectos (redirect `/proyectos` → `/mis-proyectos`).
- **Tareas:** BE: `RSU_Proyecto_Rol` + permisos por endpoint; FE: `permissions.ts`, `RoleGuard`, `RoleSidebar`; QA: usuario sin rol no accede a la bandeja directiva.
- **DoD:** CA cumplidos; asignar/revocar rol refleja inmediatamente en la UI; cada acción queda en auditoría.

### HU-042 — Auditoría de acciones
- **Épica:** E7 · **Actor:** SISTEMA (lectura: ADMINISTRADOR) · **Valor:** Alto (SINEACE) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Middleware registra automáticamente: usuario, acción, entidad, id, valor anterior/nuevo (JSONB), IP y fecha; 2) eventos mínimos: login, logout, crear/editar proyecto, cambio de estado, aprobación, rechazo, descarga, transferencia, configuración, asignación/revocación de rol; 3) `GET /auditoria` con filtros (usuario, entidad, fecha, acción) — solo Administrador; 4) la auditoría es inmutable (solo INSERT).
- **Tareas:** BE: `middleware.AuditMiddleware` + `RSU_Auditoria_Log`; FE: `Reportes.tsx` pestaña auditoría; QA: una transición genera exactamente un log con old/new.
- **DoD:** CA cumplidos; los logs no registran contraseñas; consulta paginada < 2 s.

### HU-043 — Trazabilidad del flujo de aprobación
- **Épica:** E7 · **Actor:** todos (ver) · **Valor:** Alto (transparencia) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Timeline del proyecto desde `BORRADOR` hasta estado actual con actor, rol, fecha y resultado de cada transición; 2) fuente: vista `vw_rsu_trazabilidad_aprobacion` sobre `RSU_Flujo_Aprobacion`; 3) endpoint `GET /proyectos/:id/historial`; 4) descarga del histórico en PDF.
- **Tareas:** BE: vista + endpoint; FE: tab "Flujo BPMN" de `ProyectoDetalle`; QA: el timeline coincide con las transiciones sembradas.
- **DoD:** CA cumplidos; cada aprobación muestra quién, cuándo y con qué resolución.

## ÉPICA E8 — DASHBOARDS Y REPORTES (M05/M10)

### HU-044 — Dashboard del docente
- **Épica:** E8 · **Actor:** DOCENTE_RESPONSABLE/ASESOR · **Valor:** Medio · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) KPIs propios: proyectos asesorados, carga RSU actual vs máxima (Art.86), actividades programadas/ejecutadas, entregables por verificar; 2) lista de "proyectos asesorados" (solo donde es asesor); 3) acceso a actividades de campo, entregables, encuestas de impacto y monitoreo.
- **Tareas:** BE: `GET /dashboard/kpis` filtrado + `GET /docentes/:id/proyectos`; FE: `DocenteDashboard.tsx`; QA: docente ve solo sus proyectos.
- **DoD:** CA cumplidos; carga no lectiva con semáforo; navegación por lane.

### HU-045 — Dashboard del estudiante (aislado por equipo)
- **Épica:** E8 · **Actor:** ESTUDIANTE · **Valor:** Alto · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Muestra **solo** sus proyectos (líder o miembro ACTIVO/INSCRITO) vía `GET /estudiantes/:id/proyectos`; 2) resumen: estado BPMN, avance, horas acumuladas, créditos, justificaciones usadas (N/2); 3) banner informativo "Todos los estudiantes del equipo suben docs"; 4) intentar ver proyecto ajeno muestra banner rojo "Acceso denegado".
- **Tareas:** BE: `ListByEstudiante` + `CheckMembresia`; FE: `EstudianteDashboard.tsx`; QA: estudiante sin proyectos ve estado vacío.
- **DoD:** CA cumplidos; ningún dato de otros equipos se expone en la respuesta.

### HU-046 — Dashboard del Director de Escuela
- **Épica:** E8 · **Actor:** DIRECTOR_ESCUELA · **Valor:** Alto · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Bandeja de viabilidades pendientes (`EN_REVISION_ESCUELA`) y conformidad de informes (`INFORME_FINAL_PRESENTADO`) con contadores; 2) KPIs de su escuela (proyectos por estado, beneficiarios, % conformidad); 3) padrón de beneficiarios de su escuela; 4) acceso solo a proyectos de su escuela.
- **Tareas:** BE: KPIs filtrados por escuela; FE: `DirectivoDashboard` bandeja; QA: contador coincide con la bandeja.
- **DoD:** CA cumplidos; los contadores de bandeja y badge de notificaciones cuadran.

### HU-047 — Dashboard del Director RS Facultad / Decano
- **Épica:** E8 · **Actor:** DECANO · **Valor:** Alto · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Vista `vw_rsu_proyectos_resumen`: proyectos por estado (gráfico BPMN), torta por escuela/facultad, avance S/ (Art.125, 2%), satisfacción Likert promedio; 2) bandeja de priorización y monitoreo; 3) acceso a presupuesto, vouchers y lecciones aprendidas; 4) descarga de resumen ejecutivo.
- **Tareas:** BE: vistas + KPIs; FE: `DirectivoDashboard` con Recharts; QA: los gráficos reflejan el seed.
- **DoD:** CA cumplidos; 6 KPIs visibles; gráficos responsivos.

### HU-048 — Dashboard del Consejo de Facultad (dictámenes)
- **Épica:** E8 · **Actor:** DIRECTOR_ESCUELA/DECANO (Modelo A: `CONSEJO_FACULTAD`) · **Valor:** Medio · **Prioridad:** P2 · **Estimación:** 3 SP
- **CA:** 1) Lista de dictámenes pendientes (`EN_DICTAMEN_CONSEJO`/`EN_REVISION_DECANO`) con contador; 2) cierres por aprobar; 3) validación de evaluaciones de impacto; 4) acceso a resoluciones emitidas (PDF).
- **Tareas:** BE: filtros por estado; FE: bandeja de consejo; QA: el contador baja al dictaminar.
- **DoD:** CA cumplidos; las resoluciones son descargables desde el panel.

### HU-049 — Dashboard del Director Central RS / VRA
- **Épica:** E8 · **Actor:** DECANO/ADMINISTRADOR · **Valor:** Alto (SUNEDU Ind.29) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Padrón oficial consolidado (`REGISTRADO_OFICIAL`) con resumen ejecutivo; 2) Memoria Anual con indicadores Ind.29; 3) presupuesto institucional 2%; 4) botones de generación de padrón PDF y exportación Excel.
- **Tareas:** BE: `RSU_Reporte_Anual` + `vw_rsu_cobertura_anual`; FE: panel central; QA: el resumen anual cuadra con la suma de proyectos.
- **DoD:** CA cumplidos; la memoria es reproducible desde los datos.

### HU-050 — Exportar reportes a Excel
- **Épica:** E8 · **Actor:** COMITE_CALIDAD/DECANO · **Valor:** Medio · **Prioridad:** P2 (🟡 pendiente) · **Estimación:** 5 SP
- **CA:** 1) Exportación Excel para los 10 reportes de M10 (por modalidad, estado, escuela, línea de acción, ODS, participantes, beneficiarios, presupuesto, indicadores, auditoría); 2) respeta los filtros de la pantalla; 3) encabezados institucionales y formato de fechas `dd/mm/aaaa`; 4) tiempo < 10 s para 5 000 filas.
- **Tareas:** BE: generador XLSX (streaming); FE: botones `[📊 EXPORTAR EXCEL]`; QA: el Excel exportado abre sin advertencias y cuadra con la pantalla.
- **DoD:** CA cumplidos; los reportes en Excel tienen totales y son accesibles solo según rol (§4.6).

### HU-051 — Generar Memoria Anual en PDF
- **Épica:** E8 · **Actor:** DECANO · **Valor:** Alto · **Prioridad:** P2 (🟡 pendiente) · **Estimación:** 8 SP
- **CA:** 1) PDF institucional con carátula, resumen ejecutivo, indicadores SUNEDU Ind.29, gráficos y anexos; 2) generación asíncrona con progreso; 3) marca el proyecto/año como `REPORTADO_SUNEDU`; 4) 🔔 al Comité de Calidad.
- **Tareas:** BE: renderizado PDF (ej. `gofpdf`/headless Chrome); FE: modal de generación; QA: el PDF incluye todas las secciones y cifras cuadran.
- **DoD:** CA cumplidos; la memoria es firmable digitalmente; queda registro en `RSU_Reporte_Anual`.

## ÉPICA E9 — NOTIFICACIONES (M08)

### HU-052 — Notificaciones automáticas por transición y creación
- **Épica:** E9 · **Actor:** SISTEMA → roles destino · **Valor:** Alto · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Al crear un proyecto se dispara `PROYECTO_CREADO` (proponente/ejecutor) y `ASIGNACION` (asesor); 2) al aprobar una transición se dispara `TRANSICION` al actor del estado destino y `AVANCE_EQUIPO` al equipo; 3) la notificación guarda `rol_destino`, tipo, título, mensaje, `id_proyecto`, `leido=false`; 4) índices por `rol_destino`, `leido`, `created_at`.
- **Tareas:** BE: disparadores en `service.Create`/`Transicion`; FE: — ; QA: cada transición sembrada genera su notificación.
- **DoD:** CA cumplidos; las notificaciones del seed (9 filas) están presentes; ningún correo se envía aún (canal pendiente).

### HU-053 — Bandeja de notificaciones por rol (campana)
- **Épica:** E9 · **Actor:** todos · **Valor:** Alto · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Header con campana, badge rojo de no leídas y polling cada 30 s; 2) dropdown con las últimas 12 notificaciones del rol (`GET /notificaciones?rol_destino=...&limit=12`); 3) `[✓ Marcar leída]` individual (`PATCH /:id/leido`) y `[Marcar todas leídas]` (`/marcar-todas-leidas`); 4) contadores globales `GET /count` y multi-lane `GET /counts?roles=A,B`.
- **Tareas:** BE: endpoints de notificaciones; FE: `Header.tsx`; QA: marcar todas las leídas vacía el badge.
- **DoD:** CA cumplidos; el badge no muestra más de 99+; el polling no duplica peticiones.

### HU-054 — Correos de recordatorio de plazos y aprobaciones
- **Épica:** E9 · **Actor:** SISTEMA · **Valor:** Medio · **Prioridad:** P2 (🟡 pendiente) · **Estimación:** 5 SP
- **CA:** 1) Envío de correo institucional en cambio de estado, plazos próximos a vencer (recordatorio a X días) y aprobaciones; 2) job programado (cron) que escanea plazos y dispara `RSU_Notificacion` tipo REPORTE/PLAZO; 3) configuración del correo remitente (`responsabilidadsocialu@undc.edu.pe`) en M11; 4) reintentos y log de envíos.
- **Tareas:** BE: cliente SMTP + scheduler; FE: — ; QA: recordatorio de plazo vencido genera correo y notificación en plataforma.
- **DoD:** CA cumplidos; el correo incluye deep link al proyecto; no se envían correos en modo mantenimiento.

### HU-055 — Estados de notificación (leída/archivada/eliminada)
- **Épica:** E9 · **Actor:** todos · **Valor:** Bajo · **Prioridad:** P3 · **Estimación:** 2 SP
- **CA:** 1) Ciclo de vida de la notificación: NO_LEIDA → LEIDA → ARCHIVADA/ELIMINADA; 2) acción de archivar y eliminar desde la bandeja; 3) las eliminadas no reaparecen; 4) filtro por estado en la bandeja.
- **Tareas:** BE: campos de estado + endpoints; FE: bandeja con filtros; QA: archivar no borra.
- **DoD:** CA cumplidos; la bandeja soporta paginación y filtros.

## ÉPICA E10 — COMPLEMENTOS DE EJECUCIÓN (horas, asistencia, formatos)

### HU-056 — Registro de horas docentes por proyecto (carga no lectiva)
- **Épica:** E10 · **Actor:** DOCENTE_RESPONSABLE · **Valor:** Alto (Art.18/86) · **Prioridad:** P1 · **Estimación:** 3 SP
- **CA:** 1) Cada actividad registra horas al docente responsable; 2) el acumulado por semestre no puede exceder `carga_no_lectiva_max`; 3) visualización "Mi carga RSU: X/Y h" con progreso; 4) el exceso se bloquea al asignar (HU-008).
- **Tareas:** BE: agregado de horas en `RSU_Asignacion_Docente`; FE: `DocenteCarga.tsx`; QA: la suma cruza con asignaciones aprobadas.
- **DoD:** CA cumplidos; el reporte de carga coincide con las actividades ejecutadas.

### HU-057 — Registro de horas y créditos estudiantiles
- **Épica:** E10 · **Actor:** ESTUDIANTE · **Valor:** Medio · **Prioridad:** P1 · **Estimación:** 3 SP
- **CA:** 1) Acumulador de horas por actividad (mínimo 60 h para SSU/Voluntariado, R04/R12); 2) barra de progreso "horas: 45/60"; 3) constancia habilitada solo al cumplir el mínimo; 4) detalle por actividad descargable.
- **Tareas:** BE: agregado desde `RSU_Actividad_Campo.minutos`; FE: `EstudianteHoras.tsx`; QA: 59 h no habilita la constancia.
- **DoD:** CA cumplidos; las horas cuadran con las actividades aprobadas.

### HU-058 — Asistencia del equipo docente a actividades
- **Épica:** E10 · **Actor:** DOCENTE · **Valor:** Bajo · **Prioridad:** P3 · **Estimación:** 2 SP
- **CA:** 1) Registro de asistencia del docente a cada actividad programada; 2) vinculación con la carga no lectiva; 3) listado de inasistencias.
- **Tareas:** BE: tabla/flags de asistencia docente; FE: check-in en actividad; QA: la asistencia alimenta el reporte de carga.
- **DoD:** CA cumplidos; consistente con HU-056.

### HU-059 — Descarga de formatos oficiales (.docx/PDF)
- **Épica:** E10 · **Actor:** todos · **Valor:** Medio (R30) · **Prioridad:** P2 · **Estimación:** 3 SP
- **CA:** 1) Botón `[📥 Descargar formato]` en guías de entregables con plantillas .docx; 2) los modelos oficiales por modalidad (F-M03.01-RSU-001…019) están en la sección de recursos; 3) los formatos se sirven estáticos con versión visible.
- **Tareas:** BE: ruta estática de formatos; FE: sección "Modelos oficiales"; QA: el .docx descarga y abre.
- **DoD:** CA cumplidos; la versión del formato figura en el nombre de archivo.

### HU-060 — Registro de minutos y duración de actividades
- **Épica:** E10 · **Actor:** ESTUDIANTE · **Valor:** Bajo · **Prioridad:** P3 · **Estimación:** 2 SP
- **CA:** 1) Campos de hora inicio/fin y minutos calculados automáticamente; 2) validación de rango (0–23 h, 0–59 min) y coherencia inicio<fin; 3) los minutos se convierten a horas decimales en el acumulador.
- **Tareas:** BE: validaciones en `RSU_Actividad_Campo`; FE: inputs de tiempo; QA: actividad de 0 minutos no cuenta horas.
- **DoD:** CA cumplidos; la conversión minutos→horas es exacta (redondeo 2 decimales).

## ÉPICA E11 — INDICADORES SUNEDU / SINEACE

### HU-061 — Indicadores SUNEDU (Indicador 29)
- **Épica:** E11 · **Actor:** DECANO/ADMINISTRADOR · **Valor:** Alto (licenciamiento) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Cálculo de los indicadores Ind.29: N° de proyectos ejecutados, % de estudiantes participantes, % de docentes participantes, % de presupuesto RSU ejecutado (≥2%); 2) fuente `vw_rsu_cobertura_anual`; 3) semáforo de cumplimiento por indicador; 4) histórico por año; 5) exportación para el informe de licenciamiento.
- **Tareas:** BE: consultas sobre vistas; FE: widget Ind.29 en `DirectivoDashboard`; QA: el % de estudiantes = participantes/total de la escuela.
- **DoD:** CA cumplidos; las fórmulas están documentadas en la pantalla; los datos son trazables.

### HU-062 — Indicadores SINEACE (Estándar 25) y matriz de indicadores de impacto
- **Épica:** E11 · **Actor:** COMITE_CALIDAD · **Valor:** Alto (acreditación) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Matriz de indicadores de impacto con % de logro por dimensión Likert; 2) relación indicador → línea base → meta → alcanzado; 3) evidencias vinculadas (encuestas, informes); 4) exportación PDF/Excel para el comité de calidad; 5) lecciones aprendidas asociadas (HU-026).
- **Tareas:** BE: `RSU_Indicador_Impacto` + `vw_rsu_satisfaccion_dimension`; FE: `Reportes.tsx`; QA: el % logro se recalcula al actualizar la meta.
- **DoD:** CA cumplidos; la matriz es coherente con las encuestas aplicadas.


## ÉPICA E12 — PLATAFORMA FACULTAD SEGÚN DISEÑO FUNCIONAL /INFO (HU-101…HU-120)

> Requisitos del Documento de Diseño Funcional `info/objetivo.txt` V1.1 y mapa SERUS/DRSU `info/reporte.html` aún no implementados (o parcialmente). Numeración HU-10x para distinguirlos del as-built.

### HU-101 — Descargar modelos oficiales por modalidad (F-M03.01-RSU-001…019)
- **Épica:** E12 · Módulos de plataforma (M01–M03) · **Actor:** ESTUDIANTE/DOCENTE/PRESIDENTE_COMITE_RSU · **Valor:** Alto (R30) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Catálogo de 22 modelos oficiales descargables por modalidad (Informe Inicial/Final SSU F-M03.01-RSU-001/002, Constancia Estudiante SSU 004, Ficha de Calificación 005, Informe Mensual de Avance 006, Informe del Docente Asesor 014, Compromiso de Asesoría 016, Constancia Docente 003; Informes PEP F-M03-RSU-001/002/003; Propuesta e Informes de Voluntariado 008/009/010/011; Constancias PEP Docente 012, Voluntariado Estudiante/Egresado 013, Docente 017, Administrativo 018, Certificado PEP Estudiante 019; Expediente de Evidencias y Ficha de Impacto Social para Publicación); 2) descarga en PDF y Word; 3) acceso según modalidad del usuario; 4) versión del modelo visible.
- **Tareas:** BE: tabla de modelos + rutas estáticas; FE: sección "Modelos oficiales" en el dashboard por rol; QA: cada modelo descarga y abre.
- **DoD:** CA cumplidos; los 22 modelos disponibles; el catálogo filtra por modalidad.

### HU-102 — Crear proyecto SSU con reglas específicas (R01–R06)
- **Épica:** E12 · M01 por modalidad · **Actor:** ESTUDIANTE · **Valor:** Alto (Art.21) · **Prioridad:** P0 · **Estimación:** 8 SP
- **CA:** 1) El formulario SSU exige: estudiante entre V y X ciclo (R03), 2 a 5 estudiantes (R05), mínimo 60 horas (R04), propuesta de docente asesor (R01) con conformidad firmada F-M03.01-RSU-016 (R02); 2) el docente asesor no supera 2 proyectos SSU por semestre (R06); 3) el esquema inicial (Anexo 2) es obligatorio; 4) la creación queda en `BORRADOR` con modalidad SSU; 5) las validaciones de R01–R06 se ejecutan en backend al enviar.
- **Tareas:** BE: validaciones de modalidad en `service.Create`; FE: wizard SSU; QA: equipo de 1 estudiante es rechazado; 3er SSU del docente es rechazado.
- **DoD:** CA cumplidos; todas las reglas R01–R06 son verificables en API; mensajes de error específicos por regla.

### HU-103 — Crear PEP financiado (R07/R08)
- **Épica:** E12 · M01 por modalidad · **Actor:** PRESIDENTE_COMITE_RSU · **Valor:** Alto (Art.23) · **Prioridad:** P0 · **Estimación:** 8 SP
- **CA:** 1) Solo el Presidente del Comité RSU puede crear PEP financiado; 2) la presentación es 15 días antes del inicio de clases (R07) — el sistema calcula y avisa la fecha límite; 3) accede al 2% del presupuesto RSU administrado por la DRSU (R08 corregida) mediante ASIGNACION; 4) registra docentes, estudiantes y administrativos; 5) esquema inicial (Anexo 3) obligatorio; 6) flujo: Escuela → Decano (resolución) → DRSU (evaluación técnica/presupuestal) → Vicerrectorado Académico → **Consejo Universitario** (aprobación por resolución, reemplazo de la extinta Comisión Organizadora, Ley 30220 Art.59).
- **Tareas:** BE: modalidad PEP_FINANCIADO + estados `APROBADO_CONSEJO_UNIV` + validación de fecha R07; FE: wizard PEP; QA: creación fuera de plazo muestra advertencia.
- **DoD:** CA cumplidos; el flujo incluye el Consejo Universitario; el presupuesto proviene del centro de costo DRSU.

### HU-104 — Crear PEP autofinanciado (R09/R10)
- **Épica:** E12 · M01 por modalidad · **Actor:** DOCENTE_RESPONSABLE · **Valor:** Alto (Art.23.1) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Solo docentes responsables/ordinarios o contratados pueden proponer; 2) se presenta durante el semestre (R09) sin financiamiento institucional (R10) — el campo presupuesto institucional está oculto/deshabilitado; 3) esquema inicial (Anexo 3) obligatorio; 4) flujo Escuela → Decano → transferencia a universidad.
- **Tareas:** BE: modalidad PEP_AUTOFINANCIADO + `requiere_presupuesto=false`; FE: wizard; QA: intentar asignar presupuesto institucional es rechazado.
- **DoD:** CA cumplidos; el proyecto avanza sin mover el 2%.

### HU-105 — Crear Voluntariado Yanapay (R11/R12)
- **Épica:** E12 · M01 por modalidad · **Actor:** ESTUDIANTE/EGRESADO/DOCENTE/ADMINISTRATIVO · **Valor:** Alto (Art.31–33) · **Prioridad:** P1 · **Estimación:** 8 SP
- **CA:** 1) La convocatoria es 2 veces al año (R11) — el sistema muestra ventanas de convocatoria configurables (M11); 2) propuesta Yanapay (Anexo 4) obligatoria al inscribirse; 3) constancia solo con mínimo 60 horas (R12); 4) flujo: propuesta → DRSU evalúa y aprueba → informes (inicial, avance, final) → emisión de constancia por tipo de participante (estudiante/egresado/docente/administrativo); 5) suspensión temporal con FUT y reincorporación.
- **Tareas:** BE: modalidad VOLUNTARIADO + ventanas de convocatoria + control de 60 h; FE: wizard + pantallas de informes; QA: voluntario con 59 h no obtiene constancia.
- **DoD:** CA cumplidos; las constancias diferencian tipo de participante; la convocatoria es parametrizable.

### HU-106 — Registrar Publicación Científica (R13–R18)
- **Épica:** E12 · M01 por modalidad · **Actor:** ESTUDIANTE/EGRESADO · **Valor:** Alto (Art.39–41) · **Prioridad:** P1 · **Estimación:** 8 SP
- **CA:** 1) Expediente de evidencias con: PDF del artículo publicado, carta de aceptación de la revista, link de la revista indexada (Latindex/SciELO/Scopus/Web of Science), Ficha de Impacto Social (línea de investigación RSU, ODS, resumen); 2) validaciones: revista indexada (R13), afiliación UNDC (R14), tema vinculado a Cañete (R15), ODS identificado (R16), autofinanciada (R17), máximo 2 estudiantes por artículo (R18); 3) ventanilla abierta (continua); 4) flujo: DRSU evalúa (validación de rigor, verificación de identidad, dictamen de pertinencia) → constancia de RSU → derivación a Vicepresidencia de Investigación → registro en repositorio institucional (`DERIVADO_VP_INVESTIGACION` → `REGISTRADO_REPOSITORIO`).
- **Tareas:** BE: modalidad PUBLICACION_CIENTIFICA + validaciones R13–R18; FE: wizard con 4 evidencias; QA: artículo sin ODS es rechazado.
- **DoD:** CA cumplidos; cada rechazo tiene motivo normativo; el repositorio queda marcado como paso externo.

### HU-107 — Gestión del Comité RSU (M04)
- **Épica:** E12 · M04 · **Actor:** DECANO/ADMINISTRADOR · **Valor:** Alto (Art.26) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) CRUD de integrantes (docentes designados por el Decano) con propuesta del Director de Escuela; 2) resolución de designación (PDF) vinculada; 3) período de 2 años, ratificable — el sistema avisa vencimiento de período; 4) estado Activo/Inactivo; 5) el Comité revisa no duplicidad y alineación al Plan RS.
- **Tareas:** BE: `/comite-rsu` (ya existe) + período y alertas; FE: `Catalogos`/panel comité; QA: integrante inactivo no aparece en revisiones.
- **DoD:** CA cumplidos; la resolución de designación es descargable; el aviso de vencimiento se dispara 30 días antes.

### HU-108 — Flujo de rechazo con rebote al emisor (R31/R32)
- **Épica:** E12 · Transversal · **Actor:** DIRECTOR_ESCUELA/DECANO · **Valor:** Alto · **Prioridad:** P0 · **Estimación:** 5 SP
- **CA:** 1) Todo rechazo (Escuela, Decano, DRSU) incluye motivo obligatorio y rebota el proyecto a `BORRADOR` (o `RECHAZADO` con reapertura) en poder del emisor; 2) el emisor es notificado con el motivo; 3) el proyecto modificado puede reenviarse (R32) conservando el historial de rechazos; 4) el conteo de rechazos es visible en la trazabilidad.
- **Tareas:** BE: transición de rechazo + reapertura; FE: modal de rechazo con motivo; QA: el rebote preserva el historial completo.
- **DoD:** CA cumplidos; ningún rechazo pierde el motivo; el reenvío es una nueva transición auditada.

### HU-109 — Escalamiento automático por plazo vencido y silencio administrativo (R33/R34)
- **Épica:** E12 · Transversal · **Actor:** SISTEMA · **Valor:** Alto · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Si el Director de Escuela no revisa en el plazo configurado (5 días hábiles, M11), el proyecto escala automáticamente al Decano (R33); 2) si el Decano no revisa en su plazo, el proyecto se aprueba por silencio administrativo positivo (R34) y se registra la aprobación automática en `RSU_Flujo_Aprobacion`; 3) job programado (cron diario) evalúa los plazos; 4) ambas situaciones generan notificación y quedan en trazabilidad.
- **Tareas:** BE: scheduler + reglas R33/R34; FE: indicador "escalado por plazo"; QA: simulación de plazo vencido dispara el escalamiento.
- **DoD:** CA cumplidos; el escalamiento es idempotente (no se duplica); los plazos vienen de M11.

### HU-110 — Gestión de desistimiento, abandono, ampliación y cambios
- **Épica:** E12 · Transversal · **Actor:** ESTUDIANTE/DOCENTE · **Valor:** Medio · **Prioridad:** P2 · **Estimación:** 8 SP
- **CA:** 1) Desistimiento antes del segundo informe permite reinscribirse en otro proyecto; 2) proyecto en abandono puede reinscribirse el siguiente semestre (con devolución de presupuesto si es PEP financiado); 3) solicitudes de: cambio de entidad beneficiaria, cambio de docente asesor, ampliación de integrantes — cada una con flujo de aprobación y notificación; 4) si el presupuesto no alcanza, el PEP pasa a autofinanciado con aprobación; 5) todas las solicitudes quedan en `RSU_Flujo_Aprobacion`/auditoría.
- **Tareas:** BE: endpoints de solicitudes + transiciones; FE: panel de solicitudes especiales; QA: desistimiento libera el cupo del docente (R06).
- **DoD:** CA cumplidos; cada caso tiene trazabilidad; el presupuesto se libera/devuelve correctamente.

### HU-111 — Punto de quiebre: descarga del paquete ZIP por el Decano (M06) y transferencia
- **Épica:** E12 · M06 · **Actor:** DECANO · **Valor:** Alto — cierre del alcance facultad · **Prioridad:** P0 · **Estimación:** 8 SP
- **CA:** 1) El Decano solo puede descargar proyectos aprobados por el Director de Escuela (R21); 2) el paquete ZIP incluye: Esquema Inicial (Anexo 3), Informe de Avance, Informe Final, Resolución de aprobación, Resolución de ratificación del Comité, evidencias fotográficas, encuestas a beneficiarios, informe del docente asesor (Anexo 4) y ficha de calificación; 3) estructura de carpetas por proyecto (`UNDC-RSU-2026-001/...`); 4) al descargar, el proyecto pasa a `DESCARGADO_TRANSFERIDO` (R22: solo el Decano transfiere); 5) 🔔 a la DRSU (universidad) y al creador.
- **Tareas:** BE: generador ZIP (archivo en streaming) + transición; FE: `[⬇️ DESCARGAR PAQUETE ZIP]` en panel del Decano; QA: el ZIP contiene todos los documentos obligatorios del proyecto.
- **DoD:** CA cumplidos; el ZIP es descargable y consistente; el estado de transferencia es irreversible sin nueva aprobación.

### HU-112 — Notificaciones por correo institucional y push (M08 completo)
- **Épica:** E12 · M08 · **Actor:** SISTEMA · **Valor:** Medio · **Prioridad:** P2 · **Estimación:** 5 SP
- **CA:** 1) Matriz de notificación por acción (proyecto creado → Director de Escuela y Presidente Comité; aprobado por Director → Decano y creador; rechazado → creador con motivo; transferido → DRSU y creador; plazo próximo a vencer → responsable; supervisión inopinada programada → creador; constancia emitida → creador); 2) canales: en plataforma (campana), correo institucional y push (si aplica); 3) la matriz completa de 24 eventos está parametrizada en M11.
- **Tareas:** BE: dispatcher por canal; FE: preferencias de canal; QA: cada evento de la matriz genera las 2 notificaciones (plataforma + correo).
- **DoD:** CA cumplidos; la matriz coincide con el §2.2 de `info/objetivo.txt`; sin correo en modo mantenimiento.

### HU-113 — Configuración paramétrica del sistema (M11)
- **Épica:** E12 · M11 · **Actor:** ADMINISTRADOR · **Valor:** Alto · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Parámetros configurables: plazo revisión Director Escuela (5 días hábiles), plazo revisión Decano (5), plazo de subsanación (10), mínimo/máximo estudiantes SSU (2/5), mínimo horas SSU (60), máximo proyectos SSU por docente (2), máximo estudiantes por publicación (2), líneas de acción (01–05), ODS (1–17), revistas indexadas, % presupuesto RSU (2%), convocatorias de voluntariado por año (2), correo de notificaciones, URL de la plataforma, modo mantenimiento; 2) API CRUD `/configuracion` (ya existe); 3) el Decano solo configura parámetros de su facultad; el Comité de Calidad solo consulta.
- **Tareas:** BE: `/configuracion` (existente) + aplicación de reglas que lean parámetros; FE: `Configuración` en el admin; QA: cambiar el máximo de estudiantes SSU a 3 habilita equipos de 3.
- **DoD:** CA cumplidos; todas las reglas de negocio leen de `RSU_Configuracion` (sin hardcode); el modo mantenimiento bloquea el acceso general.

### HU-114 — Reportes M10 (10 reportes con acceso por rol)
- **Épica:** E12 · M10 · **Actor:** COMITE_CALIDAD/DECANO/DIRECTOR_ESCUELA · **Valor:** Alto · **Prioridad:** P1 · **Estimación:** 8 SP
- **CA:** 1) Los 10 reportes: proyectos por modalidad, por estado, por escuela, por línea de acción, por ODS, participantes por rol, beneficiarios por proyecto, presupuesto ejecutado (por modalidad y escuela), indicadores de desempeño y auditoría; 2) formato PDF y Excel; 3) acceso: Comité de Calidad/Decano/Administrador → todos; Director de Escuela/Presidente Comité → solo su escuela; 4) filtros por fecha, modalidad, estado.
- **Tareas:** BE: servicio de reportes sobre vistas; FE: `Reportes.tsx` con 10 pestañas; QA: el Director de Escuela no ve datos de otra escuela.
- **DoD:** CA cumplidos; cada reporte es descargable en ambos formatos; el acceso por rol se cumple en backend.

### HU-115 — Presupuesto por escuela y centro de costo DRSU (M12 detallado)
- **Épica:** E12 · M12 · **Actor:** DECANO/ADMINISTRADOR · **Valor:** Alto · **Prioridad:** P1 · **Estimación:** 8 SP
- **CA:** 1) Módulo con: presupuesto asignado (2% total para la facultad), ejecutado en el año, por proyecto, por escuela y saldo disponible; 2) administración como centro de costo DRSU con coordinación DRSU–Escuelas; 3) acceso: Decano/Administrador (ver/editar/aprobar), Director de Escuela/Presidente Comité/Comité de Calidad (solo ver); 4) alertas de techo y de desviación; 5) conciliación con movimientos (ASIGNACION/EJECUCION/TRANSFERENCIA/DEVOLUCION).
- **Tareas:** BE: agregaciones por escuela + centro de costo; FE: `Presupuesto.tsx` ampliado; QA: el saldo por escuela cuadra con los movimientos.
- **DoD:** CA cumplidos; la distribución por escuela es editable solo por Decano/Admin; el 2% nunca se excede.

### HU-116 — Registro de supervisión inopinada de la DRSU
- **Épica:** E12 · M02 · **Actor:** DECANO/ADMINISTRADOR · **Valor:** Medio · **Prioridad:** P2 · **Estimación:** 3 SP
- **CA:** 1) Registro de visita de supervisión inopinada con fecha, responsable, hallazgos y evidencias; 2) notificación al creador del proyecto ("Supervisión programada para [fecha]"); 3) vinculación al monitoreo del proyecto (HU-018); 4) los hallazgos generan observaciones subsanables en 10 días hábiles.
- **Tareas:** BE: tabla/visita de supervisión; FE: panel de visitas; QA: la visita queda en la trazabilidad del proyecto.
- **DoD:** CA cumplidos; la visita genera notificación y plazo de subsanación.

### HU-117 — Encuesta al docente asesor (R27 — pendiente de validación normativa)
- **Épica:** E12 · M03 · **Actor:** ESTUDIANTE · **Valor:** Bajo · **Prioridad:** P3 · **Estimación:** 2 SP
- **CA:** 1) Campo pendiente en la plataforma a la espera de que la DRSU defina el instrumento (no se inventa contenido); 2) el registro existe (`RSU_Encuesta_Satisfaccion`) pero su aplicación está marcada como "requiere validación normativa"; 3) visible en el flujo SSU como paso opcional; 4) 🔔 al DOCENTE_ASESOR cuando se aplica.
- **Tareas:** BE: marca de estado "pendiente validación"; FE: bandera informativa en `EncuestaDocente.tsx`; QA: no bloquea el cierre del proyecto.
- **DoD:** CA cumplidos; el documento deja explícita la pendencia normativa; no se genera contenido de encuesta inventado.

### HU-118 — Dashboard de plazos y vencimientos
- **Épica:** E12 · Transversal · **Actor:** todos los roles con responsabilidad · **Valor:** Medio · **Prioridad:** P2 · **Estimación:** 5 SP
- **CA:** 1) Panel "Mis plazos" con próximos a vencer (7/3 días) y vencidos, por proyecto y responsabilidad; 2) semáforo por plazo (verde/ámbar/rojo); 3) acción directa al proyecto (deep link); 4) cálculo en días hábiles (Ley 30220, calendario UNDC); 5) 🔔 recordatorio a X días configurables (M11).
- **Tareas:** BE: cálculo de plazos sobre `RSU_Flujo_Aprobacion` + calendario laboral; FE: widget "Plazos" en dashboards; QA: plazo vencido aparece en rojo y dispara R33/R34.
- **DoD:** CA cumplidos; los plazos usan días hábiles; el panel es personalizado por rol.

### HU-119 — Mapa de módulos estudiante SERUS/DRSU (9 módulos)
- **Épica:** E12 · M07/UX · **Actor:** ESTUDIANTE/EGRESADO · **Valor:** Alto (alineación con universidad) · **Prioridad:** P1 · **Estimación:** 5 SP
- **CA:** 1) Los 9 módulos del mapa `info/reporte.html` existen y son alcanzables: Inicio, Fases del proyecto, Ejecución del proyecto, Registro de evidencias, Modificar Informe Inicial, Justificación de Faltas, Encuesta docente, Autorización de imagen, Solicitud de constancia; 2) cada módulo expone sus tablas (ej. Fases: Nombre, Líder, Semestre, Tipología, Docente Asesor, Sector, N° Beneficiados, Fechas, Estado, Proyecto, Ficha aprobación); 3) navegación coherente con la DRSU (`/estudiante/...`); 4) FAQ institucional (formatos a presentar, tipos de archivo, ver avance, tiempo para completar, modificación después de enviar).
- **Tareas:** FE: rutas `/estudiante/*` alineadas al mapa; BE: endpoints ya existentes; QA: recorrido de los 9 módulos sin errores 404.
- **DoD:** CA cumplidos; los 34 campos del mapa están cubiertos; el FAQ responde las 5 preguntas frecuentes.

### HU-120 — Interfaz de transferencia a SERUS/DRSU (marcador de integración)
- **Épica:** E12 · Integración · **Actor:** DECANO · **Valor:** Medio · **Prioridad:** P3 · **Estimación:** 3 SP
- **CA:** 1) Pantalla de "Transferencia a plataforma universidad" con checklist de documentos transferidos y acuse de recibo manual; 2) registro de la transferencia (fecha, responsable, método: manual/correo/Mesa de Partes) en `RSU_Flujo_Aprobacion`; 3) marcador de interfaz futura (API SERUS) documentado sin bloquear el flujo actual; 4) 🔔 a DRSU y creador (R29: vía plataforma, correo o Mesa de Partes según modalidad).
- **Tareas:** BE: endpoint de registro de transferencia; FE: pantalla de transferencia; QA: la transferencia queda auditada aunque sea manual.
- **DoD:** CA cumplidos; el acuse de recibo es descargable; la interfaz futura queda especificada en el documento.


---

# 6. REGLAS DE NEGOCIO (R01–R35)

| Código | Regla | Modalidad | Base legal |
|---|---|---|---|
| **R01** | El estudiante propone al docente asesor | SSU | Art. 21.A |
| **R02** | El docente asesor debe dar conformidad (F-M03.01-RSU-016) | SSU | Art. 21.A |
| **R03** | El proyecto SSU se ejecuta entre el V y X ciclo | SSU | Art. 21.B |
| **R04** | El proyecto SSU requiere mínimo 60 horas | SSU | Art. 21.D |
| **R05** | El proyecto SSU requiere entre 2 y 5 estudiantes | SSU | Art. 21.C |
| **R06** | El docente asesor puede asesorar máximo 2 proyectos SSU por semestre | SSU | Art. 21.13 |
| **R07** | El PEP financiado se presenta 15 días antes del inicio de clases | PEP financiado | Art. 23 |
| **R08** | El PEP financiado accede al 2% del presupuesto asignado a RSU, administrado por la DRSU y ejecutado en coordinación con la Escuela Profesional | PEP financiado | Art. 23 |
| **R09** | El PEP autofinanciado se presenta durante el semestre | PEP autofinanciado | Art. 23.1 |
| **R10** | El PEP autofinanciado no requiere financiamiento institucional | PEP autofinanciado | Art. 23.1 |
| **R11** | El voluntariado se convoca 2 veces al año | Voluntariado | Art. 32 |
| **R12** | El voluntariado requiere mínimo 60 horas para constancia | Voluntariado | Art. 33 |
| **R13** | La publicación científica requiere revista indexada | Publicación Científica | Art. 39 |
| **R14** | La publicación científica requiere afiliación UNDC | Publicación Científica | Art. 39 |
| **R15** | La publicación científica requiere tema vinculado a Cañete | Publicación Científica | Art. 39 |
| **R16** | La publicación científica requiere identificar el ODS | Publicación Científica | Art. 39 |
| **R17** | La publicación científica es autofinanciada | Publicación Científica | Art. 39 |
| **R18** | Máximo 2 estudiantes por artículo científico | Publicación Científica | Art. 40 |
| **R19** | Solo Presidente del Comité RSU y Docente Asesor/Responsable pueden crear proyectos | Todas | Art. 23, 25 |
| **R20** | El Director de Escuela debe aprobar antes de que el Decano derive | Todas | Art. 22 |
| **R21** | El Decano solo puede descargar proyectos aprobados por el Director de Escuela | Todas | Art. 23 |
| **R22** | El Decano es el único que puede transferir a la plataforma de universidad | Todas | Art. 23 |
| **R23** | Los docentes deben cumplir 3 horas semanales de RSU como carga no lectiva | Todas | Art. 18 |
| **R24** | Los informes de avance se presentan a mitad del semestre o al finalizar el periodo | PEP | Art. 24 |
| **R25** | El informe final del docente asesor se presenta en un plazo máximo de 10 días hábiles | SSU | Art. 21.10 |
| **R26** | El estudiante debe subir encuesta a beneficiarios al finalizar el proyecto | SSU | Art. 21.8.A |
| **R27** | El estudiante debe subir encuesta al docente asesor al finalizar el proyecto | SSU | **Requiere validación normativa** |
| **R28** | El docente asesor debe subir informe final (F-M03.01-RSU-014) en 10 días hábiles | SSU | Art. 21.10 |
| **R29** | Los documentos externos se envían a la DRSU vía plataforma, correo o Mesa de Partes según modalidad | Todas | Art. 41 |
| **R30** | Los modelos descargables están disponibles en la plataforma | Todas | — |
| **R31** | Los rechazos rebotan al emisor para modificaciones | Todas | — |
| **R32** | Los proyectos rechazados pueden reenviarse | Todas | — |
| **R33** | Si el Director de Escuela no revisa en el plazo, escala al Decano | Todas | — |
| **R34** | Si el Decano no revisa en el plazo, se aprueba por silencio administrativo positivo | Todas | — |
| **R35** | El Consejo Universitario aprueba los PEP financiados (reemplaza a la Comisión Organizadora) | PEP financiado | Ley 30220 Art. 59.1 |

---

# 7. MODALIDADES Y FLUJOS

## 7.1 Quién propone qué

| Modalidad | Quién propone | Cuándo | Documento base | Aprueba |
|---|---|---|---|---|
| **SSU** | Estudiante o equipo | 1ª o 2ª semana del semestre | Esquema Inicial (Anexo 2) | DRSU (ficha 15–18 puntos) |
| **PEP financiado** | Presidente del Comité RSU | 15 días antes del inicio de clases | Esquema Inicial (Anexo 3) | Consejo Universitario vía Vicerrectorado Académico |
| **PEP autofinanciado** | Docente responsable | Durante el semestre | Esquema Inicial (Anexo 3) | Vicerrectorado Académico |
| **Voluntariado** | DRSU convoca; comunidad se inscribe | 2 veces al año | Propuesta Yanapay (Anexo 4) | DRSU |
| **Publicación Científica** | Estudiante o egresado | Ventanilla abierta | Expediente de Evidencias (Art. 41) | DRSU |

## 7.2 Quién puede crear por modalidad

| Rol | SSU | PEP financiado | PEP autofinanciado | Voluntariado | Publicación Científica |
|---|---|---|---|---|---|
| Estudiante | Sí | No | No | Sí | Sí |
| Egresado | No | No | No | Sí | Sí |
| Docente Asesor | No | No | Sí | Sí | No |
| Presidente Comité RSU | No | Sí | No | No | No |
| Docente ordinario o contratado | No | No | Sí | Sí | No |
| Personal administrativo | No | No | No | Sí | No |

## 7.3 Flujo SSU (con rebote y escalamiento)

```
[Estudiante ingresa] → [Descarga modelos oficiales] → [Nuevo Proyecto SSU]
→ [Datos generales] → [Designa estudiante responsable] → [Propone docente asesor]
→ [Docente asesor da conformidad (F-M03.01-RSU-016)]
→ [Carga Esquema Inicial (Anexo 2)] → [Carga Informe Inicial (F-M03.01-RSU-001)]
→ [Envía a revisión] → [Director de Escuela revisa]
   ├─ Aprueba → [Decano consolida y descarga] → [Transferencia a universidad]
   └─ Rechaza → [Rebota al emisor] → [Estudiante modifica] → [Reenvía]
→ [DRSU evalúa con Ficha de Calificación (aprueba 15–18 puntos)]
→ [Estudiante ejecuta] → [Informes de Avance 1-3 (F-M03.01-RSU-006, ≥5 fotos/actividad, GPS)]
→ [DRSU supervisión inopinada] → [Encuesta a beneficiarios] → [Informe Final (F-M03.01-RSU-002)]
→ [Encuesta al Docente Asesor (R27, pendiente validación)]
→ [Docente Asesor sube Informe Final (F-M03.01-RSU-014, 10 días hábiles)]
→ [DRSU emite Constancia de RSU (F-M03.01-RSU-004)] → [Registro en SERUS]
```

## 7.4 Flujo PEP Financiado

```
[Presidente Comité RSU] → [Descarga modelos F-M03-RSU-001/002/003] → [Nuevo PEP Financiado]
→ [Datos generales] → [Registra docentes, estudiantes y administrativos]
→ [Sube Esquema Inicial (Anexo 3)] → [Envía a revisión (15 días antes del inicio)]
→ [Director de Escuela revisa] → [Decano aprueba mediante resolución]
→ [Decano deriva a DRSU] → [DRSU evalúa técnica y presupuestalmente (2% Art.125, cc. DRSU)]
→ [Vicerrectorado Académico eleva] → [Consejo Universitario aprueba mediante resolución (R35)]
→ [Informe de Avance (F-M03-RSU-002)] → [Informe Final (F-M03-RSU-003)]
→ [DRSU emite constancias: F-M03.01-RSU-012 Docente, F-M03.01-RSU-019 Estudiante]
```

## 7.5 Flujo Voluntariado

```
[Comunidad universitaria] → [Descarga modelos 008/009/010/011] → [Nuevo Voluntariado Yanapay]
→ [Datos generales] → [Registra integrantes] → [Sube Propuesta (Anexo 4)]
→ [Envía a revisión (convocatoria 2 veces/año)] → [DRSU evalúa y aprueba]
→ [Informe Inicial (009)] → [Informe de Avance (010)] → [Informe Final (011)]
→ [DRSU emite Constancia: 013 Estudiante/Egresado, 017 Docente, 018 Administrativo]
(Si < 60 horas → no se emite constancia, R12)
```

## 7.6 Flujo Publicación Científica

```
[Estudiante o egresado] → [Descarga Expediente de Evidencias + Ficha de Impacto Social]
→ [Nueva Publicación Científica] → [Datos generales]
→ [Sube PDF del artículo] → [Sube carta de aceptación] → [Sube link de revista indexada]
→ [Sube Ficha de Impacto Social (Línea de Investigación RSU, ODS, resumen)]
→ [Envía a revisión (ventanilla abierta, continua)]
→ [DRSU evalúa: Validación de Rigor, Verificación de Identidad, Dictamen de Pertinencia]
→ [DRSU emite Constancia de RSU] → [Derivación a Vicepresidencia de Investigación]
→ [Registro en Repositorio Institucional]
```

## 7.7 Estados por modalidad (Modelo B — seed actual)

| Estado | SSU | PEP financiado | PEP autofinanciado | Voluntariado | Publicación Científica |
|---|---|---|---|---|---|
| Borrador | Sí | Sí | Sí | Sí | Sí |
| En revisión por Director de Escuela | Sí | Sí | Sí | No | No |
| Aprobado por Director de Escuela | Sí | Sí | Sí | No | No |
| En revisión por Decano | Sí | Sí | Sí | No | No |
| Aprobado por Decano | Sí | Sí | Sí | No | No |
| Listo para descarga | Sí | Sí | Sí | Sí | Sí |
| Descargado y transferido | Sí | Sí | Sí | Sí | Sí |
| En revisión por DRSU | No | Sí | No | Sí | Sí |
| Aprobado por DRSU | Sí | Sí | No | Sí | Sí |
| Aprobado por Consejo Universitario | No | Sí | No | No | No |
| En ejecución / En monitoreo / Informe final presentado / Cerrado | Sí | Sí | Sí | Sí | — |
| Derivado a VP Investigación / Registrado en repositorio | — | — | — | — | Sí |

## 7.8 Documentos que genera la plataforma

| Documento | Módulo | Formato | Destino |
|---|---|---|---|
| Esquema Inicial del Proyecto | M01 | PDF | Decano → Universidad |
| Resolución de aprobación del proyecto | M01 | PDF | Decano → Universidad |
| Informe de Avance | M02 | PDF | Decano → Universidad |
| Informe Final | M03 | PDF | Decano → Universidad |
| Informe del Docente Asesor | M03 | PDF | Decano → Universidad |
| Resolución de designación del Comité | M04 | PDF | Decano → Universidad |
| Reporte de indicadores | M05 | PDF / Excel | Comité de Calidad |
| Paquete de exportación (ZIP) | M06 | ZIP | Decano → Universidad |

---

# 8. REQUISITOS NO FUNCIONALES

| # | Requisito | Criterio medible | Prioridad |
|---|---|---|---|
| NFR-01 | **Rendimiento** | Lectura de listas paginadas < 500 ms (p95) con 10 k proyectos; dashboards < 2 s | P1 |
| NFR-02 | **Disponibilidad** | 99% en horario laboral (L–V 08:00–18:00, America/Lima) | P1 |
| NFR-03 | **Seguridad** | JWT + HTTPS; RBAC por rol y proyecto; aislamiento estudiantil (403); sin datos sensibles en logs | P0 |
| NFR-04 | **Trazabilidad** | 100% de las acciones de estado en `RSU_Auditoria_Log`/`RSU_Flujo_Aprobacion` (quién, cuándo, qué, old/new) | P0 |
| NFR-05 | **Cumplimiento normativo** | Las 35 reglas R01–R35 verificables en API; indicadores SUNEDU Ind.29 y SINEACE Est.25 calculados de datos | P0 |
| NFR-06 | **Usabilidad** | Wizard máx 4 pasos; cualquier acción ≤ 3 clics; mensajes de error con causa y acción correctiva | P1 |
| NFR-07 | **Accesibilidad** | Contraste WCAG AA en paleta institucional; formularios con labels y foco visible | P2 |
| NFR-08 | **Mantenibilidad** | Clean Architecture respetada; `go vet` y `tsc` sin errores; cobertura de validaciones en tests manuales documentados | P1 |
| NFR-09 | **Portabilidad** | Todo corre con `docker compose up --build -d`; sin dependencias de sistema operativo | P1 |
| NFR-10 | **Integridad de archivos** | Hash por documento; validación de tipo/tamaño antes de persistir; uploads fuera de la BD | P1 |
| NFR-11 | **Internacionalización** | Spanish (es-PE) como idioma base; fechas dd/mm/aaaa, moneda S/ | P2 |
| NFR-12 | **Escalabilidad** | El 2% de presupuesto y el padrón soportan crecimiento a 2 facultades sin cambios de esquema | P3 |

---

# 9. API — INVENTARIO DE ENDPOINTS

Base: `http://localhost:8080/api/v1` (~83 rutas). Auth: `POST /auth/login` (mock: correo + `123456`/`undc2026`).

| Módulo | Método | Ruta | Descripción |
|---|---|---|---|
| Salud | GET | `/health` | Healthcheck |
| Auth | POST | `/auth/login` | Login mock (JWT) |
| Auth | GET | `/auth/me` | Perfil del usuario |
| Dashboard | GET | `/dashboard/kpis` | KPIs SUNEDU/SINEACE |
| Catálogos | GET | `/catalogos/{tipos-proyecto,lineas-accion,estados,roles-actor,tipos-documento,transiciones,preguntas-encuesta}` | 7 catálogos |
| Estructura | POST/GET/GET/:id/PUT/DELETE | `/facultades` | CRUD facultades |
| Estructura | POST/GET/GET/:id | `/escuelas` | Escuelas |
| Estructura | POST/GET | `/ciclos` | Ciclos académicos |
| Personas | POST/GET/GET/:id | `/docentes` | Docentes |
| Personas | POST/GET/GET/:id | `/estudiantes` | Estudiantes |
| Proyectos | POST | `/proyectos` | Crear (BORRADOR, valida ciclo mínimo) |
| Proyectos | GET | `/proyectos` | Lista paginada (search, estado, escuela) |
| Proyectos | GET | `/proyectos/resumen` | Vista `vw_rsu_proyectos_resumen` |
| Proyectos | GET/PUT | `/proyectos/:id` | Detalle / editar |
| Proyectos | POST | `/proyectos/:id/transicion` | Avanza BPMN (valida `RSU_Transicion_Estado`) |
| Proyectos | GET | `/proyectos/:id/historial` | Trazabilidad `vw_rsu_trazabilidad_aprobacion` |
| Proyectos | GET | `/estudiantes/:id/proyectos` | Proyectos del estudiante (aislado) |
| Proyectos | GET | `/docentes/:id/proyectos` | Proyectos asesorados |
| Proyectos | GET | `/proyectos/:id/es-miembro/:estudianteId` | Check membresía equipo |
| Entregables | POST/PATCH | `/entregables` · GET `/proyectos/:id/entregables` | CRUD entregables |
| Asignaciones | POST | `/asignaciones/docente` | Valida `carga_no_lectiva_max` Art.86 |
| Asignaciones | POST | `/asignaciones/estudiante` | Inscripción (valida ciclo mínimo + no duplicado) |
| Asignaciones | DELETE | `/proyectos/:id/estudiantes/:estudianteId` | Retirar estudiante |
| Asignaciones | GET | `/proyectos/:id/{docentes,estudiantes}` | Equipo del proyecto |
| Beneficiarios | POST/GET/GET/:id | `/beneficiarios` | Padrón Cañete |
| Beneficiarios | POST | `/beneficiarios/vincular` | Vincular a proyecto |
| Beneficiarios | GET | `/proyectos/:id/beneficiarios` | Beneficiarios del proyecto |
| Actividades | POST/GET | `/actividades` · GET `/proyectos/:id/actividades` | Actividades de campo |
| Actividades | PATCH | `/actividades/:id/estado` | Cambiar estado de actividad |
| Monitoreo | POST/GET | `/monitoreos` · GET `/proyectos/:id/monitoreos` | Monitoreo in situ |
| Documentos | POST | `/documentos/upload` | multipart + hash + membresía |
| Documentos | GET | `/proyectos/:id/documentos` | Documentos del proyecto |
| Presupuesto | POST | `/presupuesto/movimientos` | ASIGNACION/EJECUCION/TRANSFERENCIA/DEVOLUCION |
| Presupuesto | GET | `/proyectos/:id/presupuesto` | Movimientos del proyecto |
| Encuestas | POST | `/encuestas/beneficiario` | Likert 1–5, promedio + deduplicación |
| Encuestas | GET | `/proyectos/:id/encuestas` | Encuestas del proyecto |
| Indicadores | POST/GET | `/indicadores` · GET `/proyectos/:id/indicadores` | Indicadores de impacto |
| Notificaciones | GET | `/notificaciones` · `/count` · `/counts` | Bandeja por rol |
| Notificaciones | POST | `/notificaciones` | Crear (manual/seed) |
| Notificaciones | PATCH | `/notificaciones/:id/leido` · `/marcar-todas-leidas` | Marcar leídas |
| Roles dinámicos | GET/POST/DELETE | `/proyectos/:id/roles` | Asignar/revocar rol por proyecto |
| Roles dinámicos | GET | `/usuarios/:tipo/:id/roles` | Roles de un usuario |
| Comité RSU | GET/POST/DELETE | `/comite-rsu` · GET `/comite-rsu/escuela/:id` | M04 |
| Configuración | GET/PUT/DELETE | `/configuracion` | M11 parámetros |
| Auditoría | GET | `/auditoria` | M09 (solo Admin) |
| Estáticos | GET | `/uploads/*` | Documentos y fotos |

---

# 10. PLAN DE IMPLEMENTACIÓN (SPRINTS)

> Estimación total as-built + pendientes: ~245 SP. Equipo sugerido: 1 PO, 1 arquitecto, 2 devs backend, 2 devs frontend, 1 QA.

| Sprint | Épica/HU | SP acumulado | Entregable |
|---|---|---|---|
| **S0** (1 sem) | Arranque: Docker Compose, init.sql, skeleton Go+React, CI `go vet`/`npm run build` | — | Ambiente levanta con `docker compose up` |
| **S1** (2 sem) | E1: HU-001…HU-004 (8+3+2+5) | 18 | Crear proyecto, asesor, ciclo mínimo, envío a revisión |
| **S2** (2 sem) | E1: HU-005…HU-009 (5+5+8+5+5) + HU-108 (5) | 51 | Aprobaciones Escuela/Decano, resoluciones, rebote |
| **S3** (2 sem) | E7: HU-040…HU-043 (5+8+5+5) | 74 | Auth, roles dinámicos, auditoría, trazabilidad |
| **S4** (2 sem) | E2: HU-010…HU-015 (5+5+3+5+5+3+5) | 105 | Ejecución: cronograma, actividades, fotos, asistencia, justificaciones |
| **S5** (2 sem) | E2: HU-016…HU-021 (5+5+5+5+5+5+8) + E6 HU-037/038 (5+3) | 146 | Presupuesto, vouchers, monitoreo, informe final, cierre |
| **S6** (2 sem) | E3: HU-022…HU-028 (5+3+8+5+3+5+8) + E4 HU-029…032 (3+3+5+3) | 192 | Encuestas Likert, impacto, memoria, beneficiarios |
| **S7** (2 sem) | E5: HU-033…HU-036 (5+3+3+3) + E9: HU-052…053 (5+5) | 216 | Documentos equipo, constancias, notificaciones campana |
| **S8** (2 sem) | E8: HU-044…HU-049 (5+5+5+5+3+5) + E10 HU-056…060 (3+3+2+3+2) | 241 | Dashboards por rol, horas, formatos |
| **S9** (2 sem) | E11: HU-061/062 (5+5) + E12: HU-101…107 (5+8+8+5+8+8+5) | — | Indicadores SUNEDU/SINEACE, modalidades completas, comité |
| **S10** (2 sem) | E12: HU-109…116 (5+8+8+5+8+5+3) | — | Escalamiento, ZIP Decano, configuración, reportes, presupuesto 2% |
| **S11** (1 sem) | Pendientes 🟡: HU-031, HU-050/051, HU-054 + E12 HU-117…120 | — | Excel/PDF, correos, plazos, SERUS |
| **S12** (1 sem) | Harden: NFR-01/03/04/05, carga con 10 k registros, manual de operación | — | Release 1.0 |

**Criterio de salida de sprint:** todas las HU del sprint en DoD + demo + sin P0 abierta.

---

# 11. DEFINITION OF READY / DEFINITION OF DONE GLOBAL

## 11.1 Definition of Ready (antes de entrar al sprint)

- Historia tiene: épica, actor, descripción, valor, prioridad, estimación, CA numeradas, tareas, DoD.
- CA son verificables (prueba manual o automatizada) y no ambiguas.
- Diseño de pantalla/endpoint acordado (wireframe o firma de DTO).
- Dependencias de datos (tabla, catálogo, vista) existen o están en el mismo sprint.

## 11.2 Definition of Done (global — toda historia debe cumplir)

1. **Backend:** código en rama, `go vet ./...` y `go build ./cmd/server` verdes; validaciones de negocio en `service` (no en handler); DTO con binding tags; transición BPMN validada contra `RSU_Transicion_Estado`; auditoría automática.
2. **Frontend:** `npm run lint` y `npm run build` (tsc + vite) verdes; permisos aplicados vía `permissions.ts` + `RoleGuard`; aislamiento estudiantil respetado; estados con `Badge` por `color_ui`.
3. **QA:** CA 1..N verificados con datos de seed; casos límite probados; sin errores 500; logs sin datos sensibles.
4. **Documentación:** tabla(s) y endpoint(s) anotados en README/API; HU actualizada en `HU_62_COBERTURA.md` con estado (✅/🟡).
5. **Notificación:** si la HU lo indica, `RSU_Notificacion` creada con `rol_destino` correcto.
6. **NFR:** no introduce deuda en NFR-03/04/05; respuesta paginada < 500 ms con volumen de prueba.

## 11.3 Definición de "historia terminada"

Una historia se da por **terminada** solo cuando: todos sus **Criterios de aceptación** son ciertos **y** la **Definition of Done** (propia + global) está completa. El PO acepta o devuelve la historia con motivo.

---

# 12. GLOSARIO Y REFERENCIAS

| Término | Significado |
|---|---|
| **RSU** | Responsabilidad Social Universitaria (Ley 30220 Art.124) |
| **SSU** | Servicio Social Universitario (estudiante, V–X ciclo, ≥60 h, 2–5 estudiantes) |
| **PEP** | Proyecto de Extensión y Proyección (financiado o autofinanciado) |
| **DRSU** | Dirección de Responsabilidad Social Universitaria (nivel universidad) |
| **SERUS** | Sistema de Registro de Seguimiento de RSU (plataforma universidad) |
| **Punto de quiebre** | Descarga del paquete por el Decano y transferencia manual a la universidad |
| **BPMN** | Flujo de 16 estados gobernado por `RSU_Transicion_Estado` |
| **V°B°** | Visto Bueno |
| **SP** | Story point (Fibonacci: 1, 2, 3, 5, 8, 13) |
| **CA / DoD / DoR** | Criterios de aceptación / Definition of Done / Definition of Ready |
| **Ind.29** | Indicador 29 de SUNEDU (proyectos RSU, % docentes, % estudiantes, % presupuesto ≥2%) |
| **Est.25** | Estándar 25 de SINEACE (impacto social / acreditación) |
| **ODS** | Objetivos de Desarrollo Sostenible (1–17) |
| **Likert P01–P06** | 6 preguntas de satisfacción en escala 1–5 |
| **F-M03.01-RSU-001…019** | Modelos oficiales de formularios RSU (22 documentos) |

**Referencias internas:** `README.md` (quickstart), `AGENTS.md` (comandos), `HU_62_COBERTURA.md` (mapeo 62 HU ↔ endpoints/tablas), `HU_RSU_V3_MEJORADAS.md` (28 HU con UI/roles/notificaciones), `info/objetivo.txt` (diseño funcional V1.1), `info/reporte.html` (mapa SERUS/DRSU estudiante), `db/init.sql` (schema+seed), `backend/internal/router/router.go` (API), `frontend/src/utils/permissions.ts` (matriz de permisos).

**Base legal:** Ley 30220 (Art. 7.3, 59, 124, 125, 130) · Ley 28611 · DS 005-2019-MINEDU · DS 012-2020-MINEDU · DS 012-2009-MINAM · RVM 007-2022-MINEDU · SINEACE Modelo de Acreditación · ISO 21001 · ISO 26000 · Estatuto UNDC (Art. 8.j, 9.c, 113–116) · ROF UNDC (Art. 26, 75–76) · Reglamento RSU UNDC R-M03-RSU-001 Versión 04 (14/05/2026).

> Hecho para UNDC Cañete — RSU como función esencial y obligatoria (Ley 30220 Art.124). Fin del documento RSUFI.

