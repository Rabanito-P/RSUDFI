package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/service"
	"undc-rsu/backend/pkg/utils"
)

// ── Encuesta Handler ─────────────────────────────────────────

type EncuestaHandler struct{ svc *service.EncuestaService }
func NewEncuestaHandler(db *gorm.DB) *EncuestaHandler { return &EncuestaHandler{svc: service.NewEncuestaService(db)} }
// Aplicar encuesta Likert 1-5 a beneficiario (promedio + deduplicación)
// @Tags		Encuestas
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/encuestas/beneficiario [post]
func (h *EncuestaHandler) Create(c *gin.Context) {
	var req dto.CreateEncuestaBenefReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	enc, err := h.svc.CrearEncuestaBeneficiario(req)
	if err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Created(c, enc, "Encuesta registrada")
}
// Encuestas aplicadas en el proyecto
// @Tags		Encuestas
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/encuestas [get]
func (h *EncuestaHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.svc.ListByProyecto(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}

