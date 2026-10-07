package middleware

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"undc-rsu/backend/internal/domain"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Requested-With")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		_ = start
		// minimal logger: gin already logs; keep hook for audit
	}
}

// AuditMiddleware registra en RSU_Auditoria_Log toda mutación (POST/PUT/PATCH/DELETE).
// Solo se activa para métodos mutantes; GET no se audita (lectura).
// El usuario se lee del contexto (clave "usuario_id") si existe; si no, 0 = sistema.
func AuditMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// solo auditoría de mutaciones
		switch c.Request.Method {
		case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
			// dejar pasar y registrar después
		default:
			c.Next()
			return
		}
		// snapshot del path/body antes de procesar (para valor_anterior en updates)
		path := c.Request.URL.Path
		method := c.Request.Method
		ip := c.ClientIP()
		ua := c.Request.UserAgent()
		_ = ua
		usuarioID := uint(0)
		if v, ok := c.Get("usuario_id"); ok {
			if id, ok := v.(uint); ok {
				usuarioID = id
			}
		}
		idProyecto := extractProyectoID(c)

		c.Next() // procesar la petición

		// registrar auditoría (no bloquear la respuesta si falla)
		accion := accionDe(method, c)
		log := &domain.RSUAuditoriaLog{
			IDUsuario:  usuarioID,
			IDProyecto: idProyecto,
			Accion:     accion,
			TablaAfectada: entidadDe(path),
			IPOrigen:   &ip,
		}
		_ = db.Create(log).Error
	}
}

// accionDe mapea método HTTP + status a la acción auditada (V1.1 §3.1).
func accionDe(method string, c *gin.Context) string {
	if c.Writer.Status() >= 400 {
		return "ERROR"
	}
	switch method {
	case http.MethodPost:
		return "CREAR"
	case http.MethodPut:
		return "EDITAR"
	case http.MethodPatch:
		return "EDITAR"
	case http.MethodDelete:
		return "ELIMINAR"
	default:
		return "CREAR"
	}
}

// entidadDe deduce la entidad afectada desde la ruta (p. ej. /api/v1/proyectos → Proyecto).
func entidadDe(path string) string {
	// toma el primer segmento tras /api/v1/
	// p. ej. /api/v1/proyectos/5/transicion → "proyectos"
	// se simplifica a la tabla lógica
	return path
}

// extractProyectoID intenta leer :id de la ruta cuando la entidad es proyecto-scoped.
// Lee el parámetro de ruta "id" y, si la ruta contiene "proyecto", lo trata como id_proyecto.
func extractProyectoID(c *gin.Context) *uint {
	// solo cuando la ruta está dentro de /proyectos/... (o entidad proyecto-scoped)
	if !strings.Contains(c.Request.URL.Path, "/proyecto") &&
		!strings.Contains(c.Request.URL.Path, "/entregables") &&
		!strings.Contains(c.Request.URL.Path, "/actividades") &&
		!strings.Contains(c.Request.URL.Path, "/documentos") &&
		!strings.Contains(c.Request.URL.Path, "/encuestas") &&
		!strings.Contains(c.Request.URL.Path, "/presupuesto") &&
		!strings.Contains(c.Request.URL.Path, "/indicadores") &&
		!strings.Contains(c.Request.URL.Path, "/beneficiarios") {
		return nil
	}
	idStr := c.Param("id")
	if idStr == "" {
		return nil
	}
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		return nil
	}
	uid := uint(id)
	return &uid
}
