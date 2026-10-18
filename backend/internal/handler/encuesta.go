package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/service"
	"undc-rsu/backend/pkg/utils"
)

// ── Encuesta Handler ─────────────────────────────────────────

type EncuestaHandler struct {
	svc *service.EncuestaService
	db  *gorm.DB
}

func NewEncuestaHandler(db *gorm.DB) *EncuestaHandler {
	return &EncuestaHandler{svc: service.NewEncuestaService(db), db: db}
}

// Aplicar encuesta Likert 1-5 a beneficiario (promedio + deduplicación)
// @Tags		Encuestas
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/encuestas/beneficiario [post]
func (h *EncuestaHandler) Create(c *gin.Context) {
	var req dto.CreateEncuestaBenefReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	enc, err := h.svc.CrearEncuestaBeneficiario(req)
	if err != nil {
		utils.Fail(c, 400, err.Error(), nil)
		return
	}
	utils.Created(c, enc, "Encuesta registrada")
}

// Encuestas aplicadas en el proyecto
// @Tags		Encuestas
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/encuestas [get]
func (h *EncuestaHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.svc.ListByProyecto(uint(id))
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, list, "OK")
}

// ── HU-023: encuesta de satisfacción del docente asesor ──
// La responde el estudiante del equipo sobre el asesor de SU proyecto.
// Guarda RSU_Encuesta_Satisfaccion (antes solo se creaba un indicador).
// @Tags		Encuestas
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	201 {object} map[string]any "Creado"
// @Failure	400 {object} map[string]any "Error de validación"
// @Router		/api/v1/encuestas/docente [post]
func (h *EncuestaHandler) CrearDocente(c *gin.Context) {
	var req dto.CrearEncuestaDocenteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	idEst := uint(personaIDFromToken(h.db, c))
	if idEst == 0 {
		utils.Fail(c, 401, "sesión no identificada", nil)
		return
	}
	var proj domain.RSUProyecto
	if err := h.db.First(&proj, "id_proyecto = ?", req.IDProyecto).Error; err != nil {
		utils.Fail(c, 404, "proyecto no encontrado", nil)
		return
	}
	if proj.IDDocenteAsesor == nil {
		utils.Fail(c, 400, "el proyecto no tiene docente asesor asignado", nil)
		return
	}
	// Solo evalúa un miembro del equipo (líder o participante activo).
	var esMiembro int64
	h.db.Model(&domain.RSUProyecto{}).Where("id_proyecto = ? AND id_estudiante_lider = ?", req.IDProyecto, idEst).Count(&esMiembro)
	if esMiembro == 0 {
		h.db.Model(&domain.RSUParticipanteEstudiante{}).
			Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO')", req.IDProyecto, idEst).
			Count(&esMiembro)
	}
	if esMiembro == 0 {
		utils.Fail(c, 403, "solo un miembro del equipo evalúa al asesor de este proyecto", nil)
		return
	}
	repo := domain.NewEncuestaSatisfaccionRepo(h.db)
	if existe, _ := repo.Existe(req.IDProyecto, idEst); existe {
		utils.Fail(c, 409, "ya registraste tu encuesta de este proyecto", nil)
		return
	}
	enc := &domain.RSUEncuestaSatisfaccion{
		IDProyecto: req.IDProyecto, IDDocenteAsesor: *proj.IDDocenteAsesor,
		IDEstudiante: idEst, Estado: "REGISTRADO",
		PromedioGeneral: req.Promedio, Comentario: req.Comentario,
	}
	if err := repo.Create(enc); err != nil {
		utils.Fail(c, 500, "No se pudo registrar la encuesta", err.Error())
		return
	}
	utils.Created(c, enc, "Encuesta registrada")
}
