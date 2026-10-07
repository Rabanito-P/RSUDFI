# 62 HU — Cobertura en RSU UNDC (backend + frontend)

**Regla nueva atendida:** *Todo estudiante miembro del equipo (líder o participante `RSU_Participante_Estudiante` ACTIVO/INSCRITO) entra a su proyecto y sube docs/entregables/fotos* — ya no solo el líder.

## Cambios equipo-completo
| Capa | Archivo:línea | HU cubiertas | Qué se cambió |
|---|---|---|---|
| BD | `repository/repository.go:186` `FindAllByEstudiante` + `IsEstudianteMiembro` | HU-045, HU-033 | Join `RSU_Proyecto.id_estudiante_lider OR pe.id_estudiante` — lista proyectos aunque no seas líder |
| Service | `service/services.go:89` auto-inscribe líder como `Ejecutor ACTIVO` | HU-001 CA5, HU-033 | Al crear proyecto el líder entra a `RSU_Participante_Estudiante` para no bloquear subidas |
| Service | `service/services.go:246` `InscribirEstudiante` valida `ciclo mínimo` + evita duplicado `IsMiembro` | HU-003 | Ciclo activo vs `RSU_Tipo_Proyecto.ciclo_minimo_estudiante` |
| Handler | `handler/handlers.go:178` `List` con `?scope=mios&id_estudiante` y `handler/handlers.go:201` `ListByEstudiante` + `handler/handlers.go:210` `CheckMembresia` | HU-045 | `GET /estudiantes/:id/proyectos` y `GET /proyectos/:id/es-miembro/:estudianteId` |
| Handler | `handler/handlers.go:370` `DocumentoHandler.Upload` valida membresía equipo si `id_usuario_subida` es `Estudiante` | HU-033/034 | 403 si no eres miembro — backend enforce |
| Router | `router/router.go:80` | HU-045 | Rutas nuevas |
| Frontend | `utils/permissions.ts:24` `canStudentUploadDocs`/`canStudentRegisterActivity`/`isStudentMember` | HU-011,012,013,033 | Cualquier miembro `ACTIVO` puede subir en cualquier estado no cerrado |
| Frontend | `pages/ProyectoDetalle.tsx:14` + `pages/Proyectos.tsx:15` + `pages/roles/EstudianteDashboard.tsx:8` | HU-011,033,045 | Fetch membresía y filtra `esMiembro`; dashboard pregunta `GET /estudiantes/:id/proyectos`; banners `Todos los estudiantes del equipo suben docs` |

## Mapeo 62 HU → endpoints / tablas

| Épica | HU | Descripción | Backend endpoint : tabla | Frontend vista | Estado |
|---|---|---|---|---|---|
| 1 Formulación | HU-001 | Crear proyecto BORRADOR autogenera `UNDC-RSU-AAAA-NNN` | `POST /proyectos` : `RSU_Proyecto` | `Proyectos → Nuevo` + `Proyectos.tsx:15` scope | ✅ |
| | HU-002 | Registrar docente asesor filtrado por escuela + carga | `POST /proyectos` `id_docente_asesor` + `GET /docentes` | `ProyectoDetalle general` selector | ✅ |
| | HU-003 | Validar ciclo mínimo | `service/services.go:38` + `InscribirEstudiante` | bloquea inscripción + banner `ciclo ≥5` | ✅ |
| | HU-004 | Enviar a EN_REVISION_ESCUELA con docs FORMULACIÓN | `POST /proyectos/:id/transicion` valida `RSU_Transicion_Estado` | `ProyectoDetalle` flujo tab | ✅ |
| | HU-005 | Viabilidad DIR_ESC | `POST /transicion` + `RSU_Verificacion` VIABILIDAD_TECNICA | `Bandeja` aprob DIR_ESC | ✅ |
| | HU-006 | Consolidar banco DIR_RS_FAC | `GET /proyectos?estado=CON_VB_ESCUELA` | `DirectivoDashboard bandeja` | ✅ |
| | HU-007 | Dictamen CON_FAC + Resolución | `POST /transicion` + `RSU_Resolucion` | `Bandeja` CON_FAC | ✅ |
| | HU-008 | Asignar carga no lectiva DIR_DEP | `POST /asignaciones/docente` valida `carga_no_lectiva_max` Art86 | `DocenteDashboard` carga | ✅ |
| | HU-009 | Registrar padrón DIR_CEN_RS | `GET /proyectos/resumen` vw | `DirectivoDashboard` reportes | ✅ |
| 2 Ejecución | HU-010 | Cronograma campo | `POST /actividades` : `RSU_Actividad_Campo` | `ProyectoDetalle actividades` | ✅ |
| | HU-011 | Registrar actividad (cualquier miembro equipo) | `POST /actividades` `canStudentRegisterActivity` | `ProyectoDetalle + EstudianteDashboard` equipo | ✅ FIX |
| | HU-012 | Subir fotos | `POST /documentos/upload` + `RSU_Actividad_Foto` | `actividades` fotos | ✅ |
| | HU-013 | Asistencia beneficiarios | `RSU_Asistencia_Beneficiario` | `ProyectoDetalle beneficiarios` | ✅ |
| | HU-014 | Justificar falta máx 2 | `RSU_Justificacion_Falta` | `EstudianteDashboard` justificación | ✅ |
| | HU-015 | Modificación informe | `RSU_Modificacion_Informe` | `documentos` | ✅ scaffold |
| | HU-016 | Ejecutar presupuesto | `POST /presupuesto/movimientos` : `RSU_Presupuesto_Movimiento` | `presupuesto` | ✅ |
| | HU-017 | Voucher | `RSU_Pago_Voucher` | `presupuesto` | ✅ |
| | HU-018 | Monitorear in situ DIR_RS_FAC | `POST /monitoreos` : `RSU_Monitoreo` | `ProyectoDetalle monitoreo` | ✅ |
| | HU-019 | Informe final | `POST /transicion` → `INFORME_FINAL_PRESENTADO` | `ProyectoDetalle` | ✅ |
| | HU-020 | Conformidad DIR_ESC | `RSU_Verificacion` | `Bandeja` | ✅ |
| | HU-021 | Cierre CON_FAC + constancias | `RSU_Resolucion` id_resolucion_cierre | `reportes` | ✅ |
| 3 Impacto | HU-022 | Encuesta beneficiario Likert P01-P06 | `POST /encuestas/beneficiario` : `RSU_Encuesta_Beneficiario`+`RSU_Respuesta_Encuesta` | `encuestas` | ✅ |
| | HU-023 | Encuesta docente asesor | `RSU_Encuesta_Satisfaccion` | `encuestas` | ✅ scaffold |
| | HU-024 | Procesar impacto | `RSU_Indicador_Impacto` + `vw_rsu_satisfaccion_dimension` | `indicadores` | ✅ |
| | HU-025 | Informe evaluación | `RSU_Documento` ETAPA EVALUACION | `ProyectoDetalle indicadores` | ✅ |
| | HU-026 | Lecciones | `RSU_Leccion_Aprendida` | `indicadores` | ✅ |
| | HU-027 | Validar evaluación CON_FAC | `RSU_Resolucion` CONFORMIDAD_EVALUACION → `EVALUACION_VALIDADA` | `Bandeja` | ✅ |
| | HU-028 | Memoria Anual DIR_CEN_RS 2% | `RSU_Reporte_Anual` + `vw_rsu_cobertura_anual` | `DirectivoDashboard` | ✅ |
| 4 Benef | HU-029 | Registrar beneficiario | `POST /beneficiarios` : `RSU_Beneficiario` | `Beneficiarios` | ✅ |
| | HU-030 | Vincular a proyecto | `POST /beneficiarios/vincular` : `RSU_Proyecto_Beneficiario` | `ProyectoDetalle beneficiarios` equipo | ✅ |
| | HU-031 | Import Excel | plantilla (pend frontend) | `Beneficiarios` import | 🟡 pendiente excel |
| | HU-032 | Consultar padrón | `GET /proyectos/:id/beneficiarios` + filtros | `Beneficiarios` tabla | ✅ |
| 5 Docs | HU-033 | Subir entregable (equipo completo) | `POST /entregables` + `POST /documentos/upload` : `RSU_Entregable` fecha límite | `ProyectoDetalle documentos` + `EstudianteDashboard` | ✅ FIX |
| | HU-034 | Verificar entregable DIR_ESC | `RSU_Entregable.estado` APROBADO/OBSERVADO | `Docente/Directivo entregables` | ✅ |
| | HU-035 | Declaración jurada | `RSU_Declaracion_Jurada` | `estudiante/horas` | ✅ |
| | HU-036 | Constancia | `RSU_Solicitud_Constancia` | `Estudiante constancias` | ✅ |
| 6 Presup | HU-037 | Asignar presupuesto | `POST /presupuesto/movimientos` ASIGNACION | `presupuesto` | ✅ |
| | HU-038 | Verificar voucher | `RSU_Pago_Voucher` VERIFICADO_FACULTAD | `presupuesto` | ✅ |
| | HU-039 | Reporte 2% | `RSU_Reporte_Anual.porcentaje_presupuesto` | `presupuesto` + `DirectivoDashboard` | ✅ |
| 7 Seg | HU-040 | Login correo inst | `POST /auth/login` 11 demos | `Login.tsx` selector 12 roles | ✅ |
| | HU-041 | Roles 12 BPMN | `RSU_Rol_Actor` + `AuthContext` | `RoleSidebar` | ✅ |
| | HU-042 | Auditoría | `RSU_Auditoria_Log` | `reportes` audit | ✅ scaffold |
| | HU-043 | Trazabilidad | `vw_rsu_trazabilidad_aprobacion` `GET /proyectos/:id/historial` | `ProyectoDetalle flujo` timeline | ✅ |
| 8 Dash | HU-044 | Dashboard docente | `GET /dashboard/kpis` filtrado | `DocenteDashboard` | ✅ |
| | HU-045 | Dashboard estudiante (equipo) | `GET /estudiantes/:id/proyectos` | `EstudianteDashboard` equipo | ✅ FIX |
| | HU-046 | Dashboard DIR_ESC | `GET /dashboard/kpis` + viabilidades | `DirectivoDashboard bandeja` | ✅ |
| | HU-047 | Dashboard DIR_RS_FAC | `vw_rsu_proyectos_resumen` | `DirectivoDashboard` | ✅ |
| | HU-048 | Dashboard CON_FAC | `EN_DICTAMEN_CONSEJO` | `Bandeja` | ✅ |
| | HU-049 | Dashboard DIR_CEN_RS | `RSU_Reporte_Anual` | `DirectivoDashboard` | ✅ |
| | HU-050..051 | Export Excel/Memoria | `GET /proyectos/resumen` export | `reportes` | 🟡 pendiente excel |
| 9 Notif | HU-052..055 | Jobs correo | `RSU_Flujo_Aprobacion` trigger (documentado, no cron) | banner | 🟡 pendiente cron |
| 10 Comp | HU-056..060 | Asistencia docente/est | `RSU_Asignacion_Docente` horas | `Docente/Estudiante horas` | ✅ scaffold |
| 11 Sunedu | HU-061/062 | Indicadores SUNEDU/SINEACE | `vw_rsu_cobertura_anual` + `RSU_Leccion_Aprendida` | `reportes` + `DirectivoDashboard` | ✅ |

> Scoffold = endpoint/tabla lista, falta UI fina Excel/cron — no bloquea flujo BPMN crítico.
