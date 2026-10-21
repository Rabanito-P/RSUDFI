package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/internal/storage"
	"undc-rsu/backend/pkg/utils"
)

// ── HU-015: modificación de informe inicial ──

type ModificacionHandler struct {
	db   *gorm.DB
	repo *repository.ModificacionRepo
}

func NewModificacionHandler(db *gorm.DB) *ModificacionHandler {
	return &ModificacionHandler{db: db, repo: repository.NewModificacionRepo(db)}
}

type modificacionReq struct {
	IDProyecto uint   `form:"id_proyecto" binding:"required"`
	Motivo     string `form:"motivo" binding:"required"`
}

// Create registra la solicitud de modificación con su PDF sustento (multipart).
func (h *ModificacionHandler) Create(c *gin.Context) {
	var req modificacionReq
	if err := c.ShouldBind(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "id_proyecto y motivo son obligatorios", err.Error())
		return
	}
	idProj, _ := strconv.Atoi(c.PostForm("id_proyecto"))
	if idProj == 0 {
		utils.Fail(c, http.StatusBadRequest, "id_proyecto requerido", nil)
		return
	}
	idUser := personaIDFromToken(h.db, c)
	var idDoc *uint
	file, err := c.FormFile("archivo")
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "adjunta el informe modificado en PDF (campo archivo)", nil)
		return
	}
	// Validación robusta: 32MB (R13) + contenido PDF verificado.
	saved, err := storage.GuardarSeguro(file, storage.KindPDF, "evidencias")
	if err != nil {
		if _, ok := err.(*storage.ErrorValidacion); ok {
			utils.Fail(c, http.StatusBadRequest, err.Error(), nil)
			return
		}
		utils.Fail(c, http.StatusInternalServerError, "No se pudo guardar el sustento", err.Error())
		return
	}
	{
		doc := &domain.RSUDocumento{
			IDProyecto: uint(idProj), IDTipoDoc: tipoDocIDPorNombre(h.db, "Informe Inicial", 5),
			TamanoBytes: intPtr(saved.Size),
			IDUsuarioSubida: uint(idUser), NombreArchivo: saved.Filename,
			URLArchivo: saved.URL, HashArchivo: &saved.Hash,
			Version: 1, Vigente: true,
		}
		if err := h.db.Create(doc).Error; err != nil {
			utils.Fail(c, http.StatusInternalServerError, "No se pudo registrar el documento de sustento", err.Error())
			return
		}
		idDoc = &doc.ID
	}
	m := &domain.RSUModificacionInforme{
		IDProyecto: uint(idProj), Motivo: req.Motivo,
		IDDocumentoSolicitud: idDoc, FechaSolicitud: time.Now(),
	}
	if err := h.repo.Create(m); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "No se pudo registrar la modificación", err.Error())
		return
	}
	utils.Created(c, m, "Solicitud de modificación registrada · PENDIENTE")
}

// ByProyecto lista las modificaciones de un proyecto.
func (h *ModificacionHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.repo.ByProyecto(uint(id))
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Error al listar modificaciones", err.Error())
		return
	}
	utils.Success(c, list, "OK")
}

// Update cambia el estado de la solicitud (verificador).
func (h *ModificacionHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct {
		Estado        string  `json:"estado"`
		Observaciones *string `json:"observaciones"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Estado == "" {
		utils.Fail(c, http.StatusBadRequest, "estado requerido", err.Error())
		return
	}
	estado := normEstadoMod(body.Estado)
	if estado == "" {
		utils.Fail(c, http.StatusBadRequest, "estado inválido (PENDIENTE, REVISADO, APROBADO, OBSERVADO, RECHAZADO)", nil)
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
		utils.Fail(c, http.StatusInternalServerError, "No se pudo actualizar la modificación", err.Error())
		return
	}
	utils.Success(c, nil, "Modificación actualizada")
}

// normEstadoMod normaliza el estado del PATCH de modification (espacios y
// mayúsculas) y devuelve "" si no pertenece al ciclo de la solicitud.
func normEstadoMod(s string) string {
	s = strings.ToUpper(strings.TrimSpace(s))
	switch s {
	case "PENDIENTE", "REVISADO", "APROBADO", "OBSERVADO", "RECHAZADO":
		return s
	}
	return ""
}

func uintPtr(n int) *uint { v := uint(n); return &v }
