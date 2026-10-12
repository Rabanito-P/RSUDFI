package handler

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/service"
	"undc-rsu/backend/pkg/utils"
)

// ── Proyecto Handler ─────────────────────────────────────────

type ProyectoHandler struct{ svc *service.ProyectoService }
func NewProyectoHandler(db *gorm.DB) *ProyectoHandler { return &ProyectoHandler{svc: service.NewProyectoService(db)} }
// Crear proyecto RSU en BORRADOR (valida ciclo mínimo)
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos [post]
func (h *ProyectoHandler) Create(c *gin.Context) {
	var req dto.CreateProyectoReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	p, err := h.svc.Create(req)
	if err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Created(c, p, "Proyecto creado en estado BORRADOR")
}
// Listar proyectos (search, estado, escuela, paginado)
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos [get]
func (h *ProyectoHandler) List(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	// docente: solo sus proyectos asesorados si pasa id_docente
	if v := c.Query("id_docente"); v != "" {
		idDoc, _ := strconv.Atoi(v)
		items, total, err := h.svc.ListByDocente(page, limit, uint(idDoc), c.Query("search"))
		if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
		utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
		return
	}
	// HU-045: estudiante ve solo sus proyectos (líder o equipo) si pasa id_estudiante o ?scope=mios
	if scope := c.Query("scope"); scope == "mios" {
		if v := c.Query("id_estudiante"); v != "" {
			idEst, _ := strconv.Atoi(v)
			items, total, err := h.svc.ListByEstudiante(page, limit, uint(idEst), c.Query("search"))
			if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
			utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
			return
		}
	}
	var estado, escuela *uint
	if v := c.Query("estado"); v != "" { n, _ := strconv.Atoi(v); u := uint(n); estado = &u }
	if v := c.Query("escuela"); v != "" { n, _ := strconv.Atoi(v); u := uint(n); escuela = &u }
	// HU-063: ?modalidad=PEP_FINANCIADO,PEP_AUTOFINANCIADO (coma-separado).
	var modalidades []string
	if v := c.Query("modalidad"); v != "" {
		for _, m := range strings.Split(v, ",") {
			if m = strings.ToUpper(strings.TrimSpace(m)); m != "" {
				modalidades = append(modalidades, m)
			}
		}
	}
	// soporte ?id_estudiante sin scope para filtro miembro (todos los estudiantes ven su proyecto sea o no líder)
	if v := c.Query("id_estudiante"); v != "" && estado == nil && escuela == nil && c.Query("search") == "" {
		// si solo piden por estudiante, usa join miembro
		idEst, _ := strconv.Atoi(v)
		items, total, err := h.svc.ListByEstudiante(page, limit, uint(idEst), c.Query("search"))
		if err == nil && total > 0 {
			utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
			return
		}
	}
	items, total, err := h.svc.List(page, limit, estado, escuela, c.Query("search"), modalidades)
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}
// Proyectos asesorados por el docente
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID docente"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/docentes/{id}/proyectos [get]
func (h *ProyectoHandler) ListByDocente(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	page, limit, _ := utils.GetPagination(c)
	items, total, err := h.svc.ListByDocente(page, limit, uint(id), c.Query("search"))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}
// Proyectos del estudiante (líder o miembro ACTIVO/INSCRITO)
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID estudiante"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/estudiantes/{id}/proyectos [get]
func (h *ProyectoHandler) ListByEstudiante(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	page, limit, _ := utils.GetPagination(c)
	items, total, err := h.svc.ListByEstudiante(page, limit, uint(id), c.Query("search"))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}
// Verificar si el estudiante es miembro del equipo
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Param		estudianteId path int true "ID estudiante"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/es-miembro/{estudianteId} [get]
func (h *ProyectoHandler) CheckMembresia(c *gin.Context) {
	idProj, _ := strconv.Atoi(c.Param("id"))
	idEst, _ := strconv.Atoi(c.Param("estudianteId"))
	member := h.svc.IsMiembro(uint(idProj), uint(idEst))
	utils.Success(c, gin.H{"es_miembro": member, "id_proyecto": idProj, "id_estudiante": idEst}, "OK")
}
// Obtener proyecto por id
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id} [get]
func (h *ProyectoHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	p, err := h.svc.Get(uint(id))
	if err != nil { utils.Fail(c, 404, "Proyecto no encontrado", nil); return }
	utils.Success(c, p, "OK")
}
// Actualizar proyecto
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id} [put]
func (h *ProyectoHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req dto.UpdateProyectoReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	p, err := h.svc.Update(uint(id), req)
	if err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Success(c, p, "Proyecto actualizado")
}
// Avanzar transición BPMN (valida RSU_Transicion_Estado por rol actor)
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/transicion [post]
func (h *ProyectoHandler) Transicion(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req dto.TransicionReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	if err := h.svc.Transicion(uint(id), req); err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Success(c, nil, "Transición registrada")
}
// Trazabilidad del flujo de aprobación del proyecto
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/historial [get]
func (h *ProyectoHandler) Historial(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.svc.Historial(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}
// Resumen de proyectos (vista SUNEDU vw_rsu_proyectos_resumen)
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/resumen [get]
func (h *ProyectoHandler) ResumenVw(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	items, total, err := h.svc.ResumenVw(page, limit)
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}

