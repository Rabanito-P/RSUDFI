package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/pkg/utils"
)

// ── Auditoría (M09, solo lectura) ───────────────────────────

type AuditoriaHandler struct{ repo *repository.AuditoriaRepo }

func NewAuditoriaHandler(db *gorm.DB) *AuditoriaHandler {
	return &AuditoriaHandler{repo: repository.NewAuditoriaRepo(db)}
}

// Listar auditoría (solo Admin, filtros id_proyecto/accion)
// @Tags		Auditoría
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/auditoria [get]
func (h *AuditoriaHandler) List(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	var idProj *uint
	if v := c.Query("id_proyecto"); v != "" {
		n, _ := strconv.Atoi(v)
		u := uint(n)
		idProj = &u
	}
	var accion *string
	if v := c.Query("accion"); v != "" {
		accion = &v
	}
	list, total, err := h.repo.FindAll(page, limit, idProj, accion)
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Paginated(c, list, utils.BuildMeta(page, limit, total), "OK")
}
