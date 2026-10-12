package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/service"
	"undc-rsu/backend/pkg/utils"
)

// ── Solicitudes de unión a PEP (HU-063..HU-068) ───────────────

type SolicitudUnionHandler struct {
	svc *service.SolicitudUnionService
}

func NewSolicitudUnionHandler(db *gorm.DB) *SolicitudUnionHandler {
	return &SolicitudUnionHandler{svc: service.NewSolicitudUnionService(db)}
}

// Solicitar unirse a un PEP abierto (genera PENDIENTE, no inscribe directo)
// @Tags		SolicitudesUnión
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto PEP"
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/solicitudes-union [post]
func (h *SolicitudUnionHandler) Create(c *gin.Context) {
	idProj, _ := strconv.Atoi(c.Param("id"))
	if idProj == 0 {
		utils.Fail(c, 400, "id_proyecto requerido", nil)
		return
	}
	var req dto.CrearSolicitudUnionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	sol, err := h.svc.Create(uint(idProj), req)
	if err != nil {
		utils.Fail(c, 400, err.Error(), nil)
		return
	}
	utils.Created(c, sol, "Solicitud enviada al responsable del PEP")
}

// Solicitudes de un proyecto (bandeja del responsable)
// @Tags		SolicitudesUnión
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Param		estado query string false "PENDIENTE, ACEPTADA, RECHAZADA, CANCELADA"
// @Success	200 {object} map[string]any "OK"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/solicitudes-union [get]
func (h *SolicitudUnionHandler) ListByProyecto(c *gin.Context) {
	idProj, _ := strconv.Atoi(c.Param("id"))
	items, err := h.svc.ListByProyecto(uint(idProj), c.Query("estado"))
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, items, "OK")
}

// Mis solicitudes de unión (estudiante)
// @Tags		SolicitudesUnión
// @Produce	json
// @Param		id path int true "ID estudiante"
// @Success	200 {object} map[string]any "OK"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/estudiantes/{id}/solicitudes-union [get]
func (h *SolicitudUnionHandler) ListByEstudiante(c *gin.Context) {
	idEst, _ := strconv.Atoi(c.Param("id"))
	items, err := h.svc.ListByEstudiante(uint(idEst))
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, items, "OK")
}

// Aceptar solicitud (el responsable inscribe al estudiante al equipo)
// @Tags		SolicitudesUnión
// @Accept		json
// @Produce	json
// @Param		id path int true "ID solicitud"
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/solicitudes-union/{id}/aceptar [patch]
func (h *SolicitudUnionHandler) Aceptar(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct {
		IDRevisor uint `json:"id_revisor"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	// El ADMIN global también puede resolver (rol del token).
	esAdm := c.GetString("rol_actor") == "ADMIN"
	sol, err := h.svc.Aceptar(uint(id), body.IDRevisor, esAdm)
	if err != nil {
		utils.Fail(c, 400, err.Error(), nil)
		return
	}
	utils.Success(c, sol, "Solicitud aceptada — estudiante inscrito al equipo")
}

// Rechazar solicitud con motivo rápido obligatorio
// @Tags		SolicitudesUnión
// @Accept		json
// @Produce	json
// @Param		id path int true "ID solicitud"
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/solicitudes-union/{id}/rechazar [patch]
func (h *SolicitudUnionHandler) Rechazar(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct {
		IDRevisor     uint   `json:"id_revisor"`
		MotivoRapido  string `json:"motivo_rapido" binding:"required"`
		MotivoRechazo string `json:"motivo_rechazo" binding:"max=500"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	sol, err := h.svc.Rechazar(uint(id), body.IDRevisor, c.GetString("rol_actor") == "ADMIN", body.MotivoRapido, body.MotivoRechazo)
	if err != nil {
		utils.Fail(c, 400, err.Error(), nil)
		return
	}
	utils.Success(c, sol, "Solicitud rechazada — se notificó al estudiante")
}

// Cancelar mi solicitud pendiente
// @Tags		SolicitudesUnión
// @Accept		json
// @Produce	json
// @Param		id path int true "ID solicitud"
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/solicitudes-union/{id} [delete]
func (h *SolicitudUnionHandler) Cancelar(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var idEst uint
	if v := c.Query("id_estudiante"); v != "" {
		n, _ := strconv.Atoi(v)
		idEst = uint(n)
	} else {
		var body struct {
			IDEstudiante uint `json:"id_estudiante" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			utils.ValidationFail(c, err.Error())
			return
		}
		idEst = body.IDEstudiante
	}
	if idEst == 0 {
		utils.Fail(c, 400, "id_estudiante requerido", nil)
		return
	}
	if err := h.svc.Cancelar(uint(id), idEst); err != nil {
		utils.Fail(c, 400, err.Error(), nil)
		return
	}
	utils.Success(c, nil, "Solicitud cancelada")
}
