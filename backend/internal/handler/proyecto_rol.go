package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/pkg/utils"
)

// ── Roles dinámicos por proyecto (M07) ─────────────────────

type ProyectoRolHandler struct{ repo *repository.ProyectoRolRepo }

func NewProyectoRolHandler(db *gorm.DB) *ProyectoRolHandler {
	return &ProyectoRolHandler{repo: repository.NewProyectoRolRepo(db)}
}

// Roles dinámicos asignados al proyecto
// @Tags		Roles dinámicos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/roles [get]
func (h *ProyectoRolHandler) List(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.repo.FindByProyecto(uint(id))
	if err != nil {
		utils.Fail(c, 500, "Error listando roles", err.Error())
		return
	}
	utils.Success(c, list, "OK")
}

// Asignar rol por proyecto/modalidad/etapa
// @Tags		Roles dinámicos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/roles [post]
func (h *ProyectoRolHandler) Assign(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct {
		IDUsuario   uint   `json:"id_usuario" binding:"required"`
		TipoUsuario string `json:"tipo_usuario" binding:"required"`
		RolActor    string `json:"rol_actor" binding:"required"`
		AsignadoPor *uint  `json:"asignado_por"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	if h.repo.Existe(uint(id), body.TipoUsuario, body.IDUsuario, body.RolActor) {
		utils.Fail(c, 409, "Rol ya asignado", nil)
		return
	}
	pr := &domain.RSUProyectoRol{
		IDProyecto: uint(id), IDUsuario: body.IDUsuario,
		TipoUsuario: body.TipoUsuario, RolActor: body.RolActor,
		AsignadoPor: body.AsignadoPor, Activo: true,
	}
	if err := h.repo.Create(pr); err != nil {
		utils.Fail(c, 400, "Error asignando rol", err.Error())
		return
	}
	utils.Created(c, pr, "Rol asignado")
}

// Revocar rol del proyecto
// @Tags		Roles dinámicos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/roles [delete]
func (h *ProyectoRolHandler) Revoke(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct {
		IDUsuario   uint   `json:"id_usuario" binding:"required"`
		TipoUsuario string `json:"tipo_usuario" binding:"required"`
		RolActor    string `json:"rol_actor" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	if err := h.repo.Delete(uint(id), body.TipoUsuario, body.IDUsuario, body.RolActor); err != nil {
		utils.Fail(c, 400, "Error revocando rol", err.Error())
		return
	}
	utils.Success(c, nil, "Rol revocado")
}

// Roles dinámicos de un usuario
// @Tags		Roles dinámicos
// @Accept		json
// @Produce	json
// @Param		tipo path string true "DOCENTE|ESTUDIANTE|ADMINISTRATIVO"
// @Param		id path int true "ID usuario"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/usuarios/{tipo}/{id}/roles [get]
func (h *ProyectoRolHandler) RolesDeUsuario(c *gin.Context) {
	tipo := c.Param("tipo")
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.repo.FindByUsuario(tipo, uint(id))
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, list, "OK")
}
