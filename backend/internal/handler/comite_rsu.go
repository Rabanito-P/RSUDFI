package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/pkg/utils"
)

// ── Comité RSU (M04) ───────────────────────────────────────

type ComiteRSUHandler struct{ repo *repository.ComiteRSURepo }

func NewComiteRSUHandler(db *gorm.DB) *ComiteRSUHandler {
	return &ComiteRSUHandler{repo: repository.NewComiteRSURepo(db)}
}

// Comité RSU (use /escuela/{id} para listar por escuela)
// @Tags		Comité RSU
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/comite-rsu [get]
func (h *ComiteRSUHandler) List(c *gin.Context) {
	// Sin filtro de escuela (?id_escuela=) devuelve comité de la escuela 1 por defecto;
	// ByEscuela es el endpoint canónico por escuela.
	if v := c.Query("id_escuela"); v != "" {
		h.ByEscuela(c)
		return
	}
	utils.Success(c, []domain.RSUComiteRSU{}, "Use /comite-rsu/escuela/:id")
}

// Integrantes del comité por escuela
// @Tags		Comité RSU
// @Accept		json
// @Produce	json
// @Param		id path int true "ID escuela"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/comite-rsu/escuela/{id} [get]
func (h *ComiteRSUHandler) ByEscuela(c *gin.Context) {
	key := c.Param("id")
	if key == "" {
		key = c.Query("id_escuela")
	}
	id, _ := strconv.Atoi(key)
	list, err := h.repo.FindByEscuela(uint(id))
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, list, "OK")
}

// Designar integrante del comité (Decano)
// @Tags		Comité RSU
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/comite-rsu [post]
func (h *ComiteRSUHandler) Create(c *gin.Context) {
	var body domain.RSUComiteRSU
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	if body.Estado == "" {
		body.Estado = "ACTIVO"
	}
	if err := h.repo.Create(&body); err != nil {
		utils.Fail(c, 400, "Error creando integrante", err.Error())
		return
	}
	utils.Created(c, body, "Integrante creado")
}

// Remover integrante del comité
// @Tags		Comité RSU
// @Accept		json
// @Produce	json
// @Param		id path int true "ID comité"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/comite-rsu/{id} [delete]
func (h *ComiteRSUHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.repo.Delete(uint(id)); err != nil {
		utils.Fail(c, 400, "Error eliminando", err.Error())
		return
	}
	utils.Success(c, nil, "Eliminado")
}

