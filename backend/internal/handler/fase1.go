package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/service"
	"undc-rsu/backend/pkg/utils"
)

// ─────────────────────────────────────────────────────────────────
// HU-F1-03 / HU-F1-04 / HU-F1-07 / HU-F1-08
// Endpoints de la Fase 1 (Creación): envío al asesor, bucle de
// aceptación/rechazo, reactivación de archivados y catálogo DRSU.
// ─────────────────────────────────────────────────────────────────

type fase1Handler struct {
	db  *gorm.DB
	svc *service.ProyectoService
}

// esDocenteToken vive en permisos.go (autorización en dos capas).

// RegisterFase1 registra los endpoints de la Fase 1 (Creación) sobre el
// grupo de rutas ya autenticado.
func RegisterFase1(api *gin.RouterGroup, db *gorm.DB, svc *service.ProyectoService) {
	h := &fase1Handler{db: db, svc: svc}

	// HU-F1-03: el líder remite la propuesta al docente asesor.
	api.POST("/proyectos/:id/enviar-asesor", h.EnviarAsesor)
	// HU-F1-04: el docente acepta o rechaza la asesoría.
	api.POST("/proyectos/:id/decision-asesor", h.DecisionAsesor)
	// HU-F1-07: reactivación de un proyecto archivado por vencimiento.
	api.POST("/proyectos/:id/reactivar", h.Reactivar)
	// HU-F1-08: catálogo de formatos oficiales DRSU (solo lectura).
	api.GET("/formatos/drsu", h.ListarFormatosDRSU)
	api.GET("/formatos/drsu/:codigo", h.DetalleFormatoDRSU)
}

// EnviarAsesor — HU-F1-03
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Param		body body service.EnviarAsesorReq true "Asesor y comentario"
// @Success	200 {object} map[string]any "Propuesta enviada al asesor"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	403 {object} map[string]any "Sin permisos"
// @Router		/api/v1/proyectos/{id}/enviar-asesor [post]
func (h *fase1Handler) EnviarAsesor(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	proj, err := h.svc.Get(uint(id))
	if err != nil {
		utils.Fail(c, 404, "Proyecto no encontrado", err.Error())
		return
	}
	// Solo el líder (o un rol de gestión RSU) remite la propuesta.
	rol := c.GetString("rol_actor")
	gestion := rol == "DIR_RS_FACULTAD" || rol == "ADMIN" || rol == "DIR_ESCUELA"
	esLider := esEstudianteToken(h.db, c) &&
		proj.IDEstudianteLider != nil &&
		uint(personaIDFromToken(h.db, c)) == *proj.IDEstudianteLider
	if !gestion && !esLider {
		utils.Fail(c, 403, "solo el líder del proyecto puede remitir la propuesta al asesor", nil)
		return
	}

	var body struct {
		IDDocenteAsesor *uint  `json:"id_docente_asesor"`
		Comentario      string `json:"comentario"`
	}
	_ = c.ShouldBindJSON(&body)

	// CA-2.4: el cronograma debe alcanzar las horas mínimas antes de remitir.
	var advertencia string
	if err := h.svc.ValidarEnvioPropuesta(uint(id)); err != nil {
		if adv, ok := err.(*service.AdvertenciaHorasError); ok {
			// CA-2.6: no bloquea, solo informa.
			advertencia = adv.Mensaje
		} else {
			utils.Fail(c, 400, err.Error(), nil)
			return
		}
	}

	req := service.EnviarAsesorReq{
		ProyectoID:      uint(id),
		IDDocenteAsesor: body.IDDocenteAsesor,
		Comentario:      body.Comentario,
	}
	if err := h.svc.EnviarAAsesor(req, uint(personaIDFromToken(h.db, c))); err != nil {
		utils.Fail(c, 400, err.Error(), nil)
		return
	}
	msg := "Propuesta enviada al docente asesor; el proyecto espera su respuesta"
	if advertencia != "" {
		msg += ". " + advertencia
	}
	utils.Success(c, map[string]any{"advertencia": advertencia}, msg)
}

// DecisionAsesor — HU-F1-04 (CAMINO BUENO y CAMINO 1)
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Param		body body service.DecisionAsesorReq true "Decisión y motivo"
// @Success	200 {object} map[string]any "Decisión registrada"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	403 {object} map[string]any "Sin permisos"
// @Router		/api/v1/proyectos/{id}/decision-asesor [post]
func (h *fase1Handler) DecisionAsesor(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	proj, err := h.svc.Get(uint(id))
	if err != nil {
		utils.Fail(c, 404, "Proyecto no encontrado", err.Error())
		return
	}
	// Solo el docente asesor del proyecto (o un rol de gestión) responde.
	rol := c.GetString("rol_actor")
	gestion := rol == "DIR_RS_FACULTAD" || rol == "ADMIN" || rol == "DIR_ESCUELA"
	esAsesor := esDocenteToken(h.db, c) &&
		proj.IDDocenteAsesor != nil &&
		uint(personaIDFromToken(h.db, c)) == *proj.IDDocenteAsesor
	if !gestion && !esAsesor {
		utils.Fail(c, 403, "solo el docente asesor del proyecto puede aceptar o rechazar la asesoría", nil)
		return
	}

	var body struct {
		Decision string  `json:"decision" binding:"required,oneof=ACEPTAR RECHAZAR"`
		Motivo   *string `json:"motivo"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}

	req := service.DecisionAsesorReq{
		ProyectoID: uint(id),
		Decision:   body.Decision,
		Motivo:     body.Motivo,
	}
	if err := h.svc.ResolverDecisionAsesor(req, uint(personaIDFromToken(h.db, c))); err != nil {
		utils.Fail(c, 400, err.Error(), nil)
		return
	}
	if strings.EqualFold(body.Decision, "ACEPTAR") {
		utils.Success(c, nil, "Asesoría aceptada; el proyecto queda habilitado para envío a Escuela")
		return
	}
	utils.Success(c, nil, "Asesoría rechazada; el contenido quedó congelado y puede elegir un nuevo asesor")
}

// Reactivar — HU-F1-07
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "Proyecto reactivado"
// @Failure	400 {object} map[string]any "Sin cupo libre del asesor"
// @Failure	403 {object} map[string]any "Sin permisos"
// @Router		/api/v1/proyectos/{id}/reactivar [post]
func (h *fase1Handler) Reactivar(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	proj, err := h.svc.Get(uint(id))
	if err != nil {
		utils.Fail(c, 404, "Proyecto no encontrado", err.Error())
		return
	}
	rol := c.GetString("rol_actor")
	gestion := rol == "DIR_RS_FACULTAD" || rol == "ADMIN" || rol == "DIR_ESCUELA"
	esLider := esEstudianteToken(h.db, c) &&
		proj.IDEstudianteLider != nil &&
		uint(personaIDFromToken(h.db, c)) == *proj.IDEstudianteLider
	if !gestion && !esLider {
		utils.Fail(c, 403, "solo el líder del proyecto puede reactivarlo", nil)
		return
	}

	if err := h.svc.ReactivarArchivado(uint(id), proj.IDCicloCreacion, uint(personaIDFromToken(h.db, c))); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(c, nil, "Proyecto reactivado en BORRADOR; puede volver a enviarlo al asesor")
}

// ListarFormatosDRSU — HU-F1-08
// @Tags		Formatos
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "Catálogo DRSU de Fase 1"
// @Router		/api/v1/formatos/drsu [get]
func (h *fase1Handler) ListarFormatosDRSU(c *gin.Context) {
	if err := service.ValidarCatalogoDRSU(); err != nil {
		utils.Fail(c, 500, err.Error(), nil)
		return
	}
	utils.Success(c, service.CatalogoDRSUFase1(), "Catálogo de formatos DRSU (solo descarga)")
}

// DetalleFormatoDRSU — HU-F1-08
// @Tags		Formatos
// @Accept		json
// @Produce	json
// @Param		codigo path string true "Código del formato DRSU"
// @Success	200 {object} map[string]any "Formato"
// @Failure	404 {object} map[string]any "Formato no encontrado"
// @Router		/api/v1/formatos/drsu/{codigo} [get]
func (h *fase1Handler) DetalleFormatoDRSU(c *gin.Context) {
	f, err := service.BuscarFormatoDRSU(c.Param("codigo"))
	if err != nil {
		utils.Fail(c, 404, err.Error(), nil)
		return
	}
	utils.Success(c, f, "OK")
}
