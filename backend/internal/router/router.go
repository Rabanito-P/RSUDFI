package router

import (
	"undc-rsu/backend/internal/handler"
	"undc-rsu/backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func Setup(db *gorm.DB) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery(), middleware.CORS(), middleware.Logger(), middleware.AuditMiddleware(db))
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
	encH := handler.NewEncuestaHandler(db)
	presH := handler.NewPresupuestoHandler(db)
	documH := handler.NewDocumentoHandler(db)
	catH := handler.NewCatalogoHandler(db)
	dashH := handler.NewDashboardHandler(db)
	indH := handler.NewIndicadorHandler(db)
	monH := handler.NewMonitoreoHandler(db)
	entH := handler.NewEntregableHandler(db)
	authH := handler.NewAuthHandler(db)
	notifH := handler.NewNotificacionHandler(db)
	// Nuevos módulos (V1.1): roles dinámicos, comité RSU, configuración, auditoría
	prH := handler.NewProyectoRolHandler(db)
	comiteH := handler.NewComiteRSUHandler(db)
	configH := handler.NewConfiguracionHandler(db)
	auditH := handler.NewAuditoriaHandler(db)

	r.GET("/health", handler.Health)
	r.GET("/", handler.Health)

	api := r.Group("/api/v1")
	{
		// auth
		api.POST("/auth/login", authH.Login)
		api.GET("/auth/me", authH.Me)

		// dashboard
		api.GET("/dashboard/kpis", dashH.KPIs)

		// catálogos RSU
		api.GET("/catalogos/tipos-proyecto", catH.TiposProyecto)
		api.GET("/catalogos/lineas-accion", catH.LineasAccion)
		api.GET("/catalogos/estados", catH.Estados)
		api.GET("/catalogos/roles-actor", catH.RolesActor)
		api.GET("/catalogos/tipos-documento", catH.TiposDocumento)
		api.GET("/catalogos/transiciones", catH.Transiciones)
		api.GET("/catalogos/preguntas-encuesta", catH.PreguntasEncuesta)

		// estructura
		api.POST("/facultades", facH.Create)
		api.GET("/facultades", facH.List)
		api.GET("/facultades/:id", facH.Get)
		api.PUT("/facultades/:id", facH.Update)
		api.DELETE("/facultades/:id", facH.Delete)

		api.POST("/escuelas", escH.Create)
		api.GET("/escuelas", escH.List)
		api.GET("/escuelas/:id", escH.Get)

		api.POST("/ciclos", cicloH.Create)
		api.GET("/ciclos", cicloH.List)

		api.POST("/docentes", docH.Create)
		api.GET("/docentes", docH.List)
		api.GET("/docentes/:id", docH.Get)

		api.POST("/estudiantes", estH.Create)
		api.GET("/estudiantes", estH.List)
		api.GET("/estudiantes/:id", estH.Get)

		// proyecto (núcleo) — HU-001 a HU-009
		api.POST("/proyectos", projH.Create)
		api.GET("/proyectos", projH.List)
		api.GET("/proyectos/resumen", projH.ResumenVw) // vista vw_rsu_proyectos_resumen
		api.GET("/proyectos/:id", projH.Get)
		api.PUT("/proyectos/:id", projH.Update)
		api.POST("/proyectos/:id/transicion", projH.Transicion)
		api.GET("/proyectos/:id/historial", projH.Historial)
		// HU: estudiante ve su proyecto sea líder o miembro equipo; docente solo sus asesorados
		api.GET("/estudiantes/:id/proyectos", projH.ListByEstudiante)
		api.GET("/docentes/:id/proyectos", projH.ListByDocente)
		api.GET("/proyectos/:id/es-miembro/:estudianteId", projH.CheckMembresia)

		// entregables — cada fila tiene su Registrar modal (horas + PDF)
		api.POST("/entregables", entH.Create)
		api.GET("/proyectos/:id/entregables", entH.ByProyecto)
		api.PATCH("/entregables/:id", entH.Update)

		// asignaciones — estudiante 1 proyecto activo (V4)
		api.POST("/asignaciones/docente", asigH.AsignarDocente)
		api.POST("/asignaciones/estudiante", asigH.InscribirEstudiante)
		api.DELETE("/proyectos/:id/estudiantes/:estudianteId", asigH.RetirarEstudiante)
		api.GET("/proyectos/:id/docentes", asigH.ListDocentes)
		api.GET("/proyectos/:id/estudiantes", asigH.ListEstudiantes)

		// beneficiarios
		api.POST("/beneficiarios", benH.Create)
		api.GET("/beneficiarios", benH.List)
		api.GET("/beneficiarios/:id", benH.Get)
		api.POST("/beneficiarios/vincular", benH.Vincular)
		api.GET("/proyectos/:id/beneficiarios", benH.ByProyecto)

		// actividades campo
		api.POST("/actividades", actH.Create)
		api.GET("/proyectos/:id/actividades", actH.ByProyecto)
		api.PATCH("/actividades/:id/estado", actH.UpdateEstado)

		// monitoreo
		api.POST("/monitoreos", monH.Create)
		api.GET("/proyectos/:id/monitoreos", monH.ByProyecto)

		// documentos
		api.POST("/documentos/upload", documH.Upload)
		api.GET("/proyectos/:id/documentos", documH.ByProyecto)

		// presupuesto
		api.POST("/presupuesto/movimientos", presH.CreateMov)
		api.GET("/proyectos/:id/presupuesto", presH.ByProyecto)

		// encuestas e indicadores
		api.POST("/encuestas/beneficiario", encH.Create)
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
		api.GET("/configuracion/:clave", configH.Get)
		api.PUT("/configuracion/:clave", configH.Upsert)
		api.DELETE("/configuracion/:id", configH.Delete)

		// ── Auditoría (M09) — solo lectura, acceso admin ──
		api.GET("/auditoria", auditH.List)
	}
	return r
}
