package handler

import (
	"io"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/internal/storage"
	"undc-rsu/backend/pkg/utils"
)

// ── Documento Handler (upload) — HU-033/034: cualquier miembro equipo (líder o no) puede subir docs/entregables ───────────────────────────────

type DocumentoHandler struct {
	repo *repository.DocumentoRepo
	db   *gorm.DB
}

func NewDocumentoHandler(db *gorm.DB) *DocumentoHandler {
	return &DocumentoHandler{repo: repository.NewDocumentoRepo(db), db: db}
}

// Subir documento/entregable (multipart + hash + membresía equipo)
// Evita duplicados por (proyecto, tipo_doc): marca anterior como !vigente y crea versión nueva
// @Tags		Documentos
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/documentos/upload [post]
func (h *DocumentoHandler) Upload(c *gin.Context) {
	idProjStr := c.PostForm("id_proyecto")
	idTipoStr := c.PostForm("id_tipo_doc")
	if idProjStr == "" || idTipoStr == "" {
		utils.Fail(c, 400, "id_proyecto e id_tipo_doc requeridos", nil)
		return
	}
	idProj, _ := strconv.Atoi(idProjStr)
	idTipo, _ := strconv.Atoi(idTipoStr)
	// El usuario SIEMPRE sale del token: nunca se confía en el valor enviado por
	// el cliente (evita suplantar identidad y saltar la validación de membresía).
	idUser := personaIDFromToken(h.db, c)
	// HU: permitir a cualquier estudiante miembro subir (no solo líder) — valida membresía si es estudiante
	// El tipo sale del token (no se adivina por la persona: un docente con
	// id_persona repetido recibía 403 injustificado).
	if esEstudianteToken(h.db, c) {
		var esMiembro int64
		h.db.Model(&domain.RSUProyecto{}).Where("id_proyecto = ? AND id_estudiante_lider = ?", idProj, idUser).Count(&esMiembro)
		if esMiembro == 0 {
			h.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO')", idProj, idUser).Count(&esMiembro)
			if esMiembro == 0 {
				utils.Fail(c, 403, "No eres miembro de este proyecto. Solo el equipo (líder o participantes) puede subir documentos.", nil)
				return
			}
		}
	}
	file, err := c.FormFile("archivo")
	if err != nil {
		utils.Fail(c, 400, "archivo requerido", err.Error())
		return
	}
	// Validación robusta (tamaño, extensión y contenido) + guardado seguro.
	// En B2 queda en proyectos/<id>/documentos/ (carpeta por proyecto).
	saved, err := storage.GuardarSeguro(file, storage.KindMixto, storage.PrefijoProyecto(uint(idProj))+"/documentos")
	if err != nil {
		responderErrorGuardado(c, err)
		return
	}
	filename := saved.Filename
	sz := saved.Size
	// Evitar duplicado: mismo proyecto + mismo tipo_doc → marcar anterior como !vigente y crear versión++
	var prev domain.RSUDocumento
	if err := h.db.Where("id_proyecto = ? AND id_tipo_doc = ? AND vigente = true", idProj, idTipo).First(&prev).Error; err == nil {
		prev.Vigente = false
		h.db.Save(&prev)
	}
	doc := &domain.RSUDocumento{
		IDProyecto: uint(idProj), IDTipoDoc: uint(idTipo),
		NombreArchivo: filename, URLArchivo: saved.URL,
		HashArchivo: &saved.Hash, TamanoBytes: &sz, Version: 1, IDUsuarioSubida: uint(idUser), Vigente: true,
	}
	// Si hubo anterior, version++
	if prev.ID != 0 {
		doc.Version = prev.Version + 1
	}
	if err := h.repo.Create(doc); err != nil {
		low := strings.ToLower(err.Error())
		if strings.Contains(low, "duplicate") || strings.Contains(low, "unique") {
			utils.Fail(c, 409, "documento ya existe para este tipo en el proyecto", nil)
			return
		}
		utils.Fail(c, 400, "Error registrar documento", err.Error())
		return
	}
	utils.Created(c, doc, "Documento subido")
}

// Archivo entrega el archivo del documento. En local redirige a /uploads; con
// el driver B2 (bucket privado) transmite el stream desde el bucket.
// @Tags		Documentos
// @Produce		octet-stream
// @Param		id path int true "ID documento"
// @Success	302 {string} string "Redirección al archivo (local)"
// @Success	200 {file} file "Archivo (B2)"
// @Failure	404 "Documento no encontrado"
// @Router		/api/v1/documentos/{id}/archivo [get]
func (h *DocumentoHandler) Archivo(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var doc domain.RSUDocumento
	if err := h.db.First(&doc, "id_documento = ?", id).Error; err != nil {
		utils.Fail(c, 404, "Documento no encontrado", nil)
		return
	}
	// OWASP A01: solo equipo/asesor/gestión descargan documentos del proyecto.
	if !puedeVerProyecto(h.db, c, doc.IDProyecto) {
		utils.Fail(c, 403, "no tienes acceso a este documento", nil)
		return
	}
	if doc.URLArchivo == "" {
		utils.Fail(c, 404, "Documento sin archivo asociado", nil)
		return
	}
	// Local (o respaldo local guardado por fallback): redirige al estático.
	if !storage.EsCloud() || storage.ExisteLocal(doc.URLArchivo) {
		c.Redirect(302, doc.URLArchivo)
		return
	}
	body, ct, err := storage.AbrirArchivo(doc.URLArchivo)
	if err != nil {
		utils.Fail(c, 404, "Archivo no encontrado en el bucket", err.Error())
		return
	}
	defer body.Close()
	c.Header("Content-Type", ct)
	c.Header("Content-Disposition", "attachment; filename=\""+doc.NombreArchivo+"\"")
	c.Header("Cache-Control", "private, max-age=300")
	_, _ = io.Copy(c.Writer, body)
}

// Documentos del proyecto
// @Tags		Documentos
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/documentos [get]
func (h *DocumentoHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	// OWASP A01: solo miembros del equipo, asesor o gestión ven los documentos.
	if !puedeVerProyecto(h.db, c, uint(id)) {
		utils.Fail(c, 403, "no tienes acceso a los documentos de este proyecto", nil)
		return
	}
	list, err := h.repo.FindByProyecto(uint(id))
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, list, "OK")
}
