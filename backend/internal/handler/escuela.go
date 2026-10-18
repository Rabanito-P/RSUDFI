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

// ── Escuela Handler ──────────────────────────────────────────

type EscuelaHandler struct{ repo *repository.EscuelaRepo }

func NewEscuelaHandler(db *gorm.DB) *EscuelaHandler {
	return &EscuelaHandler{repo: repository.NewEscuelaRepo(db)}
}

// Crear escuela
// @Tags		Estructura
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/escuelas [post]
func (h *EscuelaHandler) Create(c *gin.Context) {
	var req dto.CreateEscuelaReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	e := &domain.Escuela{IDFacultad: req.IDFacultad, Codigo: req.Codigo, Nombre: req.Nombre, DirectorID: req.DirectorID, Activo: true}
	if err := h.repo.Create(e); err != nil {
		utils.Fail(c, 400, "Error crear escuela", err.Error())
		return
	}
	utils.Created(c, e, "Escuela creada")
}

// Listar escuelas (filtrable por id_facultad)
// @Tags		Estructura
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/escuelas [get]
func (h *EscuelaHandler) List(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	var idFac *uint
	if v := c.Query("id_facultad"); v != "" {
		n, _ := strconv.Atoi(v)
		u := uint(n)
		idFac = &u
	}
	items, total, err := h.repo.FindAll(page, limit, idFac)
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}

// Obtener escuela por id
// @Tags		Estructura
// @Accept		json
// @Produce	json
// @Param		id path int true "ID escuela"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/escuelas/{id} [get]
func (h *EscuelaHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	e, err := h.repo.FindByID(uint(id))
	if err != nil {
		utils.Fail(c, 404, "No encontrada", nil)
		return
	}
	utils.Success(c, e, "OK")
}
