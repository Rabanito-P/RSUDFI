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

// ── Presupuesto Handler ──────────────────────────────────────

type PresupuestoHandler struct{
	repo *repository.PresupuestoRepo
}
func NewPresupuestoHandler(db *gorm.DB) *PresupuestoHandler { return &PresupuestoHandler{repo: repository.NewPresupuestoRepo(db)} }
// Registrar movimiento (ASIGNACION/EJECUCION/TRANSFERENCIA/DEVOLUCION)
// @Tags		Presupuesto
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/presupuesto/movimientos [post]
func (h *PresupuestoHandler) CreateMov(c *gin.Context) {
	var req dto.CreateMovimientoReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	fecha, err := utils.ParseDate(req.Fecha)
	if err != nil { utils.Fail(c, 400, "fecha inválida", err.Error()); return }
	m := &domain.RSUPresupuestoMovimiento{IDProyecto: req.IDProyecto, IDFacultad: req.IDFacultad, Tipo: req.Tipo, Monto: req.Monto, Fecha: fecha, Observaciones: req.Observaciones}
	// Auditoría: id_usuario_registro es NOT NULL en BD; sale del token, nunca del body.
	if v, ok := c.Get("user_id"); ok {
		if uid, ok := v.(uint); ok && uid > 0 { m.IDUsuarioRegistro = &uid }
	}
	if m.IDUsuarioRegistro == nil { utils.Fail(c, 401, "sesión no identificada", nil); return }
	if err := h.repo.CreateMov(m); err != nil { utils.Fail(c, 400, "Error", err.Error()); return }
	utils.Created(c, m, "Movimiento registrado")
}
// Movimientos de presupuesto del proyecto
// @Tags		Presupuesto
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/presupuesto [get]
func (h *PresupuestoHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.repo.FindByProyecto(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}

