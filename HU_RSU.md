# HU RSU — Historias de Usuario Consolidadas (62 HU)

> **Proyecto:** Plataforma de RSU — Nivel Facultad · Universidad Nacional de Cañete (UNDC)
> **Código:** R-M03-RSU-001-PF · **Versión:** 3.0 · **Fecha:** Octubre 2026
> **Base legal:** Ley 30220 Art. 124-125 · SUNEDU Indicador 29 · SINEACE Estándar 25
> **Stack:** Go 1.22 Gin/GORM + React 18 Vite TS + Tailwind + PostgreSQL 18

---

## ÍNDICE

1. [Propósito y alcance](#1-propósito-y-alcance)
2. [Navegación por rol (12 roles BPMN)](#2-navegación-por-rol)
3. [Matriz de roles y permisos](#3-matriz-de-roles-y-permisos)
4. [Historias de Usuario — Épica 1: Formulación (HU-001..HU-009)](#4-épica-1-formulación)
5. [Historias de Usuario — Épica 2: Ejecución (HU-010..HU-021)](#5-épica-2-ejecución)
6. [Historias de Usuario — Épica 3: Impacto (HU-022..HU-028)](#6-épica-3-impacto)
7. [Historias de Usuario — Épica 4: Beneficiarios (HU-029..HU-032)](#7-épica-4-beneficiarios)
8. [Historias de Usuario — Épica 5: Documentos (HU-033..HU-036)](#8-épica-5-documentos)
9. [Historias de Usuario — Épica 6: Presupuesto (HU-037..HU-039)](#9-épica-6-presupuesto)
10. [Historias de Usuario — Épica 7: Seguridad y auditoría (HU-040..HU-043)](#10-épica-7-seguridad-y-auditoría)
11. [Historias de Usuario — Épica 8: Dashboards (HU-044..HU-051)](#11-épica-8-dashboards)
12. [Historias de Usuario — Épica 9: Notificaciones (HU-052..HU-055)](#12-épica-9-notificaciones)
13. [Historias de Usuario — Épica 10: Competencias (HU-056..HU-060)](#13-épica-10-competencias)
14. [Historias de Usuario — Épica 11: SUNEDU/SINEACE (HU-061..HU-062)](#14-épica-11-sunedusineace)
15. [Mapeo HU → Endpoints](#15-mapeo-hu--endpoints)
16. [Reglas de negocio (R01–R35)](#16-reglas-de-negocio)

---

## 1. PROPÓSITO Y ALCANCE

Gestionar el **ciclo de vida completo** de los proyectos de Responsabilidad Social Universitaria en la Facultad de Ingeniería de Sistemas (UNDC Cañete): creación, formulación, revisión, aprobación, ejecución, monitoreo, informes, evaluación de impacto (encuestas Likert), cierre con Resolución, y **transferencia a la plataforma de universidad (DRSU/SERUS)**.

| En el alcance | Fuera del alcance |
|---|---|
| Creación de proyectos por 5 modalidades (SSU, PEP financiado, PEP autofinanciado, Voluntariado, Publicación Científica) | Evaluación técnica de la DRSU (universidad) |
| Registro de avances, evidencias, informes | Registro en SERUS / SISTEMA RSU (solo transferencia manual) |
| Revisión y aprobación por Director de Escuela y Decano | Emisión de constancias y certificados oficiales (DRSU) |
| Consolidación, aprobación y descarga por el Decano | Consolidación SINEACE/SUNEDU a nivel universidad |
| Transferencia manual a la plataforma de universidad (punto de quiebre) | Publicación en repositorio institucional |

---

## 2. NAVEGACIÓN POR ROL

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

## 3. MATRIZ DE ROLES Y PERMISOS

| # | Código | Nombre | Tipo | Global | Pantallas principales | Puede / No puede |
|---|--------|--------|------|--------|----------------------|------------------|
| 1 | `DOCENTE_RESP` | Docente Responsable | DOCENTE | DOCENTE | Proyectos asesorados, Actividades, Entregables, Monitoreo | ✅ Crea BORRADOR, envía a Escuela, ejecuta campo. ❌ No emite Resoluciones |
| 2 | `DOCENTE_COLAB` | Docente Colaborador | DOCENTE | DOCENTE | Proyectos colaborados, Actividades | ✅ Apoya ejecución. ❌ No asigna carga |
| 3 | `ESTUDIANTE_PROP` | Estudiante Proponente (líder) | ESTUDIANTE | ESTUDIANTE | Mis proyectos (líder) — AISLADO, Crear proyecto, Justificar falta (máx2), Modificar informe, Autorización imagen | ✅ Ve SOLO su equipo; propone; justifica 2. ❌ No ve proyectos de otros equipos |
| 4 | `ESTUDIANTE_EJEC` | Estudiante Ejecutor (miembro) | ESTUDIANTE | ESTUDIANTE | Mis proyectos (miembro) — AISLADO, Registro evidencias (fotos 5), Encuesta docente | ✅ Ejecuta, sube foto, marca asistencia. ❌ No crea borrador si ya existe |
| 5 | `DIR_ESCUELA` | Director Escuela Profesional | AUTORIDAD | DIRECTIVO | Viabilidades pendientes, Conformidad informes, Padrón beneficiarios | ✅ V°B° + conformidad checklist 5. ❌ No prioriza banco facultad |
| 6 | `COMITE_PS` | Comité Proyección Social | COMITE | DIRECTIVO | Revisión no duplicidad | ✅ No duplica; alinea Plan RS |
| 7 | `DIR_RS_FACULTAD` | Director RS Facultad | AUTORIDAD | DIRECTIVO | Banco proyectos, Presupuesto/vouchers, Monitoreo in situ, Lecciones | ✅ Prioriza, monetiza 2%, monitorea % avance. ❌ No emite Resoluciones |
| 8 | `CONSEJO_FACULTAD` | Consejo de Facultad | AUTORIDAD | DIRECTIVO | Dictámenes, Cierres, Validar evaluación | ✅ Emite Resoluciones (aprobación/cierre/evaluación) — único con validez legal. ❌ No ejecuta campo |
| 9 | `DIR_DEPTO` | Director Depto. Académico | AUTORIDAD | DIRECTIVO | Asignación carga no lectiva | ✅ Valida `horas_asignadas ≤ carga_no_lectiva_max` Art.86 |
| 10 | `DIR_CENTRAL_RS` | Director Central RS / VRA | AUTORIDAD | DIRECTIVO | Padrón oficial, Memoria Anual, Reportes SUNEDU | ✅ Consolida + reporta Ind.29 ≥2% |
| 11 | `UNIDAD_ABAST` | Unidad Abastecimiento | ADMINISTRATIVO | DIRECTIVO | Presupuesto, Vouchers | ✅ Verifica EJECUCION/TRANSFERENCIA |
| 12 | `COMITE_CALIDAD` | Comité de Calidad | COMITE | DIRECTIVO | Procesar impacto, Matriz indicadores | ✅ Calcula promedio dimensión + % logro Likert |

> **AISLAMIENTO:** Los dos roles estudiante comparten la misma vista `GET /estudiantes/:id/proyectos`. El backend hace `LEFT JOIN RSU_Participante_Estudiante pe ON pe.id_proyecto=RSU_Proyecto.id_proyecto AND pe.estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO') WHERE RSU_Proyecto.id_estudiante_lider=:id OR pe.id_estudiante=:id`. **No hay `GET /proyectos` para estudiante** — frontend hace `Navigate` a `/mis-proyectos` si intenta. Upload valida `isMiembro` (líder o pe).

---

## 4. ÉPICA 1: FORMULACIÓN

### HU-001 — Crear proyecto de RSU (AISLADO)
| Campo | Detalle |
|-------|---------|
| Actor | DOCENTE / ESTUDIANTE_PROP (solo su equipo verá el proyecto) |
| Prioridad | Crítica · BPMN `BORRADOR` (orden 1) |
| Pantalla | `Formulario Nuevo Proyecto` — 4 pasos con barra progreso |
| Ruta | `/proyectos/nuevo` (estudiante) — si ya es miembro de un BORRADOR no duplica |

**CA:**
- Validaciones tiempo real: título 20-300, presupuesto ≤50000 positivo, fecha fin > inicio, N° beneficiarios entero >0.
- Autogenera `UNDC-RSU-2026-NNN` al guardar primera vez.
- Estado inicial `BORRADOR` (edición total). Solo el creador y luego miembros invitados ven el proyecto (aislamiento).
- Botones abajo: `CANCELAR` gris sin acción, `GUARDAR BORRADOR` slate guarda sin validar, `ENVIAR A ESCUELA` emerald valida y → `EN_REVISION_ESCUELA`.
- Tablas: `RSU_Proyecto, RSU_Tipo_Proyecto, RSU_Linea_Accion, RSU_Documento, RSU_Flujo_Aprobacion`
- **Notificación al crear:** → `ESTUDIANTE_PROP` + `ESTUDIANTE_EJEC` (PROYECTO_CREADO) + `DOCENTE_RESP` (ASIGNACION si tiene asesor)
- **Documento:** `Perfil del Proyecto` PDF obligatorio 10MB etapa `FORMULACION`.

### HU-002 — Registrar docente asesor
| Campo | Detalle |
|-------|---------|
| Actor | ESTUDIANTE_PROP |
| Pantalla | `Modal: Seleccionar Docente Asesor` |

**CA:** Lista docentes de la misma escuela; carga = `carga_no_lectiva_max - SUM(horas APROBADAs)`; 0h deshabilitado; al confirmar `UPDATE RSU_Proyecto.id_docente_asesor` + correo mock.

### HU-003 — Validar ciclo mínimo (sistema)
| Actor | SISTEMA |
| Pantalla | `Modal validación` (invisible salvo error) |

**CA:** Al inscribir consulta `Estudiante_Ciclo.ciclo_numerico` vs `RSU_Tipo_Proyecto.ciclo_minimo_estudiante`; bloquea y muestra modal; si ok marca `validacion_ciclo=TRUE`.

### HU-004 — Enviar proyecto a revisión de Escuela
| Actor | DOCENTE / ESTUDIANTE_PROP (líder) |
| Pantalla | `Fases del proyecto` — card datos + botones abajo-derecha |

**CA:** Botón `ENVIAR A ESCUELA` solo si `BORRADOR`; valida docs obligatorios FORMULACION existentes; si falta muestra modal lista pendientes; si ok → `EN_REVISION_ESCUELA` + `RSU_Flujo_Aprobacion(DOCENTE_RESP)` + notificación `DIR_ESCUELA` (TRANSICION).

### HU-005 — Evaluar viabilidad técnica (DIR_ESCUELA)
| Actor | `DIR_ESCUELA` (ID 5) |
| Pantalla | `Panel Director → Viabilidades Pendientes` |

**CA:** Checklist 5; si `APROBAR V°B°` obligatorio adjuntar PDF; → `CON_VB_ESCUELA`; registra `RSU_Verificacion(VIABILIDAD_TECNICA, NO_DUPLICIDAD)` + notificación `COMITE_PS` / `DIR_RS_FACULTAD`.

### HU-006 — Consolidar banco de proyectos (DIR_RS_FACULTAD)
| Actor | `DIR_RS_FACULTAD` (ID 7) |
| Pantalla | `Panel Facultad → Banco de Proyectos` |

**CA:** Checkbox múltiple + dropdown Alta/Media/Baja; cálculo tiempo real presupuestado vs disponible; botón `GENERAR PLAN ANUAL` produce PDF; al enviar → `EN_PRIORIZACION_FACULTAD`; notificación `CONSEJO_FACULTAD`.

### HU-007 — Dictaminar y aprobar con Resolución (CONSEJO_FACULTAD)
| Actor | `CONSEJO_FACULTAD` (ID 8) |
| Pantalla | `Panel Consejo → Dictámenes` |

**CA:** Campos número, fecha, tipo obligatorios + PDF firmado; al aprobar guarda `id_resolucion_aprobacion, fecha_aprobacion` + → `APROBADO_CON_RESOLUCION` + notificación `DIR_DEPTO` + `DIR_CENTRAL_RS`.

### HU-008 — Asignar carga no lectiva (DIR_DEPTO)
| Actor | `DIR_DEPTO` (ID 9) |
| Pantalla | `Panel Departamento → Asignación Carga` |

**CA:** Muestra disponible; valida `SUM ≤ carga_no_lectiva_max`; registra `RSU_Asignacion_Docente(APROBADA)` + PDF; notificación `DOCENTE_RESP` (ASIGNACION).

### HU-009 — Registrar en padrón oficial (DIR_CENTRAL_RS)
| Actor | `DIR_CENTRAL_RS` (ID 10) |
| Pantalla | `Panel Central → Padrón Oficial` |

**CA:** Tabla todos los `APROBADO_CON_RESOLUCION`; cambia a `REGISTRADO_OFICIAL`; calcula resumen tiempo real; notificación `DIR_RS_FACULTAD` + `DIR_CENTRAL_RS` (REPORTE).

---

## 5. ÉPICA 2: EJECUCIÓN

### HU-010 — Coordinar cronograma de campo
| Actor | DOCENTE_RESP / ESTUDIANTE_PROP (miembro) |
| Pantalla | `Ejecución → Cronograma` |

**CA:** Tabla editable agregar/eliminar; obligatorio `Acta Compromiso` firmada; al iniciar → `EN_EJECUCIÓN`; notificación `DOCENTE_RESP`+`ESTUDIANTE_EJEC`.

### HU-011 — Registrar actividad de campo (cualquier miembro)
| Actor | ESTUDIANTE_EJEC / ESTUDIANTE_PROP (cualquier miembro ACTIVO) |
| Pantalla | `Registro de Evidencias → Nueva Actividad` |

**CA:** Fecha no futura; horas/minutos validado; hora fin > inicio; descripción ≥20; ≥1 foto JPG/PNG 5MB; cualquier miembro registra; vincula a entregable. Tablas `RSU_Actividad_Campo, RSU_Actividad_Foto, RSU_Entregable`.

### HU-012 — Subir fotos (miembro)
| Pantalla | `Modal: Subir Fotografías` |

**CA:** Drag&drop + selección; previsualización; validar formato/tamaño; guarda `RSU_Actividad_Foto`.

### HU-013 — Registrar asistencia de beneficiarios
| Actor | DOCENTE/ESTUDIANTE (miembro) |
| Pantalla | `Ejecución → Asistencia` |

**CA:** Lista beneficiarios vinculados con checkbox; firma escaneada JPG/PNG; contador tiempo real; obliga ficha PDF; `RSU_Asistencia_Beneficiario`.

### HU-014 — Justificar falta (máx 2)
| Actor | ESTUDIANTE (aislado) |
| Pantalla | `Justificación de Faltas` |

**CA:** Máx 2 permitidas; tabla con estados PENDIENTE/REVISADO/APROBADA/RECHAZADA; `RSU_Justificacion_Falta`.

### HU-015 — Modificación de informe
| Actor | ESTUDIANTE (miembro) |
| Pantalla | `Documentos → Modificar Informe` |

**CA:** Solicita modificación con documento sustento; `RSU_Modificacion_Informe`.

### HU-016 — Ejecutar presupuesto
| Actor | UNIDAD_ABAST / DIR_RS_FACULTAD |
| Pantalla | `Presupuesto → Movimientos` |

**CA:** Registra `RSU_Presupuesto_Movimiento` (ASIGNACION/EJECUCION/TRANSFERENCIA/DEVOLUCION).

### HU-017 — Voucher
| Actor | UNIDAD_ABAST |
| Pantalla | `Presupuesto → Vouchers` |

**CA:** Verifica Pecosa/Factura; `RSU_Pago_Voucher`.

### HU-018 — Monitorear in situ
| Actor | DIR_RS_FACULTAD |
| Pantalla | `Monitoreo` |

**CA:** Registra `RSU_Monitoreo` con % avance 0-100.

### HU-019 — Informe final
| Actor | ESTUDIANTE_EJEC (miembro) |
| Pantalla | `ProyectoDetalle → Documentos` |

**CA:** Sube informe final PDF; → `INFORME_FINAL_PRESENTADO`.

### HU-020 — Conformidad de Escuela
| Actor | DIR_ESCUELA |
| Pantalla | `Bandeja → Conformidad` |

**CA:** Da conformidad con checklist; `RSU_Verificacion`.

### HU-021 — Cierre con Resolución
| Actor | CONSEJO_FACULTAD |
| Pantalla | `Bandeja → Cierre` |

**CA:** Emite Resolución de Cierre; → `CERRADO`; constancias automáticas.

---

## 6. ÉPICA 3: IMPACTO

### HU-022 — Encuesta beneficiario Likert P01-P06
| Actor | COMITE_CALIDAD / DIR_RS_FACULTAD |
| Pantalla | `Encuestas → Aplicar` |

**CA:** Likert 1-5; UNIQUE `(id_proyecto, id_beneficiario)`; promedio + calificación MUY_MALO..MUY_BUENO; tablas `RSU_Encuesta_Beneficiario` + `RSU_Respuesta_Encuesta`.

### HU-023 — Encuesta docente asesor
| Actor | ESTUDIANTE_EJEC |
| Pantalla | `Encuesta Docente` |

**CA:** `RSU_Encuesta_Satisfaccion`.

### HU-024 — Procesar impacto
| Actor | COMITE_CALIDAD |
| Pantalla | `Indicadores` |

**CA:** `RSU_Indicador_Impacto` + `vw_rsu_satisfaccion_dimension`.

### HU-025 — Informe de evaluación
| Actor | COMITE_CALIDAD |
| Pantalla | `Indicadores → Informe` |

**CA:** `RSU_Documento` ETAPA EVALUACION.

### HU-026 — Lecciones aprendidas
| Actor | DIR_RS_FACULTAD |
| Pantalla | `Indicadores → Lecciones` |

**CA:** `RSU_Leccion_Aprendida`.

### HU-027 — Validar evaluación
| Actor | CONSEJO_FACULTAD |
| Pantalla | `Bandeja → Validar evaluación` |

**CA:** `RSU_Resolucion` CONFORMIDAD_EVALUACION → `EVALUACION_VALIDADA`.

### HU-028 — Memoria Anual (2% SUNEDU Ind.29)
| Actor | DIR_CENTRAL_RS |
| Pantalla | `Reportes → Memoria Anual` |

**CA:** `RSU_Reporte_Anual` + `vw_rsu_cobertura_anual`.

---

## 7. ÉPICA 4: BENEFICIARIOS

### HU-029 — Registrar beneficiario
| Actor | DIR_RS_FACULTAD / DIR_ESCUELA |
| Pantalla | `Beneficiarios → Nuevo` |

**CA:** `RSU_Beneficiario` con DNI/RUC según `tipo_beneficiario`.

### HU-030 — Vincular a proyecto
| Actor | Cualquier miembro del equipo |
| Pantalla | `ProyectoDetalle → Beneficiarios` |

**CA:** `RSU_Proyecto_Beneficiario`.

### HU-031 — Import Excel (pendiente)
| Actor | DIR_CENTRAL_RS |
| Pantalla | `Beneficiarios → Importar` |

**CA:** Importación masiva desde Excel.

### HU-032 — Consultar padrón
| Actor | Cualquier rol con acceso |
| Pantalla | `Beneficiarios → Consultar` |

**CA:** `GET /proyectos/:id/beneficiarios` + filtros.

---

## 8. ÉPICA 5: DOCUMENTOS

### HU-033 — Subir entregable (equipo completo)
| Actor | Cualquier miembro del equipo |
| Pantalla | `ProyectoDetalle → Documentos` |

**CA:** `POST /entregables` + `POST /documentos/upload`; valida membresía equipo; 403 si no es miembro.

### HU-034 — Verificar entregable
| Actor | DIR_ESCUELA / DOCENTE_RESP |
| Pantalla | `Entregables → Verificar` |

**CA:** `RSU_Entregable.estado` APROBADO/OBSERVADO.

### HU-035 — Declaración jurada
| Actor | ESTUDIANTE |
| Pantalla | `Estudiante → Declaración` |

**CA:** `RSU_Declaracion_Jurada`.

### HU-036 — Constancia
| Actor | ESTUDIANTE |
| Pantalla | `Estudiante → Constancias` |

**CA:** `RSU_Solicitud_Constancia`.

---

## 9. ÉPICA 6: PRESUPUESTO

### HU-037 — Asignar presupuesto
| Actor | DIR_RS_FACULTAD |
| Pantalla | `Presupuesto → Asignar` |

**CA:** `POST /presupuesto/movimientos` ASIGNACION.

### HU-038 — Verificar voucher
| Actor | UNIDAD_ABAST |
| Pantalla | `Presupuesto → Vouchers` |

**CA:** `RSU_Pago_Voucher` VERIFICADO_FACULTAD.

### HU-039 — Reporte 2%
| Actor | DIR_CENTRAL_RS |
| Pantalla | `Presupuesto → Reporte` |

**CA:** `RSU_Reporte_Anual.porcentaje_presupuesto`.

---

## 10. ÉPICA 7: SEGURIDAD Y AUDITORÍA

### HU-040 — Login correo institucional
| Actor | Cualquier rol |
| Pantalla | `Login` |

**CA:** `POST /auth/login` con correo + password (123456 / undc2026).

### HU-041 — Roles 12 BPMN
| Actor | ADMINISTRADOR |
| Pantalla | `Configuración → Roles` |

**CA:** `RSU_Rol_Actor` + `AuthContext`.

### HU-042 — Auditoría
| Actor | ADMINISTRADOR |
| Pantalla | `Reportes → Auditoría` |

**CA:** `RSU_Auditoria_Log`.

### HU-043 — Trazabilidad
| Actor | Cualquier rol con acceso |
| Pantalla | `ProyectoDetalle → Flujo` |

**CA:** `vw_rsu_trazabilidad_aprobacion` + `GET /proyectos/:id/historial`.

---

## 11. ÉPICA 8: DASHBOARDS

### HU-044 — Dashboard docente
| Actor | DOCENTE_RESP |
| Pantalla | `DocenteDashboard` |

**CA:** `GET /dashboard/kpis` filtrado.

### HU-045 — Dashboard estudiante (equipo)
| Actor | ESTUDIANTE_PROP / ESTUDIANTE_EJEC |
| Pantalla | `EstudianteDashboard` |

**CA:** `GET /estudiantes/:id/proyectos`.

### HU-046 — Dashboard DIR_ESCUELA
| Actor | DIR_ESCUELA |
| Pantalla | `DirectivoDashboard` |

**CA:** `GET /dashboard/kpis` + viabilidades.

### HU-047 — Dashboard DIR_RS_FACULTAD
| Actor | DIR_RS_FACULTAD |
| Pantalla | `DirectivoDashboard` |

**CA:** `vw_rsu_proyectos_resumen`.

### HU-048 — Dashboard CONSEJO_FACULTAD
| Actor | CONSEJO_FACULTAD |
| Pantalla | `Bandeja` |

**CA:** `EN_DICTAMEN_CONSEJO`.

### HU-049 — Dashboard DIR_CENTRAL_RS
| Actor | DIR_CENTRAL_RS |
| Pantalla | `DirectivoDashboard` |

**CA:** `RSU_Reporte_Anual`.

### HU-050..051 — Export Excel/Memoria
| Actor | DIR_CENTRAL_RS |
| Pantalla | `Reportes` |

**CA:** `GET /proyectos/resumen` export.

---

## 12. ÉPICA 9: NOTIFICACIONES

### HU-052..055 — Notificaciones automáticas
| Actor | Sistema |
| Pantalla | Header campana |

**CA:** `RSU_Notificacion` con disparo automático en `Create` y `Transicion`. Endpoints: `GET /notificaciones`, `GET /count`, `PATCH /:id/leido`.

---

## 13. ÉPICA 10: COMPETENCIAS

### HU-056..060 — Asistencia docente/estudiante
| Actor | DOCENTE_RESP / ESTUDIANTE |
| Pantalla | `Docente/Estudiante → Horas` |

**CA:** `RSU_Asignacion_Docente` horas.

---

## 14. ÉPICA 11: SUNEDU/SINEACE

### HU-061/062 — Indicadores SUNEDU/SINEACE
| Actor | DIR_CENTRAL_RS |
| Pantalla | `Reportes` |

**CA:** `vw_rsu_cobertura_anual` + `RSU_Leccion_Aprendida`.

---

## 15. MAPEO HU → ENDPOINTS

| Épica | HU | Descripción | Backend endpoint : tabla | Frontend vista | Estado |
|---|---|---|---|---|---|
| 1 Formulación | HU-001 | Crear proyecto BORRADOR | `POST /proyectos` : `RSU_Proyecto` | `Proyectos → Nuevo` | OK |
| | HU-002 | Registrar docente asesor | `POST /proyectos` + `GET /docentes` | `ProyectoDetalle` | OK |
| | HU-003 | Validar ciclo mínimo | `service/asignacion.go` | bloquea inscripción | OK |
| | HU-004 | Enviar a EN_REVISION_ESCUELA | `POST /proyectos/:id/transicion` | `ProyectoDetalle` | OK |
| | HU-005 | Viabilidad DIR_ESC | `POST /transicion` + `RSU_Verificacion` | `Bandeja` | OK |
| | HU-006 | Consolidar banco DIR_RS_FAC | `GET /proyectos?estado=CON_VB_ESCUELA` | `DirectivoDashboard` | OK |
| | HU-007 | Dictamen CON_FAC + Resolución | `POST /transicion` + `RSU_Resolucion` | `Bandeja` | OK |
| | HU-008 | Asignar carga no lectiva DIR_DEP | `POST /asignaciones/docente` | `DocenteDashboard` | OK |
| | HU-009 | Registrar padrón DIR_CEN_RS | `GET /proyectos/resumen` | `DirectivoDashboard` | OK |
| 2 Ejecución | HU-010 | Cronograma campo | `POST /actividades` | `ProyectoDetalle` | OK |
| | HU-011 | Registrar actividad | `POST /actividades` | `ProyectoDetalle` | OK |
| | HU-012 | Subir fotos | `POST /documentos/upload` + `RSU_Actividad_Foto` | `actividades` | OK |
| | HU-013 | Asistencia beneficiarios | `RSU_Asistencia_Beneficiario` | `ProyectoDetalle` | OK |
| | HU-014 | Justificar falta máx 2 | `RSU_Justificacion_Falta` | `EstudianteDashboard` | OK |
| | HU-015 | Modificación informe | `RSU_Modificacion_Informe` | `documentos` | OK |
| | HU-016 | Ejecutar presupuesto | `POST /presupuesto/movimientos` | `presupuesto` | OK |
| | HU-017 | Voucher | `RSU_Pago_Voucher` | `presupuesto` | OK |
| | HU-018 | Monitorear in situ | `POST /monitoreos` | `ProyectoDetalle` | OK |
| | HU-019 | Informe final | `POST /transicion` → `INFORME_FINAL_PRESENTADO` | `ProyectoDetalle` | OK |
| | HU-020 | Conformidad DIR_ESC | `RSU_Verificacion` | `Bandeja` | OK |
| | HU-021 | Cierre CON_FAC + constancias | `RSU_Resolucion` | `reportes` | OK |
| 3 Impacto | HU-022 | Encuesta beneficiario Likert | `POST /encuestas/beneficiario` | `encuestas` | OK |
| | HU-023 | Encuesta docente asesor | `RSU_Encuesta_Satisfaccion` | `encuestas` | OK |
| | HU-024 | Procesar impacto | `RSU_Indicador_Impacto` | `indicadores` | OK |
| | HU-025 | Informe evaluación | `RSU_Documento` ETAPA EVALUACION | `ProyectoDetalle` | OK |
| | HU-026 | Lecciones | `RSU_Leccion_Aprendida` | `indicadores` | OK |
| | HU-027 | Validar evaluación CON_FAC | `RSU_Resolucion` | `Bandeja` | OK |
| | HU-028 | Memoria Anual 2% | `RSU_Reporte_Anual` | `DirectivoDashboard` | OK |
| 4 Benef | HU-029 | Registrar beneficiario | `POST /beneficiarios` | `Beneficiarios` | OK |
| | HU-030 | Vincular a proyecto | `POST /beneficiarios/vincular` | `ProyectoDetalle` | OK |
| | HU-031 | Import Excel | plantilla (pend frontend) | `Beneficiarios` | pendiente |
| | HU-032 | Consultar padrón | `GET /proyectos/:id/beneficiarios` | `Beneficiarios` | OK |
| 5 Docs | HU-033 | Subir entregable (equipo) | `POST /entregables` + `POST /documentos/upload` | `ProyectoDetalle` | OK |
| | HU-034 | Verificar entregable DIR_ESC | `RSU_Entregable.estado` | `Docente/Directivo` | OK |
| | HU-035 | Declaración jurada | `RSU_Declaracion_Jurada` | `estudiante/horas` | OK |
| | HU-036 | Constancia | `RSU_Solicitud_Constancia` | `Estudiante` | OK |
| 6 Presup | HU-037 | Asignar presupuesto | `POST /presupuesto/movimientos` | `presupuesto` | OK |
| | HU-038 | Verificar voucher | `RSU_Pago_Voucher` | `presupuesto` | OK |
| | HU-039 | Reporte 2% | `RSU_Reporte_Anual` | `presupuesto` | OK |
| 7 Seg | HU-040 | Login correo inst | `POST /auth/login` | `Login.tsx` | OK |
| | HU-041 | Roles 12 BPMN | `RSU_Rol_Actor` + `AuthContext` | `RoleSidebar` | OK |
| | HU-042 | Auditoría | `RSU_Auditoria_Log` | `reportes` | OK |
| | HU-043 | Trazabilidad | `vw_rsu_trazabilidad_aprobacion` | `ProyectoDetalle` | OK |
| 8 Dash | HU-044 | Dashboard docente | `GET /dashboard/kpis` | `DocenteDashboard` | OK |
| | HU-045 | Dashboard estudiante | `GET /estudiantes/:id/proyectos` | `EstudianteDashboard` | OK |
| | HU-046 | Dashboard DIR_ESC | `GET /dashboard/kpis` | `DirectivoDashboard` | OK |
| | HU-047 | Dashboard DIR_RS_FAC | `vw_rsu_proyectos_resumen` | `DirectivoDashboard` | OK |
| | HU-048 | Dashboard CON_FAC | `EN_DICTAMEN_CONSEJO` | `Bandeja` | OK |
| | HU-049 | Dashboard DIR_CEN_RS | `RSU_Reporte_Anual` | `DirectivoDashboard` | OK |
| | HU-050..051 | Export Excel/Memoria | `GET /proyectos/resumen` | `reportes` | pendiente |
| 9 Notif | HU-052..055 | Notificaciones | `RSU_Notificacion` | Header | OK |
| 10 Comp | HU-056..060 | Asistencia docente/est | `RSU_Asignacion_Docente` | `Docente/Estudiante` | OK |
| 11 Sunedu | HU-061/062 | Indicadores SUNEDU/SINEACE | `vw_rsu_cobertura_anual` | `reportes` | OK |

---

## 16. REGLAS DE NEGOCIO (R01–R35)

| ID | Regla | Validación |
|----|-------|------------|
| R01 | Ciclo mínimo | `Estudiante_Ciclo.ciclo_numerico >= RSU_Tipo_Proyecto.ciclo_minimo_estudiante` |
| R02 | Carga no lectiva | `SUM(horas_asignadas) <= carga_no_lectiva_max` (Art.79/86) |
| R03 | BPMN | Solo transiciones en `RSU_Transicion_Estado` para `id_rol_actor` |
| R04 | Likert | Valor 1-5, UNIQUE `(id_proyecto, id_beneficiario)` |
| R05 | Fechas | `inicio < fin` |
| R06 | Porcentajes | 0-100 |
| R07 | DNI/RUC | Según `tipo_beneficiario` |
| R08 | Aislamiento estudiante | Solo `GET /estudiantes/:id/proyectos` |
| R09 | Equipo mínimo | 2 estudiantes (líder + participante) |
| R10 | Máx estudiantes | 5 por proyecto SSU |
| R11 | Máx justificaciones | 2 por estudiante |
| R12 | Máx fotos | 5 por actividad |
| R13 | Tamaño archivo | PDF ≤32MB, Fotos ≤5MB |
| R14 | Formato documento | Solo PDF para entregables |
| R15 | Presupuesto 2% | `RSU_Reporte_Anual.porcentaje_presupuesto` |
| R16 | Notificación | Automática en Create y Transicion |
| R17 | Auditoría | `RSU_Auditoria_Log` con IP y user-agent |
| R18 | Token JWT | Mock (123456 / undc2026) |
| R19 | CORS | Habilitado |
| R20 | Timezone | America/Lima |
| R21 | Paginación | `page` + `limit` (default 20) |
| R22 | Búsqueda | `search` en título, código, escuela |
| R23 | Estado inicial | `BORRADOR` |
| R24 | Estado final | `CERRADO` / `REPORTADO_SUNEDU` |
| R25 | Rechazo | Vuelve a `BORRADOR` |
| R26 | Observación | Requiere motivo |
| R27 | Aprobación | Requiere PDF firmado |
| R28 | Resolución | Único con validez legal: CONSEJO_FACULTAD |
| R29 | Padrón | Solo `APROBADO_CON_RESOLUCION` |
| R30 | Monitoreo | % avance 0-100 |
| R31 | Rechazo BPMN | Rebote al emisor |
| R32 | Aprobación BPMN | Notifica al actor destino |
| R33 | Equipo completo | Cualquier miembro puede subir docs |
| R34 | Validación ciclo | `validacion_ciclo=TRUE` |
| R35 | Modo mantenimiento | `RSU_Configuracion.clave='modo_mantenimiento'` |
