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

	api := r.Group("/api/v1")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/auth/me", authH.Me)

		// dashboard
		api.GET("/dashboard/kpis", dashH.KPIs)
		api.GET("/dashboard/trazabilidad", dashH.Trazabilidad)

		// catálogos RSU
		api.GET("/catalogos/tipos-proyecto", catH.TiposProyecto)
		api.GET("/catalogos/lineas-accion", catH.LineasAccion)
		api.GET("/catalogos/estados", catH.Estados)
		api.GET("/catalogos/roles-actor", catH.RolesActor)
		api.GET("/catalogos/tipos-documento", catH.TiposDocumento)
		api.GET("/catalogos/transiciones", catH.Transiciones)
		api.GET("/catalogos/preguntas-encuesta", catH.PreguntasEncuesta)

		// estructura (crear/editar: solo dirección y administración)
		gestion := middleware.RequiereRol("DIR_ESCUELA", "DIR_RS_FACULTAD", "DIR_CENTRAL_RS", "DIR_DEPTO")
		api.POST("/facultades", gestion, facH.Create)
		api.GET("/facultades", facH.List)
		api.GET("/facultades/:id", facH.Get)
		api.PUT("/facultades/:id", gestion, facH.Update)
		api.DELETE("/facultades/:id", gestion, facH.Delete)

		api.POST("/escuelas", gestion, escH.Create)
		api.GET("/escuelas", escH.List)
		api.GET("/escuelas/:id", escH.Get)

		api.POST("/ciclos", gestion, cicloH.Create)
		api.GET("/ciclos", cicloH.List)

		api.POST("/docentes", gestion, docH.Create)
		api.GET("/docentes", docH.List)
		api.GET("/docentes/:id", docH.Get)

		api.POST("/estudiantes", gestion, estH.Create)
		api.GET("/estudiantes", estH.List)
		api.GET("/estudiantes/:id", estH.Get)
		api.GET("/estudiantes/:id/constancias", constH.ByEstudiante)

		// proyecto (núcleo) — HU-001 a HU-009
		api.POST("/proyectos", projH.Create)
		api.GET("/proyectos", projH.List)
		api.GET("/proyectos/resumen", projH.ResumenVw) // vista vw_rsu_proyectos_resumen
		api.GET("/proyectos/:id", projH.Get)
		api.PUT("/proyectos/:id", projH.Update)
		// Transición BPMN con límite: 20/min (evita spam de cambios de estado)
		api.POST("/proyectos/:id/transicion", middleware.RateLimit(20, time.Minute), projH.Transicion)
		api.POST("/proyectos/:id/lider", projH.CambiarLider) // HU-060 cambio de líder
		api.GET("/proyectos/:id/historial", projH.Historial)
		// HU: estudiante ve su proyecto sea líder o miembro equipo; docente solo sus asesorados
		api.GET("/estudiantes/:id/proyectos", projH.ListByEstudiante)
		api.GET("/docentes/:id/proyectos", projH.ListByDocente)
		api.GET("/proyectos/:id/es-miembro/:estudianteId", projH.CheckMembresia)

		// entregables — POR_ENVIAR→ENVIADO→OBSERVADO/APROBADO (bandeja equipo + verificadores)
		api.POST("/entregables", entH.Create)
		api.GET("/entregables/por-verificar", entH.PorVerificar) // docente + oficina RSU facultad
		api.GET("/proyectos/:id/entregables", entH.ByProyecto)
		api.POST("/proyectos/:id/entregables/registrar", entH.Registrar)
		api.PATCH("/entregables/:id", entH.Update)

		// asignaciones — estudiante 1 proyecto activo (V4)
		api.POST("/asignaciones/docente", asigH.AsignarDocente)
		api.POST("/asignaciones/estudiante", asigH.InscribirEstudiante)
		// Sumar compañeros al equipo al crear el proyecto (por nombre y correo).
		api.POST("/proyectos/:id/participantes", asigH.InscribirPorDatos)
		api.DELETE("/proyectos/:id/estudiantes/:estudianteId", asigH.RetirarEstudiante)
		api.GET("/proyectos/:id/docentes", asigH.ListDocentes)
		api.GET("/proyectos/:id/estudiantes", asigH.ListEstudiantes)

		// beneficiarios
		api.POST("/beneficiarios", benH.Create)
		api.GET("/beneficiarios", benH.List)
		api.GET("/beneficiarios/:id", benH.Get)
		api.POST("/beneficiarios/vincular", benH.Vincular)
		api.GET("/proyectos/:id/beneficiarios", benH.ByProyecto)

		// actividades campo — fotos y planificación con límite razonable
		api.POST("/actividades", actH.Create)
		api.GET("/proyectos/:id/actividades", actH.ByProyecto)
		api.PATCH("/actividades/:id/estado", actH.UpdateEstado)
		api.POST("/actividades/fotos", middleware.RateLimit(30, time.Minute), fotoH.Upload)
		api.GET("/actividades/:id/fotos", fotoH.ByActividad)
		api.GET("/actividades/del-dia", fotoH.DelDia)

		// monitoreo
		api.POST("/monitoreos", monH.Create)
		api.GET("/proyectos/:id/monitoreos", monH.ByProyecto)

		// documentos — subidas con límite: 30/min por IP (abuso/DoS OWASP A04)
		api.POST("/documentos/upload", middleware.RateLimit(30, time.Minute), documH.Upload)
		api.GET("/proyectos/:id/documentos", documH.ByProyecto)
		api.GET("/documentos/:id/archivo", documH.Archivo)

		// archivos unificados (local /uploads o bucket B2 privado via stream)
		api.GET("/archivos", archivoH.Descargar)
		api.GET("/storage/estado", archivoH.Estado)
		api.PUT("/storage/b2", archivoH.GuardarB2) // ADMIN: credenciales Backblaze en caliente

		// presupuesto
		api.POST("/presupuesto/movimientos", presH.CreateMov)
		api.GET("/proyectos/:id/presupuesto", presH.ByProyecto)

		// encuestas e indicadores
	api.POST("/encuestas/beneficiario", encH.Create)
	api.POST("/encuestas/docente", encH.CrearDocente) // HU-023
	api.GET("/proyectos/:id/encuestas", encH.ByProyecto)

		api.POST("/indicadores", indH.Create)
		api.GET("/proyectos/:id/indicadores", indH.ByProyecto)

		// notificaciones — 12 roles BPMN (HU-052..055) — campana Header + bandeja por rol_destino
		api.GET("/notificaciones", notifH.List)
		api.GET("/notificaciones/count", notifH.CountUnread)
		api.GET("/notificaciones/counts", notifH.Counts)
		api.POST("/notificaciones", notifH.Create)
		api.PATCH("/notificaciones/:id/leido", notifH.MarkRead)
		api.PATCH("/notificaciones/marcar-todas-leidas", notifH.MarkAllRead)
		api.GET("/notificaciones/health", notifH.Health)

		// ── Roles dinámicos por proyecto (V1.1 §1) ──
		api.GET("/proyectos/:id/roles", prH.List)
		api.POST("/proyectos/:id/roles", prH.Assign)
		api.DELETE("/proyectos/:id/roles", prH.Revoke)
		api.GET("/usuarios/:tipo/:id/roles", prH.RolesDeUsuario)

		// ── Comité RSU (M04) ──
		api.GET("/comite-rsu", comiteH.List)
		api.GET("/comite-rsu/escuela/:id", comiteH.ByEscuela)
		api.POST("/comite-rsu", comiteH.Create)
		api.DELETE("/comite-rsu/:id", comiteH.Delete)

		// ── Configuración (M11) ──
		api.GET("/configuracion", configH.List)
		api.GET("/configuracion/clave/:clave", configH.Get)
		api.PUT("/configuracion/clave/:clave", middleware.RequiereRol("ADMIN"), configH.Upsert)
		api.DELETE("/configuracion/:id", middleware.RequiereRol("ADMIN"), configH.Delete)

		// ── Auditoría (M09) — solo lectura, acceso admin ──
		api.GET("/auditoria", middleware.RequiereRol("ADMIN"), auditH.List)

		// ── Constancias (RSU_Solicitud_Constancia) ──
		api.POST("/constancias", constH.Create)

		// ── Justificación de faltas (HU-014, R11: máx 2 por estudiante) ──
		api.POST("/justificaciones", justH.Create)
		api.GET("/justificaciones/estudiante", justH.ByEstudiante)
		api.GET("/estudiantes/:id/justificaciones", justH.ByEstudiante)
		api.PATCH("/justificaciones/:id", justH.UpdateEstado)

		// ── Modificación de informe inicial (HU-015) ──
		api.POST("/modificaciones-informe", modH.Create)
		api.GET("/proyectos/:id/modificaciones", modH.ByProyecto)
		api.PATCH("/modificaciones-informe/:id", modH.Update)

		// ── Planificación de actividades desde Excel (HU-010) ──
		// Límite 10/min: interpretar Excels es costoso (proceso Python).
		api.POST("/actividades/planificacion", middleware.RateLimit(10, time.Minute), planH.Guardar)
		api.POST("/actividades/planificacion/preview", middleware.RateLimit(20, time.Minute), planH.Previsualizar)
		api.GET("/actividades/plantilla-planificacion", planH.Plantilla)
		api.GET("/plantillas/:archivo", planH.PlantillaDeDescarga)

		// ── Solicitudes de unión a PEP (HU-063..HU-068) ──
		api.POST("/proyectos/:id/solicitudes-union", solUnionH.Create)
		api.GET("/proyectos/:id/solicitudes-union", solUnionH.ListByProyecto)
		api.GET("/estudiantes/:id/solicitudes-union", solUnionH.ListByEstudiante)
		api.PATCH("/solicitudes-union/:id/aceptar", solUnionH.Aceptar)
		api.PATCH("/solicitudes-union/:id/rechazar", solUnionH.Rechazar)
		api.DELETE("/solicitudes-union/:id", solUnionH.Cancelar)

		// ── Gestión de usuarios y permisos (solo ADMIN) ──
		api.GET("/usuarios", userAdminH.List)
		api.POST("/usuarios", userAdminH.Crear)
		api.GET("/usuarios/roles-disponibles", userAdminH.RolesDisponibles)
		api.GET("/usuarios/modulos-disponibles", userAdminH.ModulosDisponibles)
		api.PUT("/usuarios/:id", userAdminH.Actualizar)
		api.DELETE("/usuarios/:id", userAdminH.Eliminar)
		api.PUT("/usuarios/:id/permisos", userAdminH.Permiso)

		// ── Formatos y guías RSU ──
		// Catálogo fijo de 7 formatos. Cualquier usuario autenticado puede verlos
		// y descargarlos; solo ADMIN reemplaza o restaura el archivo.
		api.GET("/formatos", formatoH.List)
		api.GET("/formatos/codigos", formatoH.Codigos)
		api.GET("/formatos/:codigo/descargar", formatoH.Descargar)
		api.POST("/formatos/:codigo/archivo", formatoH.Subir)
		api.DELETE("/formatos/:codigo/archivo", formatoH.Restaurar)

		// ── Fase 1 · Creación (HU-F1) ──
		// Bucle del docente asesor, reactivación de archivados y catálogo DRSU.
		handler.RegisterFase1(api, db, projH.Svc())
	}
	return r
}
