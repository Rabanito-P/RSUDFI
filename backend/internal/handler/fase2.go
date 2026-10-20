package handler

import (
	"io"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/service"
	"undc-rsu/backend/internal/storage"
	"undc-rsu/backend/pkg/utils"
)

// ─────────────────────────────────────────────────────────────────
// HU-F2-01 · HU-F2-02 · HU-F2-04 · HU-F2-05 · HU-F2-06
// Endpoints de la Fase 2 (Aprobación): Oficio de Elevación, activación del
// proyecto (opción C), aviso de duplicidad, filtro presupuestal y evaluación del
// vencimiento por cálculo perezoso.
// ─────────────────────────────────────────────────────────────────

type fase2Handler struct {
	db  *gorm.DB
	svc *service.ProyectoService
}

// RegisterFase2 registra los endpoints de la Fase 2 (Aprobación) sobre el
// grupo de rutas ya autenticado.
func RegisterFase2(api *gin.RouterGroup, db *gorm.DB, svc *service.ProyectoService) {
	h := &fase2Handler{db: db, svc: svc}

	// HU-F2-04: el Decano genera y exporta el Oficio de Elevación (PDF).
	api.POST("/proyectos/:id/oficio-elevacion", h.GenerarOficio)
	api.GET("/proyectos/:id/oficio-elevacion/descargar", h.DescargarOficio)
	// HU-F2-06: la Facultad registra el documento de la DRSU y activa.
	api.POST("/proyectos/:id/activar", h.ActivarProyecto)
	// HU-F2-01: aviso de duplicidad antes de aprobar.
	api.GET("/proyectos/:id/duplicidad", h.Duplicidad)
	// HU-F2-05: filtro presupuestal del PEP.
	api.GET("/proyectos/:id/presupuesto-disponible", h.PresupuestoDisponible)
	// HU-F2-02: evaluación explícita del vencimiento (el normal es perezoso).
	api.POST("/proyectos/:id/evaluar-vencimiento", h.EvaluarVencimiento)
}

// GenerarOficio — HU-F2-04 / HU-F2-03 ("Aprobar y Elevar").
// @Tags		Proyectos
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "Oficio generado y registrado"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	403 {object} map[string]any "Sin permisos"
// @Router		/api/v1/proyectos/{id}/oficio-elevacion [post]
func (h *fase2Handler) GenerarOficio(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	// Solo el Decano eleva (E1, opción C).
	if c.GetString("rol_actor") != "DECANO" && c.GetString("rol_actor") != "ADMIN" {
		utils.Fail(c, 403, "solo el Decano puede generar el Oficio de Elevación", nil)
		return
	}

	proj, err := h.svc.Get(uint(id))
	if err != nil {
		utils.Fail(c, 404, "Proyecto no encontrado", err.Error())
		return
	}

	doc, _, err := h.svc.GenerarOficioElevacion(proj, uint(tokenUserID(c)))
	if err != nil {
		utils.Fail(c, 400, err.Error(), nil)
		return
	}
	utils.Success(c, gin.H{
		"documento":    doc,
		"descarga_url": "/api/v1/proyectos/" + c.Param("id") + "/oficio-elevacion/descargar",
	}, "Oficio de Elevación generado; imprímelo para firma y sello del Decano")
}

// DescargarOficio transmite el último Oficio de Elevación registrado.
// @Tags		Proyectos
// @Produce		application/pdf
// @Param		id path int true "ID proyecto"
// @Success	200 {file} file "PDF del oficio"
// @Failure	404 {object} map[string]any "Oficio no encontrado"
// @Router		/api/v1/proyectos/{id}/oficio-elevacion/descargar [get]
func (h *fase2Handler) DescargarOficio(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	var doc domain.RSUDocumento
	if err := h.db.Where("id_proyecto = ? AND nombre_archivo LIKE '%oficio-elevacion%' AND vigente = true", id).
		Order("fecha_subida DESC").First(&doc).Error; err != nil {
		utils.Fail(c, 404, "El proyecto no tiene un Oficio de Elevación generado", nil)
		return
	}
	if !puedeVerProyecto(h.db, c, doc.IDProyecto) {
		utils.Fail(c, 403, "no tienes acceso a este documento", nil)
		return
	}
	if doc.URLArchivo == "" {
		utils.Fail(c, 404, "Documento sin archivo asociado", nil)
		return
	}
	body, ct, err := storage.AbrirArchivo(doc.URLArchivo)
	if err != nil {
		utils.Fail(c, 404, "Archivo no encontrado", err.Error())
		return
	}
	defer body.Close()
	c.Header("Content-Type", ct)
	c.Header("Content-Disposition", "attachment; filename=\""+doc.NombreArchivo+"\"")
	c.Header("Cache-Control", "private, max-age=300")
	_, _ = io.Copy(c.Writer, body)
}

// ActivarProyecto — HU-F2-06 (opción C).
// @Tags		Proyectos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Param		body body map[string]any true "ID del documento recibido de la DRSU"
// @Success	200 {object} map[string]any "Proyecto activado"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	403 {object} map[string]any "Sin permisos"
// @Router		/api/v1/proyectos/{id}/activar [post]
func (h *fase2Handler) ActivarProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	rol := c.GetString("rol_actor")
	if rol != "DIR_RS_FACULTAD" && rol != "ADMIN" {
		utils.Fail(c, 403, "solo el Responsable de RS de Facultad activa el proyecto (opción C)", nil)
		return
	}

	var body struct {
		IDDocumentoSustento *uint `json:"id_documento_sustento"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.IDDocumentoSustento == nil {
		utils.ValidationFail(c, "indica el id_documento_sustento con el PDF firmado recibido de la DRSU")
		return
	}
	if err := h.svc.ActivarProyecto(uint(id), *body.IDDocumentoSustento, uint(tokenUserID(c))); err != nil {
		utils.Fail(c, 400, err.Error(), nil)
		return
	}
	utils.Success(c, nil, "Proyecto activado: quedó en ejecución y se notificó al líder y al asesor")
}

// Duplicidad — HU-F2-01 CA-1.2.
// @Tags		Proyectos
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "Proyectos similares"
// @Router		/api/v1/proyectos/{id}/duplicidad [get]
func (h *fase2Handler) Duplicidad(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	proj, err := h.svc.Get(uint(id))
	if err != nil {
		utils.Fail(c, 404, "Proyecto no encontrado", err.Error())
		return
	}
	parecidos, err := h.svc.Duplicidad(proj)
	if err != nil {
		utils.Fail(c, 500, "Error al evaluar duplicidad", err.Error())
		return
	}
	utils.Success(c, gin.H{
		"duplicidad_detectada": len(parecidos) > 0,
		"proyectos_parecidos":  parecidos,
	}, "Evaluación de duplicidad por lugar de intervención y población beneficiaria")
}

// PresupuestoDisponible — HU-F2-05.
// @Tags		Proyectos
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "Disponibilidad del fondo RSU"
// @Router		/api/v1/proyectos/{id}/presupuesto-disponible [get]
func (h *fase2Handler) PresupuestoDisponible(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	proj, err := h.svc.Get(uint(id))
	if err != nil {
		utils.Fail(c, 404, "Proyecto no encontrado", err.Error())
		return
	}
	disponible, solicitado, excede, err := h.svc.DisponibilidadPresupuesto(proj)
	if err != nil {
		utils.Fail(c, 500, "Error al calcular el presupuesto", err.Error())
		return
	}
	utils.Success(c, gin.H{
		"modalidad":    proj.Modalidad,
		"aplica_fondo": proj.Modalidad == "PEP_FINANCIADO",
		"disponible":   disponible,
		"solicitado":   solicitado,
		"excede_fondo": excede,
		"rebote_dias":  leerPlazoPresupuesto(h.db),
	}, "Disponibilidad del fondo RSU del 2% (Ley 30220 Art. 125)")
}

// EvaluarVencimiento — HU-F2-02. El vencimiento se evalúa solo al leer o
// listar; este endpoint lo dispara de forma explícita, útil para pruebas y para
// que la bandeja fuerce la revisión.
// @Tags		Proyectos
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "Resultado de la evaluación"
// @Router		/api/v1/proyectos/{id}/evaluar-vencimiento [post]
func (h *fase2Handler) EvaluarVencimiento(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	proj, err := h.svc.Get(uint(id))
	if err != nil {
		utils.Fail(c, 404, "Proyecto no encontrado", err.Error())
		return
	}
	archivado, err := h.svc.VencerSiCorresponde(proj)
	if err != nil {
		utils.Fail(c, 500, "Error al evaluar el vencimiento", err.Error())
		return
	}
	utils.Success(c, gin.H{
		"archivado":     archivado,
		"fecha_limite":  proj.FechaLimiteSubsanacion,
		"estado_actual": proj.EstadoActual,
	}, "Vencimiento evaluado")
}

func leerPlazoPresupuesto(db *gorm.DB) int {
	return service.LeerPlazoPresupuesto(db)
}
