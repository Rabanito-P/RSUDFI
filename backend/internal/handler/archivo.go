package handler

import (
	"io"
	"path"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/internal/storage"
	"undc-rsu/backend/pkg/utils"
)

// ── Archivo Handler (descarga unificada local + Backblaze B2) ───
// El bucket B2 es PRIVADO: no se guardan URLs públicas. Cada archivo
// (documento, foto de evidencia, firma) se sirve por este endpoint, que
// exige token y solo atiende keys registrados en la BD.

type ArchivoHandler struct {
	db     *gorm.DB
	cfgReo *repository.ConfiguracionRepo
}

func NewArchivoHandler(db *gorm.DB) *ArchivoHandler {
	return &ArchivoHandler{db: db, cfgReo: repository.NewConfiguracionRepo(db)}
}

// valorActualB2 lee una credencial guardada en configuración (o vacío).
func (h *ArchivoHandler) valorActualB2(clave string) string {
	if v, err := h.cfgReo.Valor(clave); err == nil {
		return v
	}
	return ""
}

// GuardarB2 (solo ADMIN) valida credenciales nuevas de Backblaze contra la
// API nativa; si conectan, las guarda en RSU_Configuracion y las activa en
// caliente — sin reiniciar el backend ni editar archivos .env.
// @Tags		Archivos
// @Accept		json
// @Produce	json
// @Param		body body object true "Credenciales B2 (vacío = mantener la actual)"
// @Success	200 {object} map[string]any "OK"
// @Failure	403 "Solo administrador"
// @Failure	400 "Credenciales inválidas"
// @Router		/api/v1/storage/b2 [put]
func (h *ArchivoHandler) GuardarB2(c *gin.Context) {
	if c.GetString("rol_actor") != "ADMIN" {
		utils.Fail(c, 403, "solo un administrador puede cambiar las credenciales de almacenamiento", nil)
		return
	}
	var req struct {
		AccountID string `json:"b2_account_id"`
		AppKey    string `json:"b2_application_key"`
		BucketID  string `json:"b2_bucket_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	// Campos vacíos = conservar el valor guardado.
	account, appKey, bucket := strings.TrimSpace(req.AccountID), strings.TrimSpace(req.AppKey), strings.TrimSpace(req.BucketID)
	if account == "" {
		account = h.valorActualB2("b2_account_id")
	}
	if appKey == "" {
		appKey = h.valorActualB2("b2_application_key")
	}
	if bucket == "" {
		bucket = h.valorActualB2("b2_bucket_id")
	}
	if err := storage.AplicarCredenciales(account, appKey, bucket); err != nil {
		utils.Fail(c, 400, "Credenciales B2 no válidas: "+err.Error(), nil)
		return
	}
	// Guardar en configuración (para que sobreviva reinicios).
	idAdmin := tokenUserID(c)
	desc := "Credenciales Backblaze B2 (API nativa)"
	for _, kv := range []struct{ clave, valor string }{
		{"b2_account_id", account}, {"b2_application_key", appKey}, {"b2_bucket_id", bucket},
	} {
		d := desc
		_ = h.cfgReo.Upsert(&domain.RSUConfiguracion{
			Clave: kv.clave, Valor: kv.valor, Descripcion: &d, Tipo: "STRING", Ambito: "GLOBAL",
			ActualizadoPor: func() *uint { u := uint(idAdmin); return &u }(),
		})
	}
	utils.Success(c, gin.H{"b2_ok": true, "bucket_id": bucket}, "Backblaze B2 conectado y credenciales guardadas")
}

// archivoExiste verifica que el key/url esté registrado en la BD (documento,
// foto de actividad o firma) y devuelve el proyecto dueño para el control de
// acceso. Así /archivos no es un proxy abierto al bucket privado.
func (h *ArchivoHandler) archivoExiste(url string) (existe bool, idProyecto uint) {
	var n int64
	h.db.Model(&domain.RSUDocumento{}).Where("url_archivo = ?", url).Count(&n)
	if n > 0 {
		var doc domain.RSUDocumento
		h.db.Select("id_proyecto").Where("url_archivo = ?", url).First(&doc)
		return true, doc.IDProyecto
	}
	var foto domain.RSUActividadFoto
	if err := h.db.Where("url_foto = ?", url).First(&foto).Error; err == nil {
		var act domain.RSUActividadCampo
		h.db.Select("id_proyecto").Where("id_actividad = ?", foto.IDActividad).First(&act)
		return true, act.IDProyecto
	}
	n = 0
	h.db.Model(&domain.RSUFormato{}).Where("url_archivo = ?", url).Count(&n)
	if n > 0 {
		// Formatos RSU: los ve cualquier usuario autenticado.
		return true, 0
	}
	return false, 0
}

// Descargar entrega el archivo. En local (o respaldo local guardado por
// fallback) reenvía a /uploads (redirect); en B2 transmite el stream del
// bucket privado con el nombre original.
// @Tags		Archivos
// @Produce		octet-stream
// @Param		key query string true "Key/URL del archivo registrado en BD"
// @Success	200 {file} file "Archivo"
// @Success	302 {string} string "Redirección (local)"
// @Failure	403 "Archivo no registrado"
// @Failure	404 "No encontrado"
// @Router		/api/v1/archivos [get]
func (h *ArchivoHandler) Descargar(c *gin.Context) {
	key := c.Query("key")
	if key == "" {
		utils.Fail(c, 400, "parámetro key requerido", nil)
		return
	}
	existe, idProyecto := h.archivoExiste(key)
	if !existe {
		utils.Fail(c, 403, "archivo no registrado en el sistema", nil)
		return
	}
	// Control de acceso por objeto (OWASP A01): los archivos de un proyecto
	// solo los ve el equipo, el asesor o la gestión. Los formatos (idProyecto
	// 0) son públicos para cualquier usuario autenticado.
	if idProyecto > 0 && !puedeVerProyecto(h.db, c, idProyecto) {
		utils.Fail(c, 403, "no tienes acceso a este archivo", nil)
		return
	}
	if !storage.EsCloud() {
		// Local: la ruta estática /uploads sirve el archivo.
		c.Redirect(302, key)
		return
	}
	// Driver B2 con archivo caído en el disco por fallback: se sirve local.
	if storage.ExisteLocal(key) {
		c.Redirect(302, key)
		return
	}
	body, ct, err := storage.AbrirArchivo(key)
	if err != nil {
		utils.Fail(c, 404, "archivo no encontrado en el bucket", err.Error())
		return
	}
	defer body.Close()
	nombre := path.Base(key)
	c.Header("Content-Type", ct)
	c.Header("Content-Disposition", "attachment; filename=\""+nombre+"\"")
	c.Header("Cache-Control", "private, max-age=300")
	_, _ = io.Copy(c.Writer, body)
}

// Estado reporta el driver de almacenamiento activo y, si es B2, si responde.
// Diagnóstico rápido para el panel de administración sin revisar los logs.
// @Tags		Archivos
// @Produce		json
// @Success	200 {object} map[string]any "OK"
// @Router		/api/v1/storage/estado [get]
func (h *ArchivoHandler) Estado(c *gin.Context) {
	resp := gin.H{
		"driver": storage.Driver(),
		"cloud":  storage.EsCloud(),
	}
	if storage.EsCloud() {
		if err := storage.Verificar(); err != nil {
			resp["b2_ok"] = false
			resp["b2_error"] = err.Error()
		} else {
			resp["b2_ok"] = true
			resp["bucket_id"] = storage.DatosB2Diagnostico()
		}
	}
	utils.Success(c, resp, "OK")
}

// responderErrorGuardado mapea un fallo de almacenamiento al código HTTP
// correcto: 400 si el archivo no pasó la validación, 503 si la nube (B2) no
// responde — el usuario debe saber que es temporal, no un error del archivo.
func responderErrorGuardado(c *gin.Context, err error) {
	if _, ok := err.(*storage.ErrorValidacion); ok {
		utils.Fail(c, 400, err.Error(), nil)
		return
	}
	if storage.EsCloud() {
		utils.Fail(c, 503, "Almacenamiento B2 no disponible en este momento. Reintenta en unos minutos; si el problema persiste avisa a soporte (revisar credenciales de Backblaze).", err.Error())
		return
	}
	utils.Fail(c, 500, "No se pudo guardar", err.Error())
}
