package handler

import (
	"encoding/json"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/storage"
	"undc-rsu/backend/pkg/utils"
)

// ── HU-013: asistencia real de beneficiarios por actividad ─────
//
// Hasta hoy el modal solo leía la lista de beneficiarios y remitía la ficha
// firmada al modal de fotos: nada escribía RSU_Asistencia_Beneficiario. Este
// handler marca a los asistentes (checkbox del front), valida que estén
// vinculados ACTIVOS al proyecto, permite la firma escaneada y evita duplicar
// pares (id_actividad, id_beneficiario). La Ficha de Asistencia PDF oficial
// sigue subiéndose por POST /documentos/upload.

type AsistenciaHandler struct{ db *gorm.DB }

func NewAsistenciaHandler(db *gorm.DB) *AsistenciaHandler { return &AsistenciaHandler{db} }

// registrar minor acceptance: la justificación por día y beneficiario.
// @Tags		Ejecución
// @Accept		multipart/form-data
// @Produce	json
// @Param		id path int true "ID de la actividad de campo"
// @Param		beneficiarios formData string true "IDs repetidos de beneficiarios asistentes"
// @Param		firma formData file false "Firma escaneada JPG/PNG (≤2MB)"
// @Success	200 {object} map[string]any "Resumen: registradas/duplicadas"
// @Failure	400 {object} map[string]any "Sin beneficiarios o no vinculados"
// @Failure	403 {object} map[string]any "No es miembro activo"
// @Router		/api/v1/actividades/{id}/asistencia [post]
func (h *AsistenciaHandler) Create(c *gin.Context) {
	idAct, _ := strconv.Atoi(c.Param("id"))
	if idAct == 0 {
		utils.Fail(c, 400, "id de actividad inválido", nil)
		return
	}
	var act domain.RSUActividadCampo
	if err := h.db.First(&act, "id_actividad = ?", idAct).Error; err != nil {
		utils.Fail(c, 404, "Actividad no encontrada", nil)
		return
	}
	// R33/R46: la asistencia la registra el equipo (miembros activos, docente
	// asesor o gestión) — misma caja de autorización que actividades y fotos.
	if !puedeEditarEvidencias(h.db, c, act.IDProyecto) {
		utils.Fail(c, 403, "solo el equipo activo, el docente asesor o la dirección RSU registran asistencia", nil)
		return
	}

	// Soporta el campo repetido `beneficiarios` (checkbox del front) y un
	// array JSON en `beneficiarios_json` (por si el cliente prefiere un solo form).
	ids := listIDs(c.PostFormArray("beneficiarios"))
	if s := strings.TrimSpace(c.PostForm("beneficiarios_json")); s != "" {
		var extra []uint
		if err := json.Unmarshal([]byte(s), &extra); err == nil {
			ids = append(ids, extra...)
		}
	}
	if len(ids) == 0 {
		utils.Fail(c, 400, "marca al menos un beneficiario asistente", nil)
		return
	}

	// Firma escaneada opcional: mismas reglas de evidencia (JPG/PNG ≤2MB).
	var firmaURL *string
	if file, err := c.FormFile("firma"); err == nil {
		saved, err := storage.GuardarSeguro(file, storage.KindImagen, storage.PrefijoProyecto(act.IDProyecto)+"/evidencias")
		if err != nil {
			responderErrorGuardado(c, err)
			return
		}
		firmaURL = &saved.URL
	}

	// Solo beneficiarios vinculados activos al proyecto del que es una actividad.
	var vinculados []uint
	h.db.Model(&domain.RSUProyectoBeneficiario{}).Select("id_beneficiario").
		Where("id_proyecto = ? AND activo = true AND id_beneficiario IN ?", act.IDProyecto, ids).
		Pluck("id_beneficiario", &vinculados)
	if len(vinculados) == 0 {
		utils.Fail(c, 400, "ninguno de los beneficiarios marcados está vinculado activamente al proyecto", nil)
		return
	}

	// Dedup (id_actividad, id_beneficiario): los ya marcados se omiten y así
	// la operación es idempotente al reintentar.
	var ya []uint
	h.db.Model(&domain.RSUAsistenciaBeneficiario{}).Select("id_beneficiario").
		Where("id_actividad = ? AND id_beneficiario IN ?", uint(idAct), vinculados).
		Pluck("id_beneficiario", &ya)
	yaSet := map[uint]bool{}
	for _, y := range ya {
		yaSet[y] = true
	}
	creadas := 0
	for _, idBen := range vinculados {
		if yaSet[idBen] {
			continue
		}
		row := &domain.RSUAsistenciaBeneficiario{
			IDActividad:    uint(idAct),
			IDBeneficiario: idBen,
			FirmaURL:       firmaURL,
		}
		if err := h.db.Create(row).Error; err != nil {
			utils.Fail(c, 500, "No se pudo registrar la asistencia", err.Error())
			return
		}
		creadas++
	}

	utils.Created(c, gin.H{
		"id_actividad":          uint(idAct),
		"registradas":           creadas,
		"omitidas_duplicadas":   len(vinculados) - creadas,
		"sin_vinculacion":       len(ids) - len(vinculados),
		"firma_url":             firmaURL,
	}, "Asistencia registrada en RSU_Asistencia_Beneficiario")
}

// PorActividad lista los asistentes de la actividad con su beneficiario.
// @Tags		Ejecución
// @Produce	json
// @Param		id path int true "ID de la actividad de campo"
// @Success	200 {object} []domain.RSUAsistenciaBeneficiario
// @Router		/api/v1/actividades/{id}/asistencia [get]
func (h *AsistenciaHandler) ByActividad(c *gin.Context) {
	idAct, _ := strconv.Atoi(c.Param("id"))
	if idAct == 0 {
		utils.Fail(c, 400, "id de actividad inválido", nil)
		return
	}
	var rows []domain.RSUAsistenciaBeneficiario
	if err := h.db.Preload("Beneficiario").Where("id_actividad = ?", uint(idAct)).
		Order("id_asistencia ASC").Find(&rows).Error; err != nil {
		utils.Fail(c, 500, "Error listando asistencia", err.Error())
		return
	}
	utils.Success(c, rows, "OK")
}

// listIDs convierte los valores repetidos del formulario en ids numéricos
// (descarta vacíos, texto y 0).
func listIDs(raw []string) []uint {
	ids := make([]uint, 0, len(raw))
	for _, s := range raw {
		if n, err := strconv.Atoi(strings.TrimSpace(s)); err == nil && n > 0 {
			ids = append(ids, uint(n))
		}
	}
	return ids
}
