package handler

import (
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/storage"
)

// ── Formatos y guías RSU ───────────────────────────────────────
//
// El catálogo de formatos es FIJO: son los 7 formatos oficiales que el sistema
// usa siempre. El administrador no crea ni elimina formatos — solo REEMPLAZA el
// archivo de ejemplo que se le ofrece al estudiante (por una versión nueva).
//
// Cuando un formato no tiene archivo subido se sirve el de fábrica que viene en
// documentos/plantillas/, así el sistema funciona desde el primer arranque.

type FormatoHandler struct{ db *gorm.DB }

func NewFormatoHandler(db *gorm.DB) *FormatoHandler {
	h := &FormatoHandler{db: db}
	// Asegura que los 7 registros existan aunque la BD viniera de un seed viejo.
	h.asegurarCatalogo()
	return h
}

// formatoBase describe cada formato del catálogo fijo.
type formatoBase struct {
	Codigo      string
	Nombre      string
	Descripcion string
	Archivo     string
	Orden       int
}

// catalogoFormato es la lista cerrada de formatos. El orden es el orden en que
// se usan en el ciclo del proyecto.
var catalogoFormato = []formatoBase{
	{CODIGO_PROPUESTA, "Formato 1 · Propuesta de proyecto",
		"Documento de propuesta: problema, objetivos, fundamentación y beneficiarios.", "01-propuesta-de-proyecto.docx", 1},
	{CODIGO_PLANIFICACION, "Formato 2 · Planificación de actividades",
		"Cronograma semanal de actividades (Excel). Se lee para crear las actividades del proyecto.", "02-planificacion-de-actividades.xlsx", 2},
	{CODIGO_PRIMER, "Formato 3 · Primer entregable",
		"Reporte del primer entregable de la ejecución.", "03-primer-entregable.docx", 3},
	{CODIGO_SEGUNDO, "Formato 4 · Segundo entregable",
		"Reporte del segundo entregable de la ejecución.", "04-segundo-entregable.docx", 4},
	{CODIGO_TERCER, "Formato 5 · Tercer entregable",
		"Reporte del tercer entregable de la ejecución.", "05-tercer-entregable.docx", 5},
	{CODIGO_ENCUESTA, "Formato 6 · Encuesta de satisfacción",
		"Cuestionario Likert que se aplica a los beneficiarios del proyecto.", "06-encuesta-satisfaccion.docx", 6},
	{CODIGO_INFORME_FINAL, "Formato 7 · Informe final",
		"Informe de cierre del proyecto con resultados e impacto alcanzado.", "07-informe-final.docx", 7},
}

// Códigos estables: los usa el frontend y las rutas de descarga.
const (
	CODIGO_PROPUESTA     = "PROPUESTA"
	CODIGO_PLANIFICACION = "PLANIFICACION"
	CODIGO_PRIMER        = "PRIMER_ENTREGABLE"
	CODIGO_SEGUNDO       = "SEGUNDO_ENTREGABLE"
	CODIGO_TERCER        = "TERCER_ENTREGABLE"
	CODIGO_ENCUESTA      = "ENCUESTA"
	CODIGO_INFORME_FINAL = "INFORME_FINAL"
)

// codigoValido solo acepta los 7 códigos del catálogo.
func codigoValido(codigo string) bool {
	for _, f := range catalogoFormato {
		if f.Codigo == strings.ToUpper(codigo) {
			return true
		}
	}
	return false
}

// formatosDir es el directorio persistente de archivos subidos.
func formatosDir() string { return filepath.Join(storage.UploadDir(), "formatos") }

// baseDir localiza documentos/plantillas (contenedor o desarrollo local).
func baseDir() string {
	for _, c := range []string{
		os.Getenv("RSU_PLANTILLAS_DIR"),
		"/app/documentos/plantillas",
		"../documentos/plantillas",
		"../../documentos/plantillas",
	} {
		if c == "" {
			continue
		}
		if st, err := os.Stat(c); err == nil && st.IsDir() {
			return c
		}
	}
	return ""
}

// asegurarCatalogo crea los registros que falten del catálogo fijo.
func (h *FormatoHandler) asegurarCatalogo() {
	if h.db == nil || h.db.Config == nil {
		return
	}
	for _, f := range catalogoFormato {
		var n int64
		h.db.Model(&domain.RSUFormato{}).Where("codigo = ?", f.Codigo).Count(&n)
		if n > 0 {
			continue
		}
		h.db.Create(&domain.RSUFormato{
			Codigo:        f.Codigo,
			Nombre:        f.Nombre,
			Descripcion:   f.Descripcion,
			ArchivoBase:   f.Archivo,
			Version:       "1.0",
			Orden:         f.Orden,
			FechaActualiz: time.Now(),
		})
	}
}

// vista expone el formato junto a la URL de descarga y si está personalizado.
type vistaFormato struct {
	ID            uint   `json:"id_formato"`
	Codigo        string `json:"codigo"`
	Nombre        string `json:"nombre"`
	Descripcion   string `json:"descripcion"`
	Tipo          string `json:"tipo"`
	Version       string `json:"version"`
	Personalizado bool   `json:"personalizado"`
	NombreArchivo string `json:"nombre_archivo"`
	PesoBytes     int64  `json:"peso_bytes"`
	FechaActualiz string `json:"fecha_actualizacion"`
	Orden         int    `json:"orden"`
}

func (h *FormatoHandler) aVista(f *domain.RSUFormato) vistaFormato {
	tipo := strings.TrimPrefix(filepath.Ext(f.ArchivoBase), ".")
	if f.NombreArchivo != "" {
		tipo = strings.TrimPrefix(filepath.Ext(f.NombreArchivo), ".")
	}
	return vistaFormato{
		ID: f.ID, Codigo: f.Codigo, Nombre: f.Nombre, Descripcion: f.Descripcion,
		Tipo: strings.ToLower(tipo), Version: f.Version,
		Personalizado: f.Ruta != "", NombreArchivo: f.NombreArchivo,
		PesoBytes: f.PesoBytes, Orden: f.Orden,
		FechaActualiz: f.FechaActualiz.Format("2006-01-02"),
	}
}

// abrirFormato resuelve el archivo a servir: el subido por el admin si
// existe; si no, la guía de fábrica. Con el driver B2 activo se baja del
// bucket privado (las guías viven ahí desde la migración) y solo si no está
// en la nube se cae al disco local — así el sistema funciona en los dos modos.
// Devuelve stream, content-type y nombre de archivo.
func (h *FormatoHandler) abrirFormato(f *domain.RSUFormato) (io.ReadCloser, string, string, error) {
	ctDe := func(ct, nombre string) string {
		if ct == "" || ct == "application/octet-stream" {
			// B2 sube todo como octet-stream: se deduce por extensión para que
			// Word/Excel se abran correctamente en el navegador.
			switch strings.ToLower(filepath.Ext(nombre)) {
			case ".docx":
				return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
			case ".xlsx":
				return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			case ".pdf":
				return "application/pdf"
			}
		}
		return ct
	}
	// 1) Archivo que subió el administrador.
	if f.Ruta != "" {
		if storage.EsCloud() && !esRutaLocal(f.Ruta) {
			if body, ct, err := storage.AbrirArchivo(f.Ruta); err == nil {
				return body, ctDe(ct, nombreFormato(f)), nombreFormato(f), nil
			}
		} else if file, err := os.Open(f.Ruta); err == nil {
			return file, ctDe("", nombreFormato(f)), nombreFormato(f), nil
		}
	}
	// 2) Guía de fábrica: bucket B2 primero, disco local después.
	if storage.EsCloud() {
		key := "plantillas/" + f.ArchivoBase
		if body, ct, err := storage.AbrirArchivo(key); err == nil {
			return body, ctDe(ct, f.ArchivoBase), f.ArchivoBase, nil
		}
	}
	if d := baseDir(); d != "" {
		if file, err := os.Open(filepath.Join(d, f.ArchivoBase)); err == nil {
			return file, ctDe("", f.ArchivoBase), f.ArchivoBase, nil
		}
	}
	return nil, "", "", errors.New("archivo no disponible")
}

// esRutaLocal distingue una ruta de disco de un key del bucket.
func esRutaLocal(s string) bool {
	return strings.HasPrefix(s, "/") || strings.HasPrefix(s, ".") ||
		(len(s) > 2 && s[1] == ':') || strings.HasPrefix(s, "uploads/")
}

// nombreFormato es el nombre que ve el usuario al descargar.
func nombreFormato(f *domain.RSUFormato) string {
	if f.NombreArchivo != "" {
		return f.NombreArchivo
	}
	return f.ArchivoBase
}

// List devuelve los 7 formatos con su estado actual.
func (h *FormatoHandler) List(c *gin.Context) {
	var list []domain.RSUFormato
	if err := h.db.Order("orden ASC").Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo leer los formatos"})
		return
	}
	out := make([]vistaFormato, 0, len(list))
	for i := range list {
		out = append(out, h.aVista(&list[i]))
	}
	c.JSON(http.StatusOK, gin.H{"data": out})
}

// Codigos expone el catálogo fijo (para el frontend).
func (h *FormatoHandler) Codigos(c *gin.Context) {
	out := make([]gin.H, 0, len(catalogoFormato))
	for _, f := range catalogoFormato {
		out = append(out, gin.H{"codigo": f.Codigo, "nombre": f.Nombre, "orden": f.Orden})
	}
	c.JSON(http.StatusOK, gin.H{"data": out})
}

// Descargar entrega el archivo actual del formato (subido o de fábrica),
// desde el bucket B2 si está migrado, o del disco local como respaldo.
func (h *FormatoHandler) Descargar(c *gin.Context) {
	var f domain.RSUFormato
	if err := h.db.Where("codigo = ?", strings.ToUpper(c.Param("codigo"))).First(&f).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Formato no encontrado"})
		return
	}
	body, contentType, nombre, err := h.abrirFormato(&f)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "El archivo del formato no está disponible"})
		return
	}
	if body != nil {
		defer body.Close()
	}
	c.Header("Content-Disposition", `attachment; filename="`+filepath.Base(nombre)+`"`)
	if contentType != "" {
		c.Header("Content-Type", contentType)
	}
	_, _ = io.Copy(c.Writer, body)
}

// Subir reemplaza el archivo de un formato. Solo ADMIN.
func (h *FormatoHandler) Subir(c *gin.Context) {
	if !esAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo el administrador reemplaza formatos"})
		return
	}

	var f domain.RSUFormato
	if err := h.db.Where("codigo = ?", strings.ToUpper(c.Param("codigo"))).First(&f).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Formato no encontrado"})
		return
	}

	fh, err := c.FormFile("archivo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Adjunta el archivo del formato"})
		return
	}
	// 32 MB es suficiente para Word y Excel con imágenes (R13).
	if fh.Size > 32<<20 {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "El archivo supera los 32 MB"})
		return
	}
	// El formato debe conservar su tipo: si el catálogo es Excel, se pide Excel.
	extDeseado := strings.ToLower(filepath.Ext(f.ArchivoBase))
	if ext := strings.ToLower(filepath.Ext(fh.Filename)); ext != extDeseado {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El archivo debe tener la extensión " + filepath.Ext(f.ArchivoBase)})
		return
	}
	// Contenido real (magic bytes): un .exe renombrado a .docx se rechaza.
	if err := storage.ValidarArchivo(fh, storage.KindOffice); err != nil {
		msg := "el archivo no es un Office válido"
		if _, ok := err.(*storage.ErrorValidacion); ok {
			msg = err.Error()
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": msg})
		return
	}

	// 1) Fuente de verdad: bucket B2 (las guías viven en la nube).
	var key string
	if storage.EsCloud() {
		saved, err := storage.New().Save(fh, "formatos")
		if err != nil {
			responderErrorGuardado(c, err)
			return
		}
		key = saved.URL
	}
	// 2) Copia local (no se elimina: sirve de respaldo si B2 no está).
	rutaLocal := ""
	dir := formatosDir()
	if err := os.MkdirAll(dir, 0o755); err == nil {
		rutaLocal = filepath.Join(dir, f.Codigo+"_"+time.Now().Format("20060102150405")+filepath.Ext(fh.Filename))
		if err := c.SaveUploadedFile(fh, rutaLocal); err != nil {
			rutaLocal = ""
		}
	}
	ruta := key
	if ruta == "" {
		ruta = rutaLocal // sin nube configurada: manda el disco
	}
	if ruta == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo guardar el archivo"})
		return
	}

	// Descripción y versión son opcionales: si llegan vacías se conservan.
	desc := strings.TrimSpace(c.PostForm("descripcion"))
	if desc == "" {
		desc = f.Descripcion
	}
	ver := strings.TrimSpace(c.PostForm("version"))
	if ver == "" {
		ver = f.Version
	}

	anterior := f.Ruta
	f.Ruta = ruta
	f.NombreArchivo = fh.Filename
	f.PesoBytes = fh.Size
	f.Descripcion = desc
	f.Version = ver
	f.FechaActualiz = time.Now()
	if err := h.db.Save(&f).Error; err != nil {
		_ = os.Remove(ruta)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar el formato"})
		return
	}
	// El archivo anterior ya no se referencia: se borra (bucket o disco).
	if anterior != "" && anterior != ruta {
		if storage.EsCloud() && !esRutaLocal(anterior) {
			_ = storage.New().(*storage.B2Bucket).Eliminar(anterior)
		} else {
			_ = os.Remove(anterior)
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": h.aVista(&f), "mensaje": "Formato actualizado"})
}

// Restaurar devuelve el formato al archivo de fábrica. Solo ADMIN.
func (h *FormatoHandler) Restaurar(c *gin.Context) {
	if !esAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo el administrador restaura formatos"})
		return
	}
	var f domain.RSUFormato
	if err := h.db.Where("codigo = ?", strings.ToUpper(c.Param("codigo"))).First(&f).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Formato no encontrado"})
		return
	}
	anterior := f.Ruta
	f.Ruta = ""
	f.NombreArchivo = ""
	f.PesoBytes = 0
	f.Version = "1.0"
	f.FechaActualiz = time.Now()
	if err := h.db.Save(&f).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo restaurar el formato"})
		return
	}
	if anterior != "" {
		if storage.EsCloud() && !esRutaLocal(anterior) {
			_ = storage.New().(*storage.B2Bucket).Eliminar(anterior)
		} else {
			_ = os.Remove(anterior)
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": h.aVista(&f), "mensaje": "Formato restaurado al original"})
}
