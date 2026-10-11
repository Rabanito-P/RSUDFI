package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/pkg/utils"
)

// ── Solicitudes de constancia (RSU_Solicitud_Constancia) ──────

type ConstanciaHandler struct {
	repo *repository.ConstanciaRepo
	db   *gorm.DB
}

func NewConstanciaHandler(db *gorm.DB) *ConstanciaHandler {
	return &ConstanciaHandler{repo: repository.NewConstanciaRepo(db), db: db}
}

// Solicitudes de constancia del estudiante
// @Tags		Constancias
// @Accept		json
// @Produce	json
// @Param		id path int true "ID estudiante"
// @Success	200 {object} map[string]any "OK"
// @Failure	401 {object} map[string]any "No autorizado"
// @Failure	500 {object} map[string]any "Error"
// @Router		/api/v1/estudiantes/{id}/constancias [get]
func (h *ConstanciaHandler) ByEstudiante(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id < 1 {
		utils.Fail(c, 400, "ID de estudiante inválido", nil)
		return
	}
	list, err := h.repo.FindByEstudiante(uint(id))
	if err != nil {
		utils.Fail(c, 500, "Error listando constancias", err.Error())
		return
	}
	utils.Success(c, list, "OK")
}

// Registrar solicitud de constancia
// @Tags		Constancias
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	201 {object} map[string]any "Creada"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Failure	409 {object} map[string]any "Ya existe solicitud pendiente"
// @Router		/api/v1/constancias [post]
func (h *ConstanciaHandler) Create(c *gin.Context) {
	var body struct {
		IDProyecto     uint   `json:"id_proyecto" binding:"required"`
		IDEstudiante   uint   `json:"id_estudiante" binding:"required"`
		TipoConstancia string `json:"tipo_constancia" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	validos := map[string]bool{"PARTICIPACION": true, "HORAS": true, "CULMINACION": true}
	if !validos[body.TipoConstancia] {
		utils.Fail(c, 400, "tipo_constancia inválido: use PARTICIPACION, HORAS o CULMINACION", nil)
		return
	}
	var proj domain.RSUProyecto
	if err := h.db.Preload("EstadoActual").First(&proj, "id_proyecto = ?", body.IDProyecto).Error; err != nil {
		utils.Fail(c, 404, "Proyecto no encontrado", nil)
		return
	}
	if proj.EstadoActual == nil || proj.EstadoActual.Codigo != "CERRADO" {
		utils.Fail(c, 400, "Las constancias se solicitan solo con proyecto CERRADO", nil)
		return
	}
	if h.repo.ExistePendiente(body.IDProyecto, body.IDEstudiante, body.TipoConstancia) {
		utils.Fail(c, 409, "Ya existe una solicitud de este tipo para el proyecto", nil)
		return
	}
	s := &domain.RSUSolicitudConstancia{
		IDProyecto:     body.IDProyecto,
		IDEstudiante:   body.IDEstudiante,
		TipoConstancia: body.TipoConstancia,
		Estado:         "PENDIENTE",
	}
	if err := h.repo.Create(s); err != nil {
		utils.Fail(c, 500, "Error registrando solicitud", err.Error())
		return
	}
	utils.Created(c, s, "Solicitud registrada (PENDIENTE)")
}
