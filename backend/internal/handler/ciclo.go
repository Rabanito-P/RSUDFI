package handler

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/pkg/utils"
)

// ── Ciclo Handler ────────────────────────────────────────────

type CicloHandler struct{ repo *repository.CicloRepo }
func NewCicloHandler(db *gorm.DB) *CicloHandler { return &CicloHandler{repo: repository.NewCicloRepo(db)} }
// Crear ciclo académico
// @Tags		Estructura
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/ciclos [post]
func (h *CicloHandler) Create(c *gin.Context) {
	var req dto.CicloReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	// parse dates
	fechaInicio, _ := utils.ParseDate(req.FechaInicio)
	fechaFin, _ := utils.ParseDate(req.FechaFin)
	cl := &domain.CicloAcademico{Nombre: req.Nombre, FechaInicio: fechaInicio, FechaFin: fechaFin, Activo: req.Activo}
	if err := h.repo.Create(cl); err != nil { utils.Fail(c, 400, "Error crear ciclo", err.Error()); return }
	utils.Created(c, cl, "Ciclo creado")
}
// Listar ciclos académicos
// @Tags		Estructura
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/ciclos [get]
func (h *CicloHandler) List(c *gin.Context) {
	items, err := h.repo.FindAll()
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, items, "OK")
}

