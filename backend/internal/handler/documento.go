package handler

import (
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

type DocumentoHandler struct{ repo *repository.DocumentoRepo; db *gorm.DB }
func NewDocumentoHandler(db *gorm.DB) *DocumentoHandler { return &DocumentoHandler{repo: repository.NewDocumentoRepo(db), db: db} }
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
		utils.Fail(c, 400, "id_proyecto e id_tipo_doc requeridos", nil); return
	}
	idProj, _ := strconv.Atoi(idProjStr)
	idTipo, _ := strconv.Atoi(idTipoStr)
	// El usuario SIEMPRE sale del token: nunca se confía en el valor enviado por
	// el cliente (evita suplantar identidad y saltar la validación de membresía).
	idUser := personaIDFromToken(h.db, c)
	idUserStr := strconv.Itoa(idUser)
	// HU: permitir a cualquier estudiante miembro subir (no solo líder) — valida membresía si es estudiante
	if idUserStr != "" {
		var esEstudiante int64
		h.db.Model(&domain.Estudiante{}).Where("id_estudiante = ?", idUser).Count(&esEstudiante)
		if esEstudiante > 0 {
			var esMiembro int64
			h.db.Model(&domain.RSUProyecto{}).Where("id_proyecto = ? AND id_estudiante_lider = ?", idProj, idUser).Count(&esMiembro)
			if esMiembro == 0 {
				h.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO')", idProj, idUser).Count(&esMiembro)
				if esMiembro == 0 {
					utils.Fail(c, 403, "No eres miembro de este proyecto. Solo el equipo (líder o participantes) puede subir documentos.", nil); return
				}
			}
		}
	}
	file, err := c.FormFile("archivo")
	if err != nil { utils.Fail(c, 400, "archivo requerido", err.Error()); return }
	if file.Size > 20<<20 {
		utils.Fail(c, 400, "archivo excede el límite de 20MB", nil); return
	}
	ext := strings.ToLower(file.Filename)
	if !strings.HasSuffix(ext, ".pdf") && !strings.HasSuffix(ext, ".docx") && !strings.HasSuffix(ext, ".xlsx") {
		utils.Fail(c, 400, "extensión no permitida. Solo .pdf, .docx, .xlsx", nil); return
	}
	// Storage intercambiable: local activo, cloud presente pero desactivado.
	st := storage.New()
	saved, err := st.Save(file, "")
	if err != nil {
		// Si el driver cloud no está configurado, error 501 controlado.
		if st.Driver() == "cloud" {
			utils.Fail(c, 501, "Almacenamiento cloud no habilitado en este MVP; sigue activo el local", err.Error()); return
		}
		utils.Fail(c, 500, "No se pudo guardar", err.Error()); return
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
			utils.Fail(c, 409, "documento ya existe para este tipo en el proyecto", nil); return
		}
		utils.Fail(c, 400, "Error registrar documento", err.Error()); return
	}
	utils.Created(c, doc, "Documento subido")
}
// Archivo redirige a la URL pública del documento (archivo servido en /uploads).
// @Tags		Documentos
// @Produce	json
// @Param		id path int true "ID documento"
// @Success	302 {string} string "Redirección al archivo"
// @Failure	404 "Documento no encontrado"
// @Router		/api/v1/documentos/{id}/archivo [get]
func (h *DocumentoHandler) Archivo(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var doc domain.RSUDocumento
	if err := h.db.First(&doc, "id_documento = ?", id).Error; err != nil {
		utils.Fail(c, 404, "Documento no encontrado", nil); return
	}
	if doc.URLArchivo == "" {
		utils.Fail(c, 404, "Documento sin archivo asociado", nil); return
	}
	c.Redirect(302, doc.URLArchivo)
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
	list, err := h.repo.FindByProyecto(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}

