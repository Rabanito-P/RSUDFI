package router

import (
	"time"

	"undc-rsu/backend/internal/handler"
	"undc-rsu/backend/internal/middleware"

	_ "undc-rsu/backend/docs"

	"undc-rsu/backend/internal/config"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
)

func Setup(db *gorm.DB) *gin.Engine {
	r := gin.New()
	// Orden de middleware: recuperación, límite de cuerpo, CORS, cabeceras de
	// seguridad, registro y auditoría.
	r.Use(gin.Recovery(), middleware.TamañoDeCuerpo(64<<20), middleware.CORS(), middleware.Seguridad(), middleware.Logger(), middleware.AuditMiddleware(db))
	r.Static("/uploads", "./uploads")
	r.MaxMultipartMemory = 64 << 20

	// handlers
	facH := handler.NewFacultadHandler(db)
	escH := handler.NewEscuelaHandler(db)
	cicloH := handler.NewCicloHandler(db)
	docH := handler.NewDocenteHandler(db)
	estH := handler.NewEstudianteHandler(db)
	projH := handler.NewProyectoHandler(db)
	benH := handler.NewBeneficiarioHandler(db)
	asigH := handler.NewAsignacionHandler(db)
	actH := handler.NewActividadHandler(db)
	fotoH := handler.NewFotoHandler(db)
	encH := handler.NewEncuestaHandler(db)
	presH := handler.NewPresupuestoHandler(db)
	documH := handler.NewDocumentoHandler(db)
	archivoH := handler.NewArchivoHandler(db)
	catH := handler.NewCatalogoHandler(db)
	dashH := handler.NewDashboardHandler(db)
	indH := handler.NewIndicadorHandler(db)
	monH := handler.NewMonitoreoHandler(db)
	entH := handler.NewEntregableHandler(db)
	authH := handler.NewAuthHandler(db, config.Load())
	notifH := handler.NewNotificacionHandler(db)
	justH := handler.NewJustificacionHandler(db)
	modH := handler.NewModificacionHandler(db)
	planH := handler.NewPlanificacionHandler(db)
	// Nuevos módulos (V1.1): roles dinámicos, comité RSU, configuración, auditoría
	prH := handler.NewProyectoRolHandler(db)
	comiteH := handler.NewComiteRSUHandler(db)
	configH := handler.NewConfiguracionHandler(db)
	auditH := handler.NewAuditoriaHandler(db)
	constH := handler.NewConstanciaHandler(db)
	userAdminH := handler.NewUsuarioAdminHandler(db)
	formatoH := handler.NewFormatoHandler(db)
	regH := handler.NewRegistroHandler(db)
	solUnionH := handler.NewSolicitudUnionHandler(db)

	r.GET("/health", handler.Health)
	r.GET("/", handler.Health)
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// login no requiere token (es el punto de entrada de autenticación).
	// OWASP A07: se limita a 10 intentos por minuto por IP para frenar fuerza bruta.
	r.POST("/api/v1/auth/login", middleware.RateLimit(10, time.Minute), authH.Login)

	// Resumen público del flujo para la pantalla de login: solo conteos, sin datos
	// sensibles ni nombres de proyectos. Evita pedir token antes de autenticarse.
	r.GET("/api/v1/public/flujo-resumen", dashH.FlujoResumen)

	// Registro público de estudiantes (acceso temporal desde el login).
	// Se limita a 5 altas por minuto por IP para evitar cuentas masivas.
	r.POST("/api/v1/registro/estudiante", middleware.RateLimit(5, time.Minute), regH.Estudiante)

	// Catálogos públicos para el alta de estudiante. La pantalla de ingreso es
	// anónima: no puede pedir /escuelas ni /ciclos, que exigen sesión y el
	// módulo correspondiente. Ambas son información no sensible (escuelas de la
	// Facultad y ciclos académicos), así que se exponen solo para el registro.
	r.GET("/api/v1/public/escuelas", escH.List)
	r.GET("/api/v1/public/ciclos", cicloH.List)

	api := r.Group("/api/v1")
	api.Use(middleware.AuthMiddleware())
	{

		// ── Autorización en dos capas ──
		// Capa 1 (VER): el usuario debe tener activo el módulo (RSU_Usuario_Permiso).
		// Capa 2 (INTERACTUAR): el rol actor del token decide qué escrituras puede hacer.
		// Habilitar un módulo a un estudiante le deja entrar y VER; no le da ningún
		// poder de escritura: eso lo concede el rol, no el permiso.
		middleware.SetDBPermisos(db)

		verProyectos := middleware.PermiteModulo("proyectos")
		verEntregables := middleware.PermiteModulo("entregables")
		verEvidencias := middleware.PermiteModulo("evidencias")
		verEncuestas := middleware.PermiteModulo("encuestas")
		verDocumentos := middleware.PermiteModulo("documentos")
		verCatalogos := middleware.PermiteModulo("catalogos")
		verPersonas := middleware.PermiteModulo("personas")
		verEstructura := middleware.PermiteModulo("estructura")
		verBandeja := middleware.PermiteModulo("bandeja")
		verMonitoreo := middleware.PermiteModulo("monitoreo")
		verPresupuesto := middleware.PermiteModulo("presupuesto")
		verBeneficiarios := middleware.PermiteModulo("beneficiarios")
		verReportes := middleware.PermiteModulo("reportes")
		verConfiguracion := middleware.PermiteModulo("configuracion")
		verAuditoria := middleware.PermiteModulo("auditoria")

		// /dashboard/kpis alimenta varias pantallas según el módulo habilitado:
		// Reportes, Presupuesto y el tablero de la Facultad.
		verDashboard := middleware.PermiteModulo("reportes", "presupuesto", "proyectos")

		// Escrituras reservadas a la dirección y órganos de gobierno. ADMIN siempre pasa.
		esGestion := middleware.RequiereRol("DIR_ESCUELA", "DIR_RS_FACULTAD", "CONSEJO_FACULTAD",
			"DIR_DEPTO", "DIR_CENTRAL_RS", "COMITE_PS", "COMITE_CALIDAD", "UNIDAD_ABAST", "DECANO")
		api.GET("/auth/me", authH.Me)

		// dashboard
		api.GET("/dashboard/kpis", verDashboard, dashH.KPIs)
		api.GET("/dashboard/trazabilidad", verReportes, dashH.Trazabilidad)

		// catálogos RSU
		api.GET("/catalogos/tipos-proyecto", verCatalogos, catH.TiposProyecto)
		api.GET("/catalogos/lineas-accion", verCatalogos, catH.LineasAccion)
		api.GET("/catalogos/estados", verCatalogos, catH.Estados)
		api.GET("/catalogos/roles-actor", verCatalogos, catH.RolesActor)
		api.GET("/catalogos/tipos-documento", verDocumentos, catH.TiposDocumento)
		api.GET("/catalogos/transiciones", verBandeja, catH.Transiciones)
		api.GET("/catalogos/preguntas-encuesta", verEncuestas, catH.PreguntasEncuesta)

		// estructura (crear/editar: solo dirección y administración)
		gestion := middleware.RequiereRol("DIR_ESCUELA", "DIR_RS_FACULTAD", "DIR_CENTRAL_RS", "DIR_DEPTO")
		api.POST("/facultades", esGestion, esGestion, gestion, facH.Create)
		api.GET("/facultades", verEstructura, facH.List)
		api.GET("/facultades/:id", verEstructura, facH.Get)
		api.PUT("/facultades/:id", esGestion, esGestion, gestion, facH.Update)
		api.DELETE("/facultades/:id", esGestion, esGestion, gestion, facH.Delete)

		api.POST("/escuelas", esGestion, esGestion, gestion, escH.Create)
		api.GET("/escuelas", verEstructura, escH.List)
		api.GET("/escuelas/:id", verEstructura, escH.Get)

		api.POST("/ciclos", esGestion, esGestion, gestion, cicloH.Create)
		api.GET("/ciclos", verCatalogos, cicloH.List)

		api.POST("/docentes", esGestion, esGestion, gestion, docH.Create)
		api.GET("/docentes", verPersonas, docH.List)
		api.GET("/docentes/asesores", verProyectos, docH.Asesores) // para el formulario de creación
		api.GET("/docentes/:id", verPersonas, docH.Get)

		api.POST("/estudiantes", esGestion, esGestion, gestion, estH.Create)
		api.GET("/estudiantes", verPersonas, estH.List)
		api.GET("/estudiantes/:id", verPersonas, estH.Get)
		api.GET("/estudiantes/:id/constancias", verProyectos, constH.ByEstudiante)

		// proyecto (núcleo) — HU-001 a HU-009
		api.POST("/proyectos", verProyectos, projH.Create)
		api.GET("/proyectos", verProyectos, projH.List)
		api.GET("/proyectos/resumen", verReportes, projH.ResumenVw) // vista vw_rsu_proyectos_resumen
		api.GET("/proyectos/:id", verProyectos, projH.Get)
		api.PUT("/proyectos/:id", verProyectos, projH.Update)
		// Transición BPMN con límite: 20/min (evita spam de cambios de estado)
		// El rol actor se resuelve DENTRO del handler desde el token: ningún cliente
		// puede aprobar en nombre de una autoridad.
		api.POST("/proyectos/:id/transicion", verBandeja, middleware.RateLimit(20, time.Minute), projH.Transicion)
		api.POST("/proyectos/:id/lider", verProyectos, projH.CambiarLider) // HU-060 cambio de líder
		api.GET("/proyectos/:id/historial", verProyectos, projH.Historial)
		// HU: estudiante ve su proyecto sea líder o miembro equipo; docente solo sus asesorados
		api.GET("/estudiantes/:id/proyectos", verProyectos, projH.ListByEstudiante)
		api.GET("/docentes/:id/proyectos", verProyectos, projH.ListByDocente)
		api.GET("/proyectos/:id/es-miembro/:estudianteId", verProyectos, projH.CheckMembresia)

		// entregables — POR_ENVIAR→ENVIADO→OBSERVADO/APROBADO (bandeja equipo + verificadores)
		api.POST("/entregables", verEntregables, entH.Create)
		api.GET("/entregables/por-verificar", verBandeja, entH.PorVerificar) // docente + oficina RSU facultad
		api.GET("/proyectos/:id/entregables", verEntregables, entH.ByProyecto)
		api.POST("/proyectos/:id/entregables/registrar", verEntregables, entH.Registrar)
		api.PATCH("/entregables/:id", verEntregables, entH.Update)

		// asignaciones — estudiante 1 proyecto activo (V4)
		api.POST("/asignaciones/docente", verProyectos, esGestion, asigH.AsignarDocente)
		api.POST("/asignaciones/estudiante", verProyectos, asigH.InscribirEstudiante)
		// Sumar compañeros al equipo al crear el proyecto (por nombre y correo).
		api.POST("/proyectos/:id/participantes", verProyectos, asigH.InscribirPorDatos)
		api.DELETE("/proyectos/:id/estudiantes/:estudianteId", verProyectos, asigH.RetirarEstudiante)
		api.GET("/proyectos/:id/docentes", verProyectos, asigH.ListDocentes)
		api.GET("/proyectos/:id/estudiantes", verProyectos, asigH.ListEstudiantes)

		// beneficiarios
		api.POST("/beneficiarios", verBeneficiarios, benH.Create)
		api.GET("/beneficiarios", verBeneficiarios, benH.List)
		api.GET("/beneficiarios/:id", verBeneficiarios, benH.Get)
		api.POST("/beneficiarios/vincular", verBeneficiarios, benH.Vincular)
		api.GET("/proyectos/:id/beneficiarios", verProyectos, benH.ByProyecto)

		// actividades campo — fotos y planificación con límite razonable
		api.POST("/actividades", verEvidencias, actH.Create)
		api.GET("/proyectos/:id/actividades", verEvidencias, actH.ByProyecto)
		api.PATCH("/actividades/:id/estado", verEvidencias, actH.UpdateEstado)
		api.POST("/actividades/fotos", verEvidencias, middleware.RateLimit(30, time.Minute), fotoH.Upload)
		api.GET("/actividades/:id/fotos", verEvidencias, fotoH.ByActividad)
		api.GET("/actividades/del-dia", verEvidencias, fotoH.DelDia)

		// monitoreo
		api.POST("/monitoreos", verMonitoreo, monH.Create)
		api.GET("/proyectos/:id/monitoreos", verMonitoreo, monH.ByProyecto)

		// documentos — subidas con límite: 30/min por IP (abuso/DoS OWASP A04)
		api.POST("/documentos/upload", verDocumentos, middleware.RateLimit(30, time.Minute), documH.Upload)
		api.GET("/proyectos/:id/documentos", verDocumentos, documH.ByProyecto)
		api.GET("/documentos/:id/archivo", verDocumentos, documH.Archivo)

		// archivos unificados (local /uploads o bucket B2 privado via stream)
		api.GET("/archivos", verDocumentos, archivoH.Descargar)
		api.GET("/storage/estado", verConfiguracion, archivoH.Estado)
		api.PUT("/storage/b2", verConfiguracion, archivoH.GuardarB2) // ADMIN: credenciales Backblaze en caliente

		// presupuesto
		api.POST("/presupuesto/movimientos", verPresupuesto, esGestion, presH.CreateMov)
		api.GET("/proyectos/:id/presupuesto", verPresupuesto, presH.ByProyecto)

		// encuestas e indicadores
		api.POST("/encuestas/beneficiario", verEncuestas, encH.Create)
		api.POST("/encuestas/docente", verEncuestas, encH.CrearDocente) // HU-023
		api.GET("/proyectos/:id/encuestas", verEncuestas, encH.ByProyecto)

		api.POST("/indicadores", verReportes, esGestion, indH.Create)
		api.GET("/proyectos/:id/indicadores", verEncuestas, indH.ByProyecto)

		// notificaciones — 12 roles BPMN (HU-052..055) — campana Header + bandeja por rol_destino
		api.GET("/notificaciones", notifH.List)
		api.GET("/notificaciones/count", notifH.CountUnread)
		api.GET("/notificaciones/counts", notifH.Counts)
		api.POST("/notificaciones", notifH.Create)
		api.PATCH("/notificaciones/:id/leido", notifH.MarkRead)
		api.PATCH("/notificaciones/marcar-todas-leidas", notifH.MarkAllRead)
		api.GET("/notificaciones/health", notifH.Health)

		// ── Roles dinámicos por proyecto (V1.1 §1) ──
		api.GET("/proyectos/:id/roles", verProyectos, prH.List)
		api.POST("/proyectos/:id/roles", verBandeja, esGestion, prH.Assign)
		api.DELETE("/proyectos/:id/roles", verBandeja, esGestion, prH.Revoke)
		api.GET("/usuarios/:tipo/:id/roles", verProyectos, prH.RolesDeUsuario)

		// ── Comité RSU (M04) ──
		api.GET("/comite-rsu", verEstructura, comiteH.List)
		api.GET("/comite-rsu/escuela/:id", verEstructura, comiteH.ByEscuela)
		api.POST("/comite-rsu", verEstructura, esGestion, comiteH.Create)
		api.DELETE("/comite-rsu/:id", verEstructura, esGestion, comiteH.Delete)

		// ── Configuración (M11) ──
		api.GET("/configuracion", verConfiguracion, configH.List)
		api.GET("/configuracion/clave/:clave", verConfiguracion, configH.Get)
		api.PUT("/configuracion/clave/:clave", middleware.RequiereRol("ADMIN"), configH.Upsert)
		api.DELETE("/configuracion/:id", middleware.RequiereRol("ADMIN"), configH.Delete)

		// ── Auditoría (M09) — solo lectura, acceso admin ──
		api.GET("/auditoria", verAuditoria, middleware.RequiereRol("ADMIN"), auditH.List)

		// ── Constancias (RSU_Solicitud_Constancia) ──
		api.POST("/constancias", verProyectos, constH.Create)

		// ── Justificación de faltas (HU-014, R11: máx 2 por estudiante) ──
		api.POST("/justificaciones", verProyectos, justH.Create)
		api.GET("/justificaciones/estudiante", verProyectos, justH.ByEstudiante)
		api.GET("/estudiantes/:id/justificaciones", verProyectos, justH.ByEstudiante)
		api.PATCH("/justificaciones/:id", verBandeja, justH.UpdateEstado)

		// ── Modificación de informe inicial (HU-015) ──
		api.POST("/modificaciones-informe", verProyectos, modH.Create)
		api.GET("/proyectos/:id/modificaciones", verProyectos, modH.ByProyecto)
		api.PATCH("/modificaciones-informe/:id", verBandeja, modH.Update)

		// ── Planificación de actividades desde Excel (HU-010) ──
		// Límite 10/min: interpretar Excels es costoso (proceso Python).
		api.POST("/actividades/planificacion", verEvidencias, middleware.RateLimit(10, time.Minute), planH.Guardar)
		api.POST("/actividades/planificacion/preview", verEvidencias, middleware.RateLimit(20, time.Minute), planH.Previsualizar)
		api.GET("/actividades/plantilla-planificacion", verDocumentos, planH.Plantilla)
		api.GET("/plantillas/:archivo", verDocumentos, planH.PlantillaDeDescarga)

		// ── Solicitudes de unión a PEP (HU-063..HU-068) ──
		api.POST("/proyectos/:id/solicitudes-union", verProyectos, solUnionH.Create)
		api.GET("/proyectos/:id/solicitudes-union", verProyectos, solUnionH.ListByProyecto)
		api.GET("/estudiantes/:id/solicitudes-union", verProyectos, solUnionH.ListByEstudiante)
		api.PATCH("/solicitudes-union/:id/aceptar", verProyectos, solUnionH.Aceptar)
		api.PATCH("/solicitudes-union/:id/rechazar", verProyectos, solUnionH.Rechazar)
		api.DELETE("/solicitudes-union/:id", verProyectos, solUnionH.Cancelar)

		// ── Gestión de usuarios y permisos (solo ADMIN) ──
		api.GET("/usuarios", verAuditoria, userAdminH.List)
		api.POST("/usuarios", verAuditoria, userAdminH.Crear)
		api.GET("/usuarios/roles-disponibles", verAuditoria, userAdminH.RolesDisponibles)
		api.GET("/usuarios/modulos-disponibles", verAuditoria, userAdminH.ModulosDisponibles)
		api.PUT("/usuarios/:id", verAuditoria, userAdminH.Actualizar)
		api.DELETE("/usuarios/:id", verAuditoria, userAdminH.Eliminar)
		api.PUT("/usuarios/:id/permisos", verAuditoria, userAdminH.Permiso)

		// ── Formatos y guías RSU ──
		// Catálogo fijo de 7 formatos. Cualquier usuario autenticado puede verlos
		// y descargarlos; solo ADMIN reemplaza o restaura el archivo.
		api.GET("/formatos", verDocumentos, formatoH.List)
		api.GET("/formatos/codigos", verDocumentos, formatoH.Codigos)
		api.GET("/formatos/:codigo/descargar", verDocumentos, formatoH.Descargar)
		api.POST("/formatos/:codigo/archivo", verDocumentos, formatoH.Subir)
		api.DELETE("/formatos/:codigo/archivo", verDocumentos, formatoH.Restaurar)

		// ── Fase 1 · Creación (HU-F1) ──
		// Bucle del docente asesor, reactivación de archivados y catálogo DRSU.
		handler.RegisterFase1(api, db, projH.Svc())

		// ── Fase 2 · Aprobación (HU-F2) ──
		// Oficio de Elevación del Decano, activación (opción C), duplicidad,
		// filtro presupuestal y vencimiento perezoso.
		handler.RegisterFase2(api, db, projH.Svc())
	}
	return r
}
