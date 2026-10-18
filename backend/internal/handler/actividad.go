package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/pkg/utils"
)

// ── Actividad Handler ────────────────────────────────────────

type ActividadHandler struct {
	repo     *repository.ActividadRepo
	fotoRepo *gorm.DB
}

func NewActividadHandler(db *gorm.DB) *ActividadHandler {
	return &ActividadHandler{repo: repository.NewActividadRepo(db), fotoRepo: db}
}

// Registrar actividad de campo (miembro del equipo)
// @Tags		Ejecución
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/actividades [post]
func (h *ActividadHandler) Create(c *gin.Context) {
	var req dto.CreateActividadReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	estado := req.Estado
	if estado == "" {
		estado = "PROGRAMADA"
	}
	act := &domain.RSUActividadCampo{
		IDProyecto: req.IDProyecto, IDEntregable: req.IDEntregable,
		Nombre: req.Nombre, Descripcion: req.Descripcion, Lugar: req.Lugar, Estado: estado,
		Minutos: req.Minutos,
	}
	if req.FechaProgramada != nil {
		t, err := utils.ParseDate(*req.FechaProgramada)
		if err != nil {
			utils.Fail(c, 400, "fecha_programada inválida", err.Error())
			return
		}
		// HU-011: una actividad de campo no se programa a futuro — se registra lo realizado.
		if t.After(time.Now()) {
			utils.Fail(c, 400, "la fecha de la actividad no puede ser futura (HU-011)", nil)
			return
		}
		act.FechaProgramada = &t
	}
	// HU-011: hora fin > inicio cuando ambas están presentes.
	if req.HoraInicio != nil && req.HoraFin != nil && *req.HoraFin <= *req.HoraInicio {
		utils.Fail(c, 400, "la hora de finalización debe ser posterior a la de inicio (HU-011)", nil)
		return
	}
	if req.HoraInicio != nil {
		act.HoraInicio = req.HoraInicio
	}
	if req.HoraFin != nil {
		act.HoraFin = req.HoraFin
	}
	if err := h.repo.Create(act); err != nil {
		utils.Fail(c, 400, "Error crear actividad", err.Error())
		return
	}
	utils.Created(c, act, "Actividad creada")
}

// Actividades de campo del proyecto
// @Tags		Ejecución
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/actividades [get]
func (h *ActividadHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.repo.FindByProyecto(uint(id))
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, list, "OK")
}

// Cambiar estado de actividad
// @Tags		Ejecución
// @Accept		json
// @Produce	json
// @Param		id path int true "ID actividad"
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/actividades/{id}/estado [patch]
func (h *ActividadHandler) UpdateEstado(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct {
		Estado string `json:"estado" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	act, err := h.repo.FindByID(uint(id))
	if err != nil {
		utils.Fail(c, 404, "No encontrada", nil)
		return
	}
	// Validar transiciones de estado permitidas
	// PROGRAMADA → EN_EJECUCION → EJECUTADA | SUSPENDIDA
	// EN_EJECUCION → EJECUTADA | SUSPENDIDA
	// SUSPENDIDA → EN_EJECUCION
	// EJECUTADA terminal
	validos := map[string][]string{
		"PROGRAMADA":   {"EN_EJECUCION"},
		"EN_EJECUCION": {"EJECUTADA", "SUSPENDIDA"},
		"SUSPENDIDA":   {"EN_EJECUCION"},
		"EJECUTADA":    {},
	}
	if act.Estado != body.Estado {
		permitidos := validos[act.Estado]
		ok := false
		for _, p := range permitidos {
			if p == body.Estado {
				ok = true
				break
			}
		}
		if !ok {
			utils.Fail(c, 400, "transición de estado no permitida: "+act.Estado+" → "+body.Estado, nil)
			return
		}
	}
	act.Estado = body.Estado
	if err := h.repo.Update(act); err != nil {
		utils.Fail(c, 500, "Error actualizando estado", err.Error())
		return
	}
	utils.Success(c, act, "Estado actualizado")
}
