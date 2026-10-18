package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/pkg/utils"
)

// ── Facultad Handler ─────────────────────────────────────────

type FacultadHandler struct {
	repo *repository.FacultadRepo
}

func NewFacultadHandler(db *gorm.DB) *FacultadHandler {
	return &FacultadHandler{repo: repository.NewFacultadRepo(db)}
}

// Crear facultad
// @Tags		Estructura
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/facultades [post]
func (h *FacultadHandler) Create(c *gin.Context) {
	var req dto.CreateFacultadReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	f := &domain.Facultad{Codigo: req.Codigo, Nombre: req.Nombre, DecanoID: req.DecanoID, Activo: true}
	if err := h.repo.Create(f); err != nil {
		utils.Fail(c, 400, "No se pudo crear facultad", err.Error())
		return
	}
	utils.Created(c, f, "Facultad creada")
}

// Listar facultades (paginado + search)
// @Tags		Estructura
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/facultades [get]
func (h *FacultadHandler) List(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	search := c.Query("search")
	items, total, err := h.repo.FindAll(page, limit, search)
	if err != nil {
		utils.Fail(c, 500, "Error listando facultades", err.Error())
		return
	}
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}

// Obtener facultad por id
// @Tags		Estructura
// @Accept		json
// @Produce	json
// @Param		id path int true "ID facultad"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/facultades/{id} [get]
func (h *FacultadHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	f, err := h.repo.FindByID(uint(id))
	if err != nil {
		utils.Fail(c, 404, "Facultad no encontrada", nil)
		return
	}
	utils.Success(c, f, "OK")
}

// Actualizar facultad
// @Tags		Estructura
// @Accept		json
// @Produce	json
// @Param		id path int true "ID facultad"
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/facultades/{id} [put]
func (h *FacultadHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	f, err := h.repo.FindByID(uint(id))
	if err != nil {
		utils.Fail(c, 404, "No encontrada", nil)
		return
	}
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	if v, ok := req["nombre"].(string); ok {
		f.Nombre = v
	}
	if v, ok := req["codigo"].(string); ok {
		f.Codigo = v
	}
	if err := h.repo.Update(f); err != nil {
		utils.Fail(c, 500, "No se pudo actualizar facultad", err.Error())
		return
	}
	utils.Success(c, f, "Actualizada")
}

// Eliminar facultad
// @Tags		Estructura
// @Accept		json
// @Produce	json
// @Param		id path int true "ID facultad"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/facultades/{id} [delete]
func (h *FacultadHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.repo.Delete(uint(id)); err != nil {
		utils.Fail(c, 500, "No se pudo eliminar facultad", err.Error())
		return
	}
	utils.Success(c, nil, "Eliminada")
}
