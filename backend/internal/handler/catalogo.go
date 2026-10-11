package handler

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/pkg/utils"
)

// ── Catalogo Handler ─────────────────────────────────────────

type CatalogoHandler struct{ repo *repository.CatalogoRepo }
func NewCatalogoHandler(db *gorm.DB) *CatalogoHandler { return &CatalogoHandler{repo: repository.NewCatalogoRepo(db)} }
// Catálogo: tipos de proyecto (5 modalidades)
// @Tags		Catálogos
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/catalogos/tipos-proyecto [get]
func (h *CatalogoHandler) TiposProyecto(c *gin.Context) {
	l, err := h.repo.TiposProyecto()
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, l, "OK")
}
// Catálogo: líneas de acción
// @Tags		Catálogos
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/catalogos/lineas-accion [get]
func (h *CatalogoHandler) LineasAccion(c *gin.Context) {
	l, err := h.repo.LineasAccion()
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, l, "OK")
}
// Catálogo: 16 estados BPMN
// @Tags		Catálogos
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/catalogos/estados [get]
func (h *CatalogoHandler) Estados(c *gin.Context) {
	l, err := h.repo.Estados()
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, l, "OK")
}
// Catálogo: roles actor
// @Tags		Catálogos
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/catalogos/roles-actor [get]
func (h *CatalogoHandler) RolesActor(c *gin.Context) {
	l, err := h.repo.RolesActor()
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, l, "OK")
}
// Catálogo: tipos de documento por etapa
// @Tags		Catálogos
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/catalogos/tipos-documento [get]
func (h *CatalogoHandler) TiposDocumento(c *gin.Context) {
	l, err := h.repo.TiposDocumento()
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, l, "OK")
}
// Catálogo: transiciones BPMN permitidas por rol
// @Tags		Catálogos
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/catalogos/transiciones [get]
func (h *CatalogoHandler) Transiciones(c *gin.Context) {
	l, err := h.repo.Transiciones()
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, l, "OK")
}
// Catálogo: preguntas Likert P01-P06
// @Tags		Catálogos
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/catalogos/preguntas-encuesta [get]
func (h *CatalogoHandler) PreguntasEncuesta(c *gin.Context) {
	l, err := h.repo.PreguntasEncuesta()
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, l, "OK")
}

