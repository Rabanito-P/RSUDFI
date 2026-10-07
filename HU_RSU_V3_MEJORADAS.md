# Historias de Usuario MEJORADAS V3 — RSU UNDC (Responsabilidad Social Universitaria)
> **Base:** Capturas reales + Ley 30220 Art.124-125 + BPMN 16 estados + 12 roles actor + PostgreSQL 18  
> **Versión:** 3.0 — Estudiante aislado + Roles finos + Notificaciones BPMN  
> **Fecha:** 24/09/2026 · Cañete, Lima — América/Lima  
> **Stack:** Go 1.22 Gin/GORM + React 18 Vite TS + Tailwind + PostgreSQL 18

---

## 📌 Qué mejora V3 respecto a V2

| Área | V2 | V3 (esta versión) |
|------|----|-------------------|
| **Estudiante** | Veía `/proyectos` (todos) si navegaba | **AISLADO:** solo `GET /estudiantes/:id/proyectos` (join líder OR `RSU_Participante_Estudiante` ACTIVO/INSCRITO). Ruta `/proyectos` redirige a `/mis-proyectos`. Backend `IsEstudianteMiembro` + frontend `RoleSidebar` filtrado. Si intenta abrir proyecto ajeno → banner rojo “Acceso denegado” y 403 en upload. |
| **Roles** | 4 globales (ESTUDIANTE/DOCENTE/DIRECTIVO/ADMIN) | **12 finos** `RSU_Rol_Actor` (IDs 1..12) con pantallas y botones exclusivos por lane. Sidebar dinámico por `rol_actor` (ej. `DIR_ESCUELA` solo ve viabilidades + conformidad, `DIR_RS_FACULTAD` ve banco+presupuesto+monitoreo). Ver matriz §2. |
| **Notificaciones** | Badge estático “3” | **Reales:** tabla `RSU_Notificacion` (FK `rol_destino`→`RSU_Rol_Actor.codigo`), endpoints `GET /notificaciones?rol_destino=...`, `GET /count`, `PATCH /:id/leido`, push automático en `Create` y `Transicion` (tipo `TRANSICION/PROYECTO_CREADO/AVANCE_EQUIPO`). Header hace polling 30s + dropdown con marcar leída. |
| **Documentos** | Solo “PDF” | **Formato + tamaño + etapa:** `RSU_Tipo_Documento.etapa` (FORMULACION/EJECUCION/EVALUACION/TRANSVERSAL) + `obligatorio` + reglas de `tamaño_bytes`/`hash`. Cada HU indica tabla, formato y cuándo se sube. |
| **Botones** | Nombre genérico | **Nombre exacto + color + ubicación** (ej. `[✅ APROBAR V°B°]` verde `bg-emerald-600` abajo-derecha, `[❌ RECHAZAR]` rojo outline). |
| **Permisos** | Solo descripción | **Matriz ejecutable** `utils/permissions.ts` con `ESTADOS[16]` + `ROLES_12[12]` + `canStudentUploadDocs` + `canAccessRoute` + `estudianteProyectosEndpoint`. |

---

## 🧭 1. Navegación por rol (sidebar real implementado)

### Estudiante Proponente (`ESTUDIANTE_PROP`, ID 3) — aislado
```
┌─────────────────────────────────┐
│  [U] UNDC RSU — ESTUDIANTE      │
│  Ana Quispe · ESTUDIANTE_PROP   │
├─────────────────────────────────┤
│  🏠 Inicio (Mi resumen + equipo)│
│  📁 Mis proyectos      ← SOLO los del equipo (join)
│  ➕ Proponer proyecto  ← BORRADOR → Enviar
│  ⏱️ Mis horas y créditos         │
│  📄 Constancias                 │
│  📋 Mis actividades (solo mías) │
│  📎 Mis documentos (solo equipo)│
└─────────────────────────────────┘
Ruta /proyectos BLOQUEADA → redirect /mis-proyectos
```

### Estudiante Ejecutor (`ESTUDIANTE_EJEC`, ID 4) — aislado
```
┌─────────────────────────────────┐
│  🏠 Inicio                      │
│  📁 Mis proyectos (miembro)     │
│  📋 Actividades campo (HU-011)  │
│  📎 Documentos (fotos)          │
│  ⏱️ Mis horas                   │
│  📄 Constancias                 │
└─────────────────────────────────┘
```

### Docente Responsable (`DOCENTE_RESP`, ID 1) / Colab (ID 2)
```
┌─────────────────────────────────┐
│  🏠 Inicio docente (carga 6.5/8h)│
│  📁 Proyectos asesorados (solo donde soy asesor)│
│  💰 Mi carga RSU (Art.86)       │
│  📋 Actividades campo           │
│  ✅ Entregables (verificar SUBIDO)│
│  📊 Encuestas impacto P01-P06   │
│  👁️ Monitoreo (% avance)        │
└─────────────────────────────────┘
```

### Director de Escuela (`DIR_ESCUELA`, ID 5)
```
┌─────────────────────────────────┐
│  📊 Dashboard Escuela           │
│  ✅ Viabilidades pendientes  •   │ ← EN_REVISION_ESCUELA
│  ✅ Conformidad informes         │ ← INFORME_FINAL_PRESENTADO
│  📄 Padrón beneficiarios        │
│  📊 Reportes Escuela            │
│  📁 Proyectos de mi Escuela     │
└─────────────────────────────────┘
```

### Director RS Facultad (`DIR_RS_FACULTAD`, ID 7)
```
┌─────────────────────────────────┐
│  📊 Dashboard Facultad          │
│  📋 Banco de proyectos  •       │ ← CON_VB_ESCUELA
│  💰 Presupuesto y vouchers      │ ← Art.125 2%
│  🔍 Monitoreo de campo          │ ← EN_MONITOREO
│  📈 Evaluación impacto          │
│  📑 Lecciones aprendidas        │
└─────────────────────────────────┘
```

### Consejo de Facultad (`CONSEJO_FACULTAD`, ID 8)
```
┌─────────────────────────────────┐
│  📋 Dictámenes pendientes  •     │ ← EN_DICTAMEN_CONSEJO
│  📄 Cierres por aprobar    •     │ ← CON_CONFORMIDAD_ESCUELA → CERRADO
│  ✅ Validar evaluación          │ ← EN_EVALUACION_IMPACTO
│  📑 Resoluciones PDF            │
└─────────────────────────────────┘
```

### Director de Departamento (`DIR_DEPTO`, ID 9) — carga no lectiva
```
┌─────────────────────────────────┐
│  💼 Cargas por asignar  •       │ ← APROBADO_CON_RESOLUCION → EN_ASIGNACION_CARGA
│  📋 Carga docente (Art.79/86)   │
└─────────────────────────────────┘
```

### Director Central RS / VRA (`DIR_CENTRAL_RS`, ID 10)
```
┌─────────────────────────────────┐
│  📄 Padrón oficial  •            │ ← REGISTRADO_OFICIAL
│  📊 Memoria Anual (SUNEDU Ind.29)│ ← REPORTADO_SUNEDU
│  💰 Presupuesto institucional 2% │
└─────────────────────────────────┘
```

### Unidad Abastecimiento (`UNIDAD_ABAST`, ID 11)
```
┌─────────────────────────────────┐
│  💰 Vouchers por verificar  •    │ ← EN_EJECUCION
│  📄 Ejecución presupuestal (Pecosa)│
└─────────────────────────────────┘
```

### Comité Calidad (`COMITE_CALIDAD`, ID 12)
```
┌─────────────────────────────────┐
│  📊 Impacto por procesar  •      │ ← EN_EVALUACION_IMPACTO
│  📋 Encuestas P01-P06 (Likert)  │
│  📈 Matriz indicadores (% logro)│
└─────────────────────────────────┘
```

---

## 👥 2. Matriz de 12 roles — permisos, pantallas, botones y documentos

| # | Código | Nombre | Tipo | Global | Pantallas principales | Botones CLAVE (color/ubicación) | Documentos que sube (formato) | Puede / No puede |
|---|--------|--------|------|--------|----------------------|--------------------------------|------------------------------|------------------|
| 1 | `DOCENTE_RESP` | Docente Responsable | DOCENTE | DOCENTE | Proyectos asesorados, Actividades, Entregables, Monitoreo | `[ENVIAR A ESCUELA]` verde `bg-emerald-600` abajo-derecha (BORRADOR); `[REGISTRAR MONITOREO]` verde; `[APROBAR ENTREGABLE]` verde / `[OBSERVAR]` ámbar | Perfil (PDF 10MB) al crear, Informe final (PDF), Pecosa (PDF) | ✅ Crea BORRADOR, envía a Escuela, ejecuta campo<br>❌ No emite Resoluciones |
| 2 | `DOCENTE_COLAB` | Docente Colaborador | DOCENTE | DOCENTE | Proyectos colaborados, Actividades | `[SUBIR EVIDENCIA]` verde | Fotos (JPG/PNG 5MB) | ✅ Apoya ejecución<br>❌ No asigna carga |
| 3 | `ESTUDIANTE_PROP` | Estudiante Proponente (líder) | ESTUDIANTE | ESTUDIANTE | **Mis proyectos (líder) — AISLADO**, Crear proyecto, Justificar falta (máx2), Modificar informe, Autorización imagen | `[PROPONER PROYECTO]` sky-600 header; `[GUARDAR BORRADOR]` slate outline; `[ENVIAR A ESCUELA]` verde; `[NUEVA JUSTIFICACIÓN]` verde (deshabilitado si 2/2) | Perfil (PDF*), Anexos (PDF/JPG opc), Justificación (PDF*), Declaración jurada (PDF*) | ✅ Ve SOLO su equipo; propone; justifica 2<br>❌ No ve proyectos de otros equipos; no dicta Resoluciones |
| 4 | `ESTUDIANTE_EJEC` | Estudiante Ejecutor (miembro) | ESTUDIANTE | ESTUDIANTE | **Mis proyectos (miembro) — AISLADO**, Registro evidencias (fotos 5), Encuesta docente | `[GUARDAR ACTIVIDAD]` verde; `[SUBIR FOTOS]` verde (drag&drop); `[SUBIR ENTREGABLE]` emerald | Fotos (JPG/PNG ≥1, máx5), Documento adicional (PDF opc) | ✅ Ejecuta, sube foto, marca asistencia<br>❌ No crea borrador si ya existe |
| 5 | `DIR_ESCUELA` | Director Escuela Profesional | AUTORIDAD | DIRECTIVO | Viabilidades pendientes, Conformidad informes, Padrón beneficiarios | `[✅ APROBAR V°B°]` verde 600 derecha; `[⚠️ OBSERVAR]` ámbar centro; `[❌ RECHAZAR]` rojo outline izq | Informe Técnico Viabilidad (PDF*), Proveído Conformidad (PDF*) | ✅ V°B° + conformidad checklist 5<br>❌ No prioriza banco facultad |
| 6 | `COMITE_PS` | Comité Proyección Social | COMITE | DIRECTIVO | Revisión no duplicidad | `[APROBAR]` verde | — (solo valida) | ✅ No duplica; alinea Plan RS |
| 7 | `DIR_RS_FACULTAD` | Director RS Facultad | AUTORIDAD | DIRECTIVO | Banco proyectos (priorizar), Presupuesto/vouchers, Monitoreo in situ, Lecciones | `[💾 GUARDAR PRIORIDADES]` slate; `[📄 GENERAR PLAN ANUAL]` undc-700; `[➡️ ENVIAR A CONSEJO]` verde; `[💾 GUARDAR MONITOREO]` verde con slider 0-100% | Plan Anual (PDF), Informe Monitoreo (PDF*), Lecciones (PDF) | ✅ Prioriza, monetiza 2%, monitorea % avance<br>❌ No emite Resoluciones |
| 8 | `CONSEJO_FACULTAD` | Consejo Facultad | AUTORIDAD | DIRECTIVO | Dictámenes, Cierres, Validar evaluación | `[✅ APROBAR]` verde; `[❌ RECHAZAR]` rojo; checklist constancias ☑ | **Resoluciones** (PDF* obligatorio: N° `R.C.F. N° 045-2026-UNDC-FI`, fecha, tipo) | ✅ Emite Resoluciones (aprobación/cierre/evaluación) — único con validez legal<br>❌ No ejecuta campo |
| 9 | `DIR_DEPTO` | Director Depto. Académico | AUTORIDAD | DIRECTIVO | Asignación carga no lectiva | `[✅ APROBAR ASIGNACIÓN]` verde (bloqueado si >8h) | Plan Carga Horaria (PDF*) | ✅ Valida `horas_asignadas+horas_nuevas ≤ carga_no_lectiva_max` Art.86 |
| 10 | `DIR_CENTRAL_RS` | Director Central RS / VRA | AUTORIDAD | DIRECTIVO | Padrón oficial, Memoria Anual, Reportes SUNEDU | `[📄 GENERAR PADRÓN OFICIAL]` undc-700; `[📊 EXPORTAR EXCEL]` white | Memoria Anual (PDF), Reporte Anual (Excel) | ✅ Consolida + reporta Ind.29 ≥2% |
| 11 | `UNIDAD_ABAST` | Unidad Abastecimiento | ADMINISTRATIVO | DIRECTIVO | Presupuesto, Vouchers | `[💾 REGISTRAR MOVIMIENTO]` verde; `[VERIFICAR VOUCHER]` verde | Pecosa/Factura/Boleta (PDF*), Voucher (JPG/PNG/PDF*) | ✅ Verifica EJECUCION/TRANSFERENCIA |
| 12 | `COMITE_CALIDAD` | Comité Calidad | COMITE | DIRECTIVO | Procesar impacto, Matriz indicadores | `[📊 EXPORTAR EXCEL]`; `[📄 GENERAR MATRIZ PDF]` | Matriz indicadores (PDF/Excel) | ✅ Calcula promedio dimensión + % logro Likert |

> **AISLAMIENTO:** Los dos roles estudiante comparten la misma vista `GET /estudiantes/:id/proyectos`. El backend hace `LEFT JOIN RSU_Participante_Estudiante pe ON pe.id_proyecto=RSU_Proyecto.id_proyecto AND pe.estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO') WHERE RSU_Proyecto.id_estudiante_lider=:id OR pe.id_estudiante=:id`. **No hay `GET /proyectos` para estudiante** — frontend hace `Navigate` a `/mis-proyectos` si intenta. Upload valida `isMiembro` (líder o pe).

---

## 🔔 3. Matriz de Notificaciones (HU-052..055) — 12 lanes

### 3.1 Modelo
```sql
RSU_Notificacion(
  id_notificacion PK,
  id_usuario INT NULL,                 -- opcional: usuario destinatario
  rol_destino VARCHAR(50) NOT NULL FK → RSU_Rol_Actor(codigo),
  tipo VARCHAR(30) NOT NULL,           -- PROYECTO_CREADO | TRANSICION | AVANCE_EQUIPO | ASIGNACION | EVALUACION | REPORTE | PRESUPUESTO ...
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT,
  id_proyecto INT NULL FK → RSU_Proyecto,
  leido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
-- índices: (rol_destino), (leido), (created_at)
```

### 3.2 Endpoints (backend `handler/notificacion.go` + `router.go`)
| Método | Ruta | Query/Body | Uso |
|--------|------|-----------|-----|
| `GET` | `/api/v1/notificaciones` | `?rol_destino=DIR_ESCUELA&limit=12&only_unread=true` | Header dropdown — lista por lane |
| `GET` | `/api/v1/notificaciones/count` | `?rol_destino=DIR_ESCUELA` | Badge rojo |
| `GET` | `/api/v1/notificaciones/counts` | `?roles=DIR_ESCUELA,CONSEJO_FACULTAD` | Dashboard directivo — múltiples lanes |
| `POST` | `/api/v1/notificaciones` | `{rol_destino, tipo, titulo, mensaje, id_proyecto}` | Manual / seed |
| `PATCH` | `/api/v1/notificaciones/:id/leido` | — | Marca una como leída |
| `PATCH` | `/api/v1/notificaciones/marcar-todas-leidas` | `?rol_destino=DIR_ESCUELA` | “Marcar todas leídas” en Header |

### 3.3 Disparo automático (backend `service/services.go`)
| Evento | Código | Rol destino | Título ejemplo | Mensaje | `tipo` |
|--------|--------|-------------|---------------|---------|--------|
| Crear proyecto (BORRADOR) | `Create()` | `ESTUDIANTE_PROP` + `ESTUDIANTE_EJEC` | `Proyecto creado en BORRADOR — RSU-2026-011` | “Tu proyecto RSU-2026-011 «Campaña anemia» quedó en BORRADOR. Equipo puede subir docs (HU-033).” | `PROYECTO_CREADO` |
| Crear proyecto con asesor | `Create()` | `DOCENTE_RESP` | `Asignación como asesor — RSU-2026-011` | “Has sido asignado como asesor…” | `ASIGNACION` |
| Transición APROBADA | `Transicion()` | `ESTADO_DESTINO.actor` (mapa `estadoActorMap`) | `Transición BORRADOR→EN_REVISION_ESCUELA — RSU-2026-011` | “Proyecto RSU-2026-011 → En revisión Escuela (EN_REVISION). Resultado: APROBADO. Revisa tu bandeja.” | `TRANSICION` |
| Transición APROBADA (equipo) | `Transicion()` | `ESTUDIANTE_EJEC` + `DOCENTE_RESP` | `¡Avance! RSU-2026-011 cambió a En revisión Escuela` | “Equipo: pueden seguir subiendo evidencias.” | `AVANCE_EQUIPO` |

**Frontend Header:** `useEffect` polling 30s a `GET /notificaciones?rol_destino=user.rol_actor&limit=12` + contador no leídos. Al abrir campana se ve lista + botón “Marcar todas leídas”.

### 3.4 Seed (db/init.sql)
```sql
INSERT INTO "RSU_Notificacion" ("rol_destino","tipo","titulo","mensaje","leido") VALUES
('DIR_ESCUELA','TRANSICION','Nuevo proyecto en revisión','RSU-2026-011 Campaña anemia requiere tu V°B°',false),
('DIR_RS_FACULTAD','TRANSICION','Priorización pendiente','RSU-2026-014 Reciclaje Quilmaná espera priorización (BPMN 4)',false),
('CONSEJO_FACULTAD','TRANSICION','Dictamen pendiente','RSU-2026-009 Alfabetización digital para Consejo (BPMN 5)',false),
('DOCENTE_RESP','ASIGNACION','Horas asignadas','Se te asignaron 4h NO_LECTIVA en RSU-2026-007',false),
('ESTUDIANTE_PROP','PROYECTO_CREADO','Proyecto creado','Tu RSU-2026-011 quedó en BORRADOR. Equipo puede subir docs',false),
('ESTUDIANTE_EJEC','INVITACION','Invitación a equipo','Has sido invitado como Ejecutor en RSU-2026-007 por Ana',false),
('DIR_CENTRAL_RS','REPORTE','Reporte SUNEDU','Memoria anual lista para Ind.29',false),
('UNIDAD_ABAST','PRESUPUESTO','Voucher pendiente','EJECUCION S/4,500 en RSU-2026-007 requiere Pecosa',false),
('COMITE_CALIDAD','EVALUACION','Evaluación impacto','RSU-2026-003 listo para evaluación (BPMN 14)',false);
```

### 3.5 Quién recibe qué (resumen visual)
```
BORRADOR (ESTUD_PROP) ──Transicion APROBADO──▶ DIR_ESCUELA (🔔) ──▶ equipo (ESTUD_EJEC+DOC_RESP) avisa avance
DIR_ESCUELA aprueba ──▶ COMITE_PS / DIR_RS_FACULTAD (🔔)
DIR_RS_FACULTAD envía ──▶ CONSEJO_FACULTAD (🔔)
CONSEJO aprueba ──▶ DIR_DEPTO (🔔) ──▶ equipo notifica REGISTRADO_OFICIAL → DIR_CENTRAL
EN_EJECUCION ──▶ DIR_RS_FACULTAD monitorea (🔔)
INFORME_FINAL ──▶ DIR_ESCUELA conformidad (🔔)
CERRADO ──▶ COMITE_CALIDAD (🔔) ──▶ DIR_CENTRAL reporta SUNEDU (🔔)
Cada 🔔 = fila RSU_Notificacion + badge Header + entrada bandeja
```

---

## 🎯 4. Historias de Usuario MEJORADAS (28) — descripción UI + botones + documentos + roles + notificación

> **Convenciones botones:** `[TEXTO]` = `bg-color ubicación` — ej. `[✅ APROBAR V°B°] verde bg-emerald-600 abajo-derecha`  
> **Documentos:** Formato, tamaño, etapa `RSU_Tipo_Documento.etapa`, obligatorio.  
> **Notificación:** `→ rol_destino (tipo)` disparada al ejecutar la HU.  
> **Aislamiento estudiante:** marcado en cada HU donde aplica.

### ÉPICA 1: FORMULACIÓN

#### HU-001 — Crear proyecto de RSU (AISLADO)
| Campo | Detalle |
|-------|---------|
| Actor | 🧑‍🏫 DOCENTE / 🎓 ESTUDIANTE_PROP (solo su equipo verá el proyecto) |
| Prioridad | 🔴 Crítica · BPMN `BORRADOR` (orden 1) · `T01` |
| Pantalla | `Formulario Nuevo Proyecto` — 4 pasos con barra progreso |
| Ruta | `/proyectos/nuevo` (estudiante) — si ya es miembro de un BORRADOR no duplica |

```
┌────────────────────────────────────────────────────────────┐
│  ← Volver    NUEVO PROYECTO DE RSU  [PASO 1/4 ●●○○]        │
├────────────────────────────────────────────────────────────┤
│  📝 PASO 1: DATOS GENERALES                                │
│  Título*: [_________________________________] (20-300)     │
│  Tipo*: [Proyección Social ▼]  Línea*: [Salud ▼]           │
│  Escuela*: [Ing. Sistemas ▼]  Semestre*: [2026-1 ▼]       │
│  Sector*: [Municipalidad Nuevo Imperial] N° Benef*: [4]    │
│  Lugar*: [Cañete]  Distrito*: [Nuevo Imperial ▼]           │
├────────────────────────────────────────────────────────────┤
│  📝 PASO 2: DESCRIPCIÓN                                    │
│  Descripción*: [________________________]                  │
│  Objetivo general*: [___________________]                  │
│  Objetivos específicos*: [+ Agregar objetivo]              │
├────────────────────────────────────────────────────────────┤
│  📝 PASO 3: FECHAS Y PRESUPUESTO                           │
│  Fecha inicio*: [13/05/2026]  Fecha fin*: [31/08/2026]    │
│  Presupuesto solicitado*: [5000.00] S/ (≤50000)            │
├────────────────────────────────────────────────────────────┤
│  📝 PASO 4: DOCUMENTOS                                     │
│  📎 Perfil del Proyecto (PDF*, máx 10MB) [Seleccionar] ✓  │
│  📎 Anexos (PDF/JPG opc) [Seleccionar archivos]            │
│                                                            │
│  [CANCELAR gris izq] [GUARDAR BORRADOR slate centro] [ENVIAR verde emerald derecha] │
└────────────────────────────────────────────────────────────┘
```

**CA:**
- Validaciones tiempo real: título 20-300, presupuesto ≤50000 positivo, fecha fin > inicio, N° beneficiarios entero >0.
- Autogenera `UNDC-RSU-2026-NNN` al guardar primera vez.
- Estado inicial `BORRADOR` (edición total). Solo el creador y luego miembros invitados ven el proyecto (aislamiento).
- Botones abajo: `CANCELAR` gris sin acción, `GUARDAR BORRADOR` slate guarda sin validar, `ENVIAR A ESCUELA` emerald valida y → `EN_REVISION_ESCUELA` (dispara correo mock + `RSU_Flujo_Aprobacion` + notificación).
- Tablas: `RSU_Proyecto, RSU_Tipo_Proyecto, RSU_Linea_Accion, RSU_Documento, RSU_Flujo_Aprobacion`
- **Notificación al crear:** → `ESTUDIANTE_PROP` + `ESTUDIANTE_EJEC` (PROYECTO_CREADO) + `DOCENTE_RESP` (ASIGNACION si tiene asesor)
- **Documento:** `Perfil del Proyecto` PDF obligatorio 10MB etapa `FORMULACION`.

#### HU-002 — Registrar docente asesor
| Campo | Detalle |
|-------|---------|
| Actor | 🎓 ESTUDIANTE_PROP |
| Pantalla | `Modal: Seleccionar Docente Asesor` (desde formulario o detalle) |

```
┌────────────────────────────────────────────────────────────┐
│  SELECCIONAR DOCENTE ASESOR                          [X]   │
│  🔍 Buscar por nombre/código: [___________] [Buscar sky]  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Código  │ Docente            │ Carga disp. │ Acción  │  │
│  │ DOC-001 │ ROQUE TITO, Edwin  │ 6/8h        │ [✓ verde]│ │
│  │ DOC-002 │ GARAY TORRES, Angel│ 4/8h        │ [✓]     │  │
│  │ DOC-003 │ PÉREZ LÓPEZ, María │ 0/8h        │ [❌ gris deshabilitado]│
│  └──────────────────────────────────────────────────────┘  │
│  ⚠️ 0h no seleccionable                                   │
│  [CANCELAR gris] [CONFIRMAR ASESOR verde emerald]          │
└────────────────────────────────────────────────────────────┘
```

**CA:** Lista docentes de la misma escuela; carga = `carga_no_lectiva_max - SUM(horas APROBADAs)`; 0h deshabilitado ❌; al confirmar `UPDATE RSU_Proyecto.id_docente_asesor` + correo mock. Tablas `Docente, RSU_Proyecto, RSU_Asignacion_Docente`.

#### HU-003 — Validar ciclo mínimo (sistema)
| Actor | 🤖 SISTEMA |
| Pantalla | `Modal validación` (invisible salvo error) |

```
┌────────────────────────────────────────────────────────────┐
│  ⚠️  ESTUDIANTE NO ELEGIBLE  (rojo/ámbar modal centro)     │
│  Proyecto tipo: Proyección Social — requiere ciclo ≥5      │
│  Tu ciclo actual: III (3)  ❌ No cumples                   │
│  Podrás inscribirte desde ciclo V.         [ENTENDIDO gris]│
└────────────────────────────────────────────────────────────┘
```

**CA:** Al inscribir consulta `Estudiante_Ciclo.ciclo_numerico` vs `RSU_Tipo_Proyecto.ciclo_minimo_estudiante`; bloquea y muestra modal; si ok marca `validacion_ciclo=TRUE`. Tabla `Estudiante_Ciclo, RSU_Tipo_Proyecto, RSU_Participante_Estudiante`. Notificación no aplica (bloqueo).

#### HU-004 — Enviar proyecto a revisión de Escuela
| Actor | 🧑‍🏫 DOCENTE / 🎓 ESTUDIANTE_PROP (líder o cualquier miembro puede accionar ENVIAR si es líder) |
| Pantalla | `Fases del proyecto` — card datos + botones abajo-derecha |

```
┌────────────────────────────────────────────────────────────┐
│  FASES DEL PROYECTO  [BORRADOR gris]                       │
│  Título: Sistema inteligente...  Líder: KEVIN CAMA 2026-1  │
│  Tipología: Proyección social  Asesor: Edwin Roque        │
│  Sector: Municipalidad ... N° Benef: 4                    │
│  Fecha Inicio: 13/05/2026  Fin: 31/08/2026                 │
│  Estado: [Borrador]  Proyecto: [📥]  Ficha aprobación: [📥]│
│                                                            │
│  [▶️ ENVIAR A ESCUELA verde emerald derecha] [✏️ EDITAR slate] [🗑️ CANCELAR rojo outline] │
└────────────────────────────────────────────────────────────┘
```

**CA:** Botón `ENVIAR A ESCUELA` solo si `BORRADOR`; valida docs obligatorios FORMULACION existentes; si falta muestra modal lista pendientes; si ok → `EN_REVISION_ESCUELA` + `RSU_Flujo_Aprobacion(DOCENTE_RESP)` + **🔔 `DIR_ESCUELA` (TRANSICION)** + correo Director Escuela con deep link. Tablas `RSU_Proyecto, RSU_Flujo_Aprobacion, RSU_Documento`.

#### HU-005 — Evaluar viabilidad técnica (DIR_ESCUELA)
| Actor | 👔 `DIR_ESCUELA` (ID 5) |
| Pantalla | `Panel Director → Viabilidades Pendientes` |

```
┌────────────────────────────────────────────────────────────┐
│  EVALUACIÓN VIABILIDAD — UNDC-RSU-2026-001  [📥 Ver perfil]│
│  Datos: Ing. Sistemas · S/5,000                            │
│  ✅ CHECKLIST (5)                                          │
│  [✓] Viabilidad técnica  [✓] Presupuesto justificado       │
│  [✓] No duplica           [✓] Alineado Plan RS             │
│  [ ] Beneficiarios correctos                               │
│  📝 Observaciones: [__________________] (oblig si rechaza)│
│  📎 Informe Técnico Viabilidad (PDF*): [Seleccionar] ✓    │
│                                                            │
│  [❌ RECHAZAR rojo outline izq] [⚠️ OBSERVAR ámbar medio] [✅ APROBAR V°B° verde emerald derecha] │
└────────────────────────────────────────────────────────────┘
```

**CA:** Checklist 5; si `APROBAR V°B°` obligatorio adjuntar PDF; → `CON_VB_ESCUELA`; registra `RSU_Verificacion(VIABILIDAD_TECNICA, NO_DUPLICIDAD)` + `RSU_Flujo_Aprobacion(DIR_ESCUELA)` + **🔔 `COMITE_PS` / `DIR_RS_FACULTAD` (TRANSICION)** + notifica docente. Tablas `RSU_Verificacion, RSU_Flujo_Aprobacion, RSU_Documento`.

#### HU-006 — Consolidar banco de proyectos (DIR_RS_FACULTAD)
| Actor | 👔 `DIR_RS_FACULTAD` (ID 7) |
| Pantalla | `Panel Facultad → Banco de Proyectos` — tabla priorizable |

```
┌────────────────────────────────────────────────────────────┐
│  BANCO FACULTAD INGENIERÍA  [Escuela ▼][Tipo ▼][Buscar]   │
│  ☐ Código      │ Título     │ Escuela │ Presup │ Prioridad│
│  ☐ RSU-2026-001│ Sistema... │ Ing.Sis │ 5,000  │ [Alta ▼] │
│  Total priorizado: S/10,500 / Disponible S/25,000 (42%)    │
│  Alerta si >2% presupuesto facultad                        │
│  [📄 GENERAR PLAN ANUAL undc-700 centro]                   │
│  [⬅️ CANCELAR gris] [➡️ ENVIAR A CONSEJO verde derecha]   │
└────────────────────────────────────────────────────────────┘
```

**CA:** Checkbox múltiple + dropdown Alta/Media/Baja; cálculo tiempo real presupuestado vs disponible; botón `GENERAR PLAN ANUAL` produce PDF; al enviar → `EN_PRIORIZACION_FACULTAD`; **🔔 `CONSEJO_FACULTAD` (TRANSICION)**. Tablas `RSU_Proyecto, RSU_Documento`.

#### HU-007 — Dictaminar y aprobar con Resolución (CONSEJO_FACULTAD)
| Actor | ⚖️ `CONSEJO_FACULTAD` (ID 8) |
| Pantalla | `Panel Consejo → Dictámenes` |

```
┌────────────────────────────────────────────────────────────┐
│  DICTAMEN SESIÓN N°05-2026  [📥 Ver expediente completo]   │
│  N° Resolución*: [R.C.F. N°045-2026-UNDC-FI]               │
│  Fecha*: [24/09/2026]  Tipo*: [APROBACION ▼]               │
│  📎 PDF Resolución* [Seleccionar] ✓ resolucion_045.pdf     │
│  Observaciones opc: [________________]                     │
│  [❌ RECHAZAR rojo] [⚠️ OBSERVAR ámbar] [✅ APROBAR verde] │
└────────────────────────────────────────────────────────────┘
```

**CA:** Campos número, fecha, tipo obligatorios + PDF firmado; al aprobar guarda `id_resolucion_aprobacion, fecha_aprobacion` + → `APROBADO_CON_RESOLUCION` + `RSU_Flujo_Aprobacion(CONSEJO_FACULTAD)` + **🔔 `DIR_DEPTO` + `DIR_CENTRAL_RS` + equipo (AVANCE_EQUIPO)**. Tablas `RSU_Resolucion, RSU_Flujo_Aprobacion, RSU_Proyecto`.

#### HU-008 — Asignar carga no lectiva (DIR_DEPTO)
| Actor | 👔 `DIR_DEPTO` (ID 9) |
| Pantalla | `Panel Departamento → Asignación Carga` — validación tiempo real |

```
┌────────────────────────────────────────────────────────────┐
│  Docente: ROQUE TITO, Edwin (DOC-001) · Ordinario TC 8h   │
│  Carga actual: RSU-2026-001 2h + RSU-2026-005 3h =5/8h Disp:3h│
│  Proyecto: UNDC-RSU-2026-001  Horas*: [2.00] Ciclo*: [2026-1▼]│
│  ✅ 5.00+2.00=7.00 ≤8.00 OK  (rojo si excede, bloquea)     │
│  📎 Plan Carga Horaria (PDF*): [Seleccionar] ✓             │
│  [❌ RECHAZAR rojo] [✅ APROBAR ASIGNACIÓN verde derecha]  │
└────────────────────────────────────────────────────────────┘
```

**CA:** Muestra disponible; valida `SUM ≤ carga_no_lectiva_max`; registra `RSU_Asignacion_Docente(APROBADA)` + PDF; **🔔 `DOCENTE_RESP` (ASIGNACION)**. Tablas `RSU_Asignacion_Docente, Docente, RSU_Documento`.

#### HU-009 — Registrar en padrón oficial (DIR_CENTRAL_RS)
| Actor | 👔 `DIR_CENTRAL_RS` (ID 10) |
| Pantalla | `Panel Central → Padrón Oficial` |

```
┌────────────────────────────────────────────────────────────┐
│  PADRÓN OFICIAL RSU — 2026  [Facultad ▼][Estado ▼][🔍]    │
│  Código      │ Título     │ Facultad │ Estado =APROBADO    │
│  RSU-2026-001│ Sistema... │ Ing.     │ APROBADO             │
│  RESUMEN: 12 proyectos ·15 docentes ·48 est ·320 benef ·S/45k (2.3% ✅)│
│  [📄 GENERAR PADRÓN PDF undc-700] [📊 EXPORTAR EXCEL white]│
│  [REGISTRAR OFICIAL verde] (→ REGISTRADO_OFICIAL)         │
└────────────────────────────────────────────────────────────┘
```

**CA:** Tabla todos los `APROBADO_CON_RESOLUCION`; cambia a `REGISTRADO_OFICIAL`; calcula resumen tiempo real; **🔔 `DIR_RS_FACULTAD` + `DIR_CENTRAL_RS` (REPORTE)**. Tablas `RSU_Proyecto, RSU_Reporte_Anual`.

### ÉPICA 2: EJECUCIÓN

#### HU-010 — Coordinar cronograma de campo (DOCENTE/ESTUDIANTE_PROP — aislado del equipo)
| Actor | 🧑‍🏫 DOCENTE_RESP / 🎓 ESTUDIANTE_PROP (miembro) |
| Pantalla | `Ejecución → Cronograma` |

```
┌────────────────────────────────────────────────────────────┐
│  CRONOGRAMA — RSU-2026-001  [+ AGREGAR ACTIVIDAD sky]      │
│  N° │ Actividad    │ Fecha      │ Hora  │ Lugar   │ Acc   │
│  1  │ Capacitación │ 22/07/2026 │ 13:30 │ Mun.Nuev│ [🗑️] │
│  📎 Acta Compromiso con comunidad (PDF*): [Seleccionar] ✓ │
│  [💾 GUARDAR slate] [▶️ INICIAR EJECUCIÓN verde emerald derecha] │
└────────────────────────────────────────────────────────────┘
```

**CA:** Tabla editable agregar/eliminar; obligatorio `Acta Compromiso` firmada; al iniciar → `EN_EJECUCION`; **🔔 `DOCENTE_RESP`+`ESTUDIANTE_EJEC` (AVANCE_EQUIPO)**. Tablas `RSU_Actividad_Campo, RSU_Documento`. *Nota aislamiento:* cualquier miembro ve el mismo cronograma filtrado por su proyecto (no ve otros equipos).

#### HU-011 — Registrar actividad de campo (ESTUDIANTE — cualquier miembro)
| Actor | 🎓 ESTUDIANTE_EJEC / ESTUDIANTE_PROP (cualquier miembro ACTIVO) |
| Pantalla | `Registro de Evidencias → Nueva Actividad` (captura 3) |

```
┌────────────────────────────────────────────────────────────┐
│  📷 REGISTRO ACTIVIDAD Y FOTOGRAFÍAS  [← Historial slate] │
│  📅 Fecha*: [22/09/2026] (no futura)                       │
│  ✏️ Nombre*: [Ingresa el nombre_____________]              │
│  ⏱️ Horas*: [0]  Minutos*: [0] (0-23 / 0-59)               │
│  🕐 Hora fin*: [__:__] (debe ser > inicio)                │
│  📝 Descripción*: [Describe..._______] (≥20 chars)         │
│  📸 Fotografías (máx5 JPG/PNG 5MB c/u): [+ Subir] ✓foto1  │
│  📎 Doc adicional opc: [Seleccionar]                       │
│  [❌ CANCELAR gris] [💾 GUARDAR ACTIVIDAD verde derecha]  │
└────────────────────────────────────────────────────────────┘
```

**CA:** Fecha autocompleta hoy editable no futura; horas/minutos validado; hora fin > inicio; descripción ≥20; ≥1 foto JPG/PNG 5MB; cualquier miembro registra; vincula a entregable. Tablas `RSU_Actividad_Campo, RSU_Actividad_Foto, RSU_Entregable`. *Aislado:* solo si `isMiembro(proyecto, user.id)` true, else 403. **Notificación no automática** (actividad no cambia estado).

#### HU-012 — Subir fotos (ESTUDIANTE — miembro)
| Pantalla | `Modal: Subir Fotografías` |

```
┌────────────────────────────────────────────────────────────┐
│  SUBIR FOTOGRAFÍAS  [X gris arriba-derecha]                │
│  Arrastra aquí o [Seleccionar archivos sky]  JPG/PNG 5MB  │
│  Previs: [foto1] Desc: [___] [🗑️ rojo]   [foto2] ...      │
│  [CANCELAR gris] [SUBIR FOTOS verde derecha]               │
└────────────────────────────────────────────────────────────┘
```

**CA:** Drag&drop + selección; previsualización; descripción por foto opc; validar formato/tamaño; guarda `RSU_Actividad_Foto`. Botón deshabilitado si no es miembro.

#### HU-013 — Registrar asistencia de beneficiarios (DOCENTE/ESTUDIANTE — miembro)
| Pantalla | `Ejecución → Asistencia` |

```
┌────────────────────────────────────────────────────────────┐
│  ASISTENCIA — Capacitación 22/07/2026 Municipalidad        │
│  ☐ DNI      │ Apellidos y Nombres │ Firma [📎 Subir JPG]  │
│  ☑ 45678912 │ GARAY TORRES, Angel │ [📎]                  │
│  Total: 2 de 3                                             │
│  📎 Ficha asistencia firmada (PDF*): [Seleccionar] ✓       │
│  [💾 GUARDAR ASISTENCIA verde] [📄 IMPRIMIR FICHA white]  │
└────────────────────────────────────────────────────────────┘
```

**CA:** Lista beneficiarios vinculados con checkbox; firma escaneada JPG/PNG por benef; contador tiempo real; obliga ficha PDF; `RSU_Asistencia_Beneficiario`. Botón solo equipo.

#### HU-014 — Justificar falta (ESTUDIANTE — aislado, máx 2)
| Pantalla | `Justificación de Faltas` (capturas 5 y 6) |

```
┌────────────────────────────────────────────────────────────┐
│  JUSTIFICACIÓN FALTAS [←Retornar slate][+Nueva Just. verde]│
│  ⚠️ Máx 2 permitidas (contador 1/2 ámbar)                 │
│  Tabla: Proyecto │ Actividad │ Fecha │ Estado (PENDIENTE amarillo/REVISADO azul/APROBADA verde/RECHAZADA rojo) │
│  DETALLE: Fecha ausencia 22/07/26 Hora 13:30-14:30 Motivo ≥50 chars Evidencia PDF*  [Cerrar slate] │
│  Notifica → DIR_ESCUELA (🔔 EVALUACION)                    │
└────────────────────────────────────────────────────────────┘
```

**CA:** Form: actividad dropdown + fecha ausencia + hora inicio/fin + motivo ≥50 + evidencia PDF* ; estados colores; botón `Nueva Justificación` deshabilitado si `COUNT≥2`; tabla historial. Tablas `RSU_Justificacion_Falta, RSU_Documento`. *Aislado:* solo cuenta sus propias justificaciones en sus proyectos. **🔔 `DIR_ESCUELA` (EVALUACION)** al crear.

#### HU-015 — Modificar informe inicial (ESTUDIANTE — aislado)
| Pantalla | `Modificar Informe Inicial` (captura 4) |

```
┌────────────────────────────────────────────────────────────┐
│  MODIFICACIÓN INFORME INICIAL [←Retornar][+Nueva Mod. verde]│
│  Proyecto │ Motivos │ Archivo [📥PDF] │ Fecha │ Estado    │
│  Sistema  │ Modif.fechas │ [📥] │30/07│ Aprobado verde│👁️││
│  Notifica → DIR_ESCUELA                                    │
└────────────────────────────────────────────────────────────┘
```

**CA:** Historial con estado colores; botón Nueva Modificación; 👁️ detalle; `RSU_Modificacion_Informe`.

#### HU-016 — Ejecutar recursos presupuestales (DOCENTE / UAB)
| Pantalla | `Presupuesto → Registrar Movimiento` |

```
┌────────────────────────────────────────────────────────────┐
│  Proyecto: RSU-2026-001  Aprob: S/5,000 Ejec: S/2,300 Disp: S/2,700 [████████ 46%] │
│  Tipo*: [EJECUCION ▼] (ASIGNACION/EJECUCION/TRANSFERENCIA/DEVOLUCION)│
│  Monto*: [500.00] (no excede saldo) Fecha*: [24/09/26]     │
│  Descripción*: [Compra materiales taller______]            │
│  📎 Comprobante (Pecosa/Factura/Boleta PDF*): [Seleccionar] ✓│
│  [❌ CANCELAR gris] [💾 REGISTRAR MOVIMIENTO verde derecha]│
└────────────────────────────────────────────────────────────┘
```

**CA:** Barra progreso 46%; valida monto ≤ saldo; obligatorio comprobante; guarda `RSU_Presupuesto_Movimiento`; **🔔 `UNIDAD_ABAST` (PRESUPUESTO)** si EJECUCION + `DIR_RS_FACULTAD`.

#### HU-017 — Registrar pago con voucher (ESTUDIANTE/DOCENTE — aislado)
| Pantalla | `Pago → Registrar Voucher` (captura 9) |

```
┌────────────────────────────────────────────────────────────┐
│  Nombres y apellidos: [GARAY TORRES, Angel] Carrera: [Ing.Sis] Ciclo: [X] (auto Estudiante_Ciclo, no editable)│
│  N° operación*: [____] Banco*: [BCP ▼] Monto*: [____] (vs presupuesto)│
│  Fecha pago*: [dd/mm/aaaa]  📎 Voucher*: [Seleccionar] JPG/PNG/PDF│
│  [REGISTRAR verde derecha]  Estado inicial REGISTRADO     │
└────────────────────────────────────────────────────────────┘
```

**CA:** Autocompleta nombres/carrera/ciclo; validar monto vs aprobado; `RSU_Pago_Voucher, RSU_Documento`. *Aislado:* solo su proyecto carga presupuesto.

#### HU-018 — Monitorear in situ (DIR_RS_FACULTAD)
| Pantalla | `Panel Facultad → Monitoreo` |

```
┌────────────────────────────────────────────────────────────┐
│  MONITOREO — RSU-2026-001  Fecha*: [24/09/26] Monitor: [Edwin Roque ▼]│
│  Porcentaje*: [====|=====] 75% slider 0-100%                │
│  Hitos: [✓] Capacitación [✓] Valid.prot [ ] Encuesta final│
│  Observaciones*: [El equipo cumplió...] Resultado*: ( ) CONFORME (•) CON_OBSERV ( ) NO_CONFORME│
│  📎 Informe Monitoreo (PDF*): [Seleccionar] ✓              │
│  [💾 GUARDAR MONITOREO verde derecha] → EN_MONITOREO       │
└────────────────────────────────────────────────────────────┘
```

**CA:** Slider %; checklist hitos; 3 resultados; obliga PDF; cambia a `EN_MONITOREO`; **🔔 `COMITE_CALIDAD` + equipo**. Tablas `RSU_Monitoreo, RSU_Documento`.

#### HU-019 — Presentar informe final (DOCENTE)
| Pantalla | `Ejecución → Proceso de Finalización` (captura 2) |

```
┌────────────────────────────────────────────────────────────┐
│  PROCESO AVANCES  [📥 Descargar formato slate] [📋 Historial] [✅ Justif.]│
│  ✅ Proyecto Finalizado (si cerrado, no más entregas, mensaje)│
│  Progreso: 5/5 100% [████████]  Finalización: 3/3 100%      │
│  ENTREGA │ GUÍA [W] │ FECHA LÍM │ ARCHIVO [PDF] │ HORAS │ ESTADO (APROB verde/PEND amarillo)│
└────────────────────────────────────────────────────────────┘
```

**CA:** Tabla entregables con guía descargable .docx; barras 5/5 y 3/3; bloquea subidas si cerrado; botones descargar/historial/justif arriba-derecha.

#### HU-020 — Visar conformidad (DIR_ESCUELA)
| Pantalla | `Panel Escuela → Conformidad Informes` |

```
┌────────────────────────────────────────────────────────────┐
│  CONFORMIDAD INFORME FINAL — RSU-2026-001 [📥 Ver informe] [📥 Ver evidencias]│
│  ✅ CHECKLIST 5: [✓] Informe [✓] Rendición [✓] Fotos [✓] Padrón [✓] Encuestas│
│  Resultado*: (•) CONFORME ( ) CON_OBS ( ) NO_CONFORME     │
│  Observaciones: [________________]  📎 Proveído (PDF*): [Seleccionar] ✓│
│  [⚠️ OBSERVAR ámbar] [✅ DAR CONFORMIDAD verde derecha] → CON_CONFORMIDAD_ESCUELA │
└────────────────────────────────────────────────────────────┘
```

**CA:** Checklist; obliga proveído; registra `RSU_Verificacion`; **🔔 `CONSEJO_FACULTAD` (TRANSICION)**.

#### HU-021 — Aprobar cierre con Resolución (CONSEJO_FACULTAD)
| Pantalla | `Panel Consejo → Cierre` |

```
┌────────────────────────────────────────────────────────────┐
│  CIERRE — RSU-2026-001 [📥 Ver expediente completo]        │
│  N° Resolución*: [R.C.F. N°089-2026-UNDC-FI] Fecha*: [30/09/26]│
│  📎 PDF Resolución* [Seleccionar] ✓                        │
│  ✅ EMITIR CONSTANCIAS: ☑ KEVIN CAMA  ☑ ANGEL GARAY  ☑ Edwin Roque (doc)│
│  [❌ RECHAZAR rojo] [✅ APROBAR CIERRE verde derecha] → CERRADO │
└────────────────────────────────────────────────────────────┘
```

**CA:** Form resolución + PDF; checklist constancias estudiantes+docente; guarda `id_resolucion_cierre, fecha_cierre`; Tablas `RSU_Resolucion, RSU_Solicitud_Constancia`; **🔔 `COMITE_CALIDAD` + `DIR_CENTRAL_RS`**.

### ÉPICA 3: EVALUACIÓN DE IMPACTO

#### HU-022 — Aplicar encuesta beneficiario (DOCENTE / COMITÉ_PS — Likert P01-P06)
```
┌────────────────────────────────────────────────────────────┐
│  ENCUESTA SATISFACCIÓN BENEFICIARIO  Benef: GARAY, Angel DNI 45678912 │
│  Modalidad: (•) PRESENCIAL ( ) TELEFONICA ( ) VIRTUAL     │
│  P01 ¿Utilidad? ( )1 ( )2 ( )3 ( )4 (•)5  P02 ¿Calidad? ... (6 preguntas RSU_Pregunta_Encuesta Likert 1-5)│
│  Promedio: 4.50 → MUY BUENO (auto)  Comentario: [______]  │
│  📎 PDF firmado*: [Seleccionar] ✓                         │
│  [💾 GUARDAR ENCUESTA verde] [➡️ SIGUIENTE BENEFICIARIO slate] │
└────────────────────────────────────────────────────────────┘
```
**CA:** 6 preguntas catálogo; calcula promedio + calificación MUY_MALO..MUY_BUENO; obligación PDF; botón siguiente para agilizar; `RSU_Encuesta_Beneficiario, RSU_Respuesta_Encuesta, RSU_Pregunta_Encuesta`; no duplica `(id_proyecto,id_beneficiario)`; **🔔 `COMITE_CALIDAD` (EVALUACION)**.

#### HU-023 — Encuesta satisfacción al docente asesor (ESTUDIANTE — aislado)
| Pantalla | `Encuesta docente` (captura 7) — autocompleta asesor/carrera/tipo/nombre; estado REGISTRADO; PDF adjunto opc; `RSU_Encuesta_Satisfaccion`.

#### HU-024 — Procesar información de impacto (COMITÉ_CALIDAD)
```
┌────────────────────────────────────────────────────────────┐
│  Dimensión │ Promedio │ N° Resp │ % Logro │  UTILIDAD 4.50 4 90% etc │
│  Indicador │ Línea Base │ Meta │ Alcanzado % logro │ % satisf 60→80→88% ✅ │
│  [📊 EXPORTAR EXCEL white] [📄 GENERAR MATRIZ PDF undc-700]→ RSU_Indicador_Impacto │
└────────────────────────────────────────────────────────────┘
```

#### HU-025 — Informe evaluación impacto (DIR_ESCUELA)
```
┌────────────────────────────────────────────────────────────┐
│  INFORME EVALUACIÓN IMPACTO — 5 secciones: Resumen, Metas vs línea base (tabla indicadores), Impacto social, Sostenibilidad, Conclusiones │
│  📎 PDF* [Seleccionar]  [💾 GUARDAR slate] [➡️ ENVIAR A DIR RS FACULTAD verde derecha] → EN_EVALUACION_IMPACTO 🔔 DIR_RS_FACULTAD │
└────────────────────────────────────────────────────────────┘
```

#### HU-026 — Formular lecciones aprendidas (DIR_RS_FACULTAD)
```
┌────────────────────────────────────────────────────────────┐
│  [+ NUEVA LECCIÓN sky]  Lección │ Recomendación curricular (+ asignatura opc) │
│  [📄 GENERAR PLAN RECOMENDACIONES undc-700] [➡️ ENVIAR A CONSEJO verde] → RSU_Leccion_Aprendida │
└────────────────────────────────────────────────────────────┘
```

#### HU-027 — Validar evaluación con Resolución (CONSEJO_FACULTAD)
```
┌────────────────────────────────────────────────────────────┐
│  VALIDACIÓN EVALUACIÓN [📥 Ver informe impacto]            │
│  N° Resolución*: [R.C.F. N°092-2026] Fecha*: [30/09/26] 📎 PDF* │
│  [❌ RECHAZAR rojo] [✅ VALIDAR EVALUACIÓN verde] → EVALUACION_VALIDADA |
│  Guarda RSU_Resolucion tipo CONFORMIDAD_EVALUACION 🔔 DIR_CENTRAL │
└────────────────────────────────────────────────────────────┘
```

#### HU-028 — Consolidar Memoria Anual (DIR_CENTRAL_RS)
```
┌────────────────────────────────────────────────────────────┐
│  MEMORIA ANUAL 2026  RESUMEN: 12 proy 15 doc 48 est 320 benef S/45k 2.3% ✅ │
│  Por facultad: Ingeniería 5/150/S20k Salud 4/120/S15k Educación 3/50/S10k │
│  Indicadores SUNEDU Ind.29 12 proy ✅ % docentes 25% ✅ % estudiantes 9.6% ✅ % presupuesto 2.3% ✅ │
│  [📄 GENERAR MEMORIA PDF undc-700] [📊 EXPORTAR EXCEL white] → REPORTADO_SUNEDU │
└────────────────────────────────────────────────────────────┘
```
**CA:** Consolida resoluciones; calcula indicadores SUNEDU automático; valida ≥2%; cambia a `REPORTADO_SUNEDU`; **🔔 `DIR_CENTRAL_RS` (REPORTE)**.

---

## 📊 5. Resumen de mejoras por rol (con aislamiento + notificación)

| Rol | Pantallas principales | Botones clave (color) | Documentos que sube | Notificaciones que RECIBE | Aislado |
|-----|----------------------|----------------------|--------------------|---------------------------|---------|
| Estudiante Prop (3) | Mis proyectos (líder), Crear, Justif., Modificar informe | Proponer (sky), Enviar (emerald), Nueva Just. (verde) | Perfil PDF*, Justif. PDF*, Declaración PDF* | PROYECTO_CREADO (al crear), AVANCE_EQUIPO (cada avance) | ✅ Solo su equipo |
| Estudiante Ejec (4) | Mis proyectos (miembro), Evidencias, Fotos | Guardar actividad (verde), Subir fotos (verde) | Fotos JPG/PNG*, Doc adicional PDF | INVITACION, AVANCE_EQUIPO | ✅ Solo su equipo |
| Docente Resp (1) | Proyectos asesorados, Actividades, Entregables | Enviar (emerald), Registrar monitoreo (emerald) | Perfil, Informe final, Pecosa | ASIGNACION, AVANCE_EQUIPO | Solo sus asesorados |
| Dir. Escuela (5) | Viabilidades, Conformidad | Aprobar V°B° (emerald), Dar conformidad (emerald) | Informe viabilidad PDF*, Proveído PDF* | TRANSICION (BORRADOR→EN_REVISION) | Solo su escuela |
| Dir. RS Facultad (7) | Banco, Presupuesto, Monitoreo, Lecciones | Generar Plan (undc-700), Guardar Monitoreo (emerald) | Plan anual PDF, Informe monitoreo PDF* | TRANSICION (CON_VB→priorizar), PRESUPUESTO | Solo su facultad |
| Consejo Facultad (8) | Dictámenes, Cierres, Validar evaluación | Aprobar (emerald) con Resolución PDF* | Resoluciones PDF* | TRANSICION (dictamen/cierre) | Facultad |
| Dir. Depto (9) | Carga no lectiva | Aprobar asignación (emerald, bloqueado si >8h) | Plan Carga PDF* | TRANSICION (APROBADO→carga) | Solo sus docentes |
| Dir. Central (10) | Padrón, Memoria | Generar padrón (undc-700) | Memoria PDF | REPORTE, TRANSICION (REGISTRADO) | Institucional |
| U. Abastecimiento (11) | Presupuesto, Vouchers | Registrar movimiento (emerald) | Pecosa/Factura PDF*, Voucher JPG/PDF* | PRESUPUESTO (EJECUCION) | Facultad |
| Com. Calidad (12) | Procesar impacto, Matriz | Exportar matriz (white), Generar PDF (undc-700) | Matriz PDF/Excel | EVALUACION (EN_EVALUACION) | Facultad |

---

## 🔧 6. Verificación técnica (implementado V3)

- **Backend:** `go vet ./...` ✓ `go build ./cmd/server` ✓ (nota: `RSU_Notificacion` FK exige `rol_destino` existente — se valida en `pushNotificacion`).
- **Frontend:** `npm run build` (Vite 5, 607kB) ✓ — `RoleSidebar` dinámico por `rol_actor`, `Header` polling notificaciones, `Proyectos.tsx` redirige estudiante, `permissions.ts` matriz 12 roles.
- **BD:** `db/init.sql` PostgreSQL 18 con 30 tablas + 4 vistas + seeds 16 estados + 12 roles actor + 6 preguntas P01-P06 + 9 notifs seed. Tabla `RSU_Notificacion` con índices.
- **API clave V3:**
  ```
  POST /api/v1/auth/login  → demo 12 correos (ej. estudiante@undc.edu.pe / 123456 → ESTUDIANTE_PROP ID 1)
  GET  /api/v1/estudiantes/:id/proyectos  → AISLADO estudiante (join miembro) ← ÚNICA fuente para estudiante
  GET  /api/v1/proyectos                → NO usada por estudiante (redirige)
  POST /api/v1/proyectos                → auto-inscribe líder como RSU_Participante_Estudiante ACTIVO + 🔔
  POST /api/v1/proyectos/:id/transicion → valida RSU_Transicion_Estado + 🔔 al lane destino + equipo
  POST /api/v1/documentos/upload        → 403 si estudiante no es miembro (lider OR pe)
  GET  /api/v1/notificaciones?rol_destino=DIR_ESCUELA → campana
  ```

---

## 📎 7. Anexos — Tablas y vistas SQL relevantes

- `RSU_Proyecto` (16 estados), `RSU_Participante_Estudiante` (aislamiento), `RSU_Asignacion_Docente` (Art.86), `RSU_Actividad_Campo` + `RSU_Actividad_Foto`, `RSU_Documento` (hash/version/vigente), `RSU_Flujo_Aprobacion` (trazabilidad), `RSU_Notificacion` (12 lanes), `RSU_Verificacion`, `RSU_Justificacion_Falta` (máx 2), `RSU_Encuesta_Beneficiario` + `RSU_Respuesta_Encuesta` (Likert), `RSU_Indicador_Impacto`, `RSU_Presupuesto_Movimiento` + `RSU_Pago_Voucher`, `RSU_Resolucion`.
- Vistas: `vw_rsu_proyectos_resumen`, `vw_rsu_trazabilidad_aprobacion`, `vw_rsu_satisfaccion_dimension`, `vw_rsu_cobertura_anual`.

---

## ✅ 8. Pendientes no bloqueantes (V3.1)
- Excel import beneficiarios (plantilla HU-031) — scaffold lista.
- Cron job correo real (HU-052 job) — hoy es in-app `RSU_Notificacion`; mailer a futuro con `nodemailer`/SMTP.
- Firma digital Resoluciones — hoy PDF adjunto; firma electrónica en V3.1.

---
*Hecho para UNDC Cañete — RSU como función esencial y obligatoria (Art.124) — V3 aislada, notificada y con 12 roles finos. ¿Wireframes Figma o diagramas secuencia BPMN para el flujo de aprobación?*
