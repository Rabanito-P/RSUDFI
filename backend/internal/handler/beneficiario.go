package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/service"
	"undc-rsu/backend/pkg/utils"
)

// ── Beneficiario Handler ─────────────────────────────────────

type BeneficiarioHandler struct{ svc *service.BeneficiarioService }
func NewBeneficiarioHandler(db *gorm.DB) *BeneficiarioHandler { return &BeneficiarioHandler{svc: service.NewBeneficiarioService(db)} }
// Registrar beneficiario (DNI 8 / RUC 11 según tipo)
// @Tags		Beneficiarios
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/beneficiarios [post]
func (h *BeneficiarioHandler) Create(c *gin.Context) {
	var req dto.CreateBeneficiarioReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	b, err := h.svc.Create(req)
	if err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Created(c, b, "Beneficiario creado")
}
// Listar padrón de beneficiarios (filtros + search)
// @Tags		Beneficiarios
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/beneficiarios [get]
func (h *BeneficiarioHandler) List(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	items, total, err := h.svc.List(page, limit, c.Query("search"))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}
// Obtener beneficiario por id
// @Tags		Beneficiarios
// @Accept		json
// @Produce	json
// @Param		id path int true "ID beneficiario"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/beneficiarios/{id} [get]
func (h *BeneficiarioHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	b, err := h.svc.Get(uint(id))
	if err != nil { utils.Fail(c, 404, "No encontrado", nil); return }
	utils.Success(c, b, "OK")
}
// Vincular beneficiario a proyecto (único por proyecto)
// @Tags		Beneficiarios
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/beneficiarios/vincular [post]
func (h *BeneficiarioHandler) Vincular(c *gin.Context) {
	var req dto.VincularBeneficiarioReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	if err := h.svc.Vincular(req); err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Success(c, nil, "Beneficiario vinculado")
}
// Beneficiarios vinculados a un proyecto
// @Tags		Beneficiarios
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/beneficiarios [get]
func (h *BeneficiarioHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.svc.ListByProyecto(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}

