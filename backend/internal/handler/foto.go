package handler

import (
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/storage"
	"undc-rsu/backend/pkg/utils"
)

type FotoHandler struct {
	db *gorm.DB
}

func NewFotoHandler(db *gorm.DB) *FotoHandler { return &FotoHandler{db: db} }

func (h *FotoHandler) Upload(c *gin.Context) {
	idActStr := c.PostForm("id_actividad")
	if idActStr == "" {
		utils.Fail(c, 400, "id_actividad requerido", nil)
		return
	}
	idAct, _ := strconv.Atoi(idActStr)
	var act domain.RSUActividadCampo
	if err := h.db.First(&act, "id_actividad = ?", idAct).Error; err != nil {
		utils.Fail(c, 404, "Actividad no encontrada", nil)
		return
	}
	file, err := c.FormFile("archivo")
	if err != nil {
		utils.Fail(c, 400, "archivo requerido", err.Error())
		return
	}
	// R12: máximo 5 fotos por actividad (una por etapa del cronograma).
	var nFotos int64
	h.db.Model(&domain.RSUActividadFoto{}).Where("id_actividad = ?", idAct).Count(&nFotos)
	if nFotos >= 5 {
		utils.Fail(c, 409, "la actividad ya tiene 5 fotos (máximo por actividad, R12)", nil)
		return
	}
	// Validación robusta: 5MB (R13), jpg/jpeg/png con contenido verificado.
	saved, err := storage.GuardarSeguro(file, storage.KindImagen, "evidencias")
	if err != nil {
		if _, ok := err.(*storage.ErrorValidacion); ok {
			utils.Fail(c, 400, err.Error(), nil)
			return
		}
		if storage.New().Driver() == "cloud" {
			utils.Fail(c, 501, "Almacenamiento cloud no habilitado", err.Error())
			return
		}
		utils.Fail(c, 500, "No se pudo guardar", err.Error())
		return
	}
	desc := c.PostForm("descripcion")

	// Etapa de la captura (INICIO / SEGUIMIENTO_n / FIN) y minutos desde que
	// empezó la actividad: el cronómetro del frontend manda estos valores.
	var etapa *string
	if e := strings.TrimSpace(c.PostForm("etapa")); e != "" {
		etapa = &e
	}
	minutos := 0
	if m, err := strconv.Atoi(c.PostForm("minutos_transcurridos")); err == nil && m >= 0 {
		minutos = m
	}

	foto := &domain.RSUActividadFoto{
		IDActividad:          uint(idAct),
		URLFoto:              saved.URL,
		Descripcion:          &desc,
		FechaSubida:          time.Now(),
		Etapa:                etapa,
		MinutosTranscurridos: minutos,
	}
	if err := h.db.Create(foto).Error; err != nil {
		utils.Fail(c, 500, "Error registrar foto", err.Error())
		return
	}
	utils.Created(c, foto, "Evidencia subida")
}

// DelDia lista las actividades programadas para una fecha concreta.
// Es lo que ve el equipo en "Registro de Evidencias" al entrar: las que toca
// capturar hoy, ya con nombre, horario y duración leídos del Excel.
// @Tags		Actividades
// @Produce	json
// @Param		id_proyecto query int true "ID del proyecto"
// @Param		fecha query string false "Fecha YYYY-MM-DD (por defecto hoy)"
// @Success	200 {object} map[string]any "OK"
// @Router		/api/v1/actividades/del-dia [get]
func (h *FotoHandler) DelDia(c *gin.Context) {
	idProj, _ := strconv.Atoi(c.Query("id_proyecto"))
	if idProj == 0 {
		utils.Fail(c, 400, "id_proyecto requerido", nil)
		return
	}
	fecha := c.Query("fecha")
	if fecha == "" {
		fecha = time.Now().Format("2006-01-02")

	}
	var acts []domain.RSUActividadCampo
	// Compara solo la parte de la fecha, así la hora guardada no interfiere.
	q := h.db.Where("id_proyecto = ? AND fecha_programada::date = ?", idProj, fecha).
		Order("fecha_programada ASC, id_actividad ASC")
	if err := q.Find(&acts).Error; err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	// Cuántas fotos lleva cada una (para saber si ya se capturó).
	out := make([]gin.H, 0, len(acts))
	for _, a := range acts {
		var n int64
		h.db.Model(&domain.RSUActividadFoto{}).Where("id_actividad = ?", a.ID).Count(&n)
		var etapas []string
		h.db.Model(&domain.RSUActividadFoto{}).
			Where("id_actividad = ? AND etapa IS NOT NULL", a.ID).
			Distinct().Pluck("etapa", &etapas)
		out = append(out, gin.H{
			"id_actividad":       a.ID,
			"nombre":             a.Nombre,
			"descripcion":        a.Descripcion,
			"fecha_programada":   a.FechaProgramada,
			"hora_inicio":        a.HoraInicio,
			"hora_fin":           a.HoraFin,
			"minutos":            a.Minutos,
			"estado":             a.Estado,
			"total_fotos":        n,
			"etapas_capturadas":  etapas,
		})
	}
	utils.Success(c, out, "OK")
}

func (h *FotoHandler) ByActividad(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var fotos []domain.RSUActividadFoto
	if err := h.db.Where("id_actividad = ?", id).Order("fecha_subida ASC").Find(&fotos).Error; err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, fotos, "OK")
}
