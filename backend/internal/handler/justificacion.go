package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/internal/storage"
	"undc-rsu/backend/pkg/utils"
)

// ── HU-014 / R11: justificación de faltas (máx 2 por estudiante) ──

type JustificacionHandler struct {
	db   *gorm.DB
	repo *repository.JustificacionRepo
}

func NewJustificacionHandler(db *gorm.DB) *JustificacionHandler {
	return &JustificacionHandler{db: db, repo: repository.NewJustificacionRepo(db)}
}

type justificacionReq struct {
	IDActividad   uint   `form:"id_actividad"`
	IDEstudiante  uint   `form:"id_estudiante"`
	FechaAusencia string `form:"fecha_ausencia" binding:"required"`
	HoraInicio    string `form:"hora_inicio"`
	HoraFin       string `form:"hora_fin"`
	Motivo        string `form:"motivo" binding:"required"`
}

// Create recibe multipart (evidencia PDF) y persiste la justificación.
// Regla R11: como máximo 2 justificaciones activas (PENDIENTE/REVISADO).
func (h *JustificacionHandler) Create(c *gin.Context) {
	var req justificacionReq
	if err := c.ShouldBind(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "fecha_ausencia y motivo son obligatorios", err.Error())
		return
	}
	idAct, _ := strconv.Atoi(c.PostForm("id_actividad"))
	idEst := personaIDFromToken(h.db, c)
	if idAct == 0 || idEst == 0 {
		utils.Fail(c, http.StatusBadRequest, "id_actividad y estudiante autenticado son requeridos", nil)
		return
	}
	fecha, err := time.Parse("2006-01-02", req.FechaAusencia)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "fecha_ausencia inválida (usa YYYY-MM-DD)", err.Error())
		return
	}
	// R11: máximo 2 justificaciones por estudiante (solo las que ocupan cupo).
	activas, err := h.repo.CountActivas(uint(idEst))
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "No se pudo validar el límite de justificaciones", err.Error())
		return
	}
	if activas >= 2 {
		utils.Fail(c, http.StatusConflict, "Alcanzaste el máximo de 2 justificaciones de faltas", nil)
		return
	}
	// La evidencia PDF se guarda como documento del proyecto de la actividad,
	// así hereda el id_proyecto correcto (FK obligatoria en RSU_Documento).
	var idDoc *uint
	if file, err := c.FormFile("archivo"); err == nil {
		if file.Size > 32<<20 {
			utils.Fail(c, http.StatusBadRequest, "la evidencia excede 32MB", nil)
			return
		}
		var act domain.RSUActividadCampo
		if err := h.db.First(&act, "id_actividad = ?", idAct).Error; err != nil {
			utils.Fail(c, http.StatusBadRequest, "la actividad indicada no existe", err.Error())
			return
		}
		// Evidencia de la falta: proyectos/<id>/evidencias/.
		saved, err := storage.New().Save(file, storage.PrefijoProyecto(act.IDProyecto)+"/evidencias")
		if err != nil {
			utils.Fail(c, http.StatusInternalServerError, "No se pudo guardar la evidencia", err.Error())
			return
		}
		sz := saved.Size
		doc := &domain.RSUDocumento{
			IDProyecto: act.IDProyecto, IDTipoDoc: 5, TamanoBytes: &sz,
			IDUsuarioSubida: uint(idEst), NombreArchivo: saved.Filename,
			URLArchivo: saved.URL, HashArchivo: &saved.Hash,
			Version: 1, Vigente: true,
		}
		if err := h.db.Create(doc).Error; err != nil {
			utils.Fail(c, http.StatusInternalServerError, "No se pudo registrar el documento de evidencia", err.Error())
			return
		}
		idDoc = &doc.ID
	}
	j := &domain.RSUJustificacionFalta{
		IDActividad: uint(idAct), IDEstudiante: uint(idEst),
		FechaAusencia: fecha, Motivo: req.Motivo,
		IDDocumentoEvidencia: idDoc,
	}
	if req.HoraInicio != "" {
		h := req.HoraInicio
		j.HoraInicioActividad = &h
	}
	if req.HoraFin != "" {
		h := req.HoraFin
		j.HoraFinActividad = &h
	}
	if err := h.repo.Create(j); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "No se pudo registrar la justificación", err.Error())
		return
	}
	utils.Created(c, j, "Justificación registrada · PENDIENTE")
}

// ByEstudiante lista las justificaciones del estudiante autenticado.
func (h *JustificacionHandler) ByEstudiante(c *gin.Context) {
	idEst := personaIDFromToken(h.db, c)
	list, err := h.repo.ByEstudiante(uint(idEst))
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Error al listar justificaciones", err.Error())
		return
	}
	utils.Success(c, list, "OK")
}

// UpdateEstado permite al verificador revisar/aprobar/rechazar/observar.
func (h *JustificacionHandler) UpdateEstado(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct {
		Estado        string  `json:"estado"`
		Observaciones *string `json:"observaciones"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Estado == "" {
		utils.Fail(c, http.StatusBadRequest, "estado requerido", err.Error())
		return
	}
	estado := normEstadoJust(body.Estado)
	if estado == "" {
		utils.Fail(c, http.StatusBadRequest, "estado inválido (PENDIENTE, REVISADO, APROBADO, RECHAZADO, OBSERVADO)", nil)
		return
	}
	if estado == "OBSERVADO" || estado == "RECHAZADO" {
		if body.Observaciones == nil || len(*body.Observaciones) == 0 {
			utils.Fail(c, http.StatusBadRequest, "observar o rechazar requiere motivo (R26)", nil)
			return
		}
	}
	idVerif := personaIDFromToken(h.db, c)
	if err := h.repo.UpdateEstado(uint(id), estado, uintPtr(idVerif), body.Observaciones); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "No se pudo actualizar la justificación", err.Error())
		return
	}
	utils.Success(c, nil, "Justificación actualizada")
}

func normEstadoJust(s string) string {
	switch s {
	case "PENDIENTE", "REVISADO", "APROBADO", "RECHAZADO", "OBSERVADO":
		return s
	}
	return ""
}

func intPtr(n int) *int { return &n }
