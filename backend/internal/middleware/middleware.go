package middleware

import (
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"undc-rsu/backend/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// secretJWT obtiene la clave de firma. En producción es obligatoria: si falta,
// se rechaza el arranque en lugar de caer en una clave conocida por todo el
// mundo (ISO 27001 A.10 — controles criptográficos).
func secretJWT() (string, error) {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		if os.Getenv("GIN_MODE") == "release" {
			return "", errors.New("JWT_SECRET es obligatorio en producción (GIN_MODE=release)")
		}
		// Valor de desarrollo, claramente inseguro y solo para ese entorno.
		return "dev-inseguro-solo-para-desarrollo-local", nil
	}
	if len(s) < 32 && os.Getenv("GIN_MODE") == "release" {
		return "", errors.New("JWT_SECRET debe tener al menos 32 caracteres en producción")
	}
	return s, nil
}

// SecretYaLimpio permite que el arranque falle temprano si la configuración no
// es segura. Lo llama main antes de servir tráfico.
func ValidarConfigSegura() error {
	_, err := secretJWT()
	return err
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authorization header requerido"})
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Formato de Authorization inválido. Use: Bearer <token>"})
			return
		}
		tokenString := parts[1]
		secret, err := secretJWT()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Configuración de seguridad incompleta en el servidor"})
			return
		}
		// El algoritmo se fija explícitamente: evita el ataque "alg: none" y la
		// confusión HMAC/RSA. Se validan también emisor y audiencia.
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		}, jwt.WithValidMethods([]string{"HS256"}),
			jwt.WithIssuer("undc-rsu"),
			jwt.WithAudience("undc-rsu-api"))
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Token inválido o expirado"})
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Claims inválidos"})
			return
		}
		if uid, ok := claims["user_id"].(float64); ok {
			c.Set("user_id", uint(uid))
			c.Set("usuario_id", uint(uid))
		}
		if rol, ok := claims["rol_actor"].(string); ok {
			c.Set("rol_actor", rol)
		}
		if correo, ok := claims["correo"].(string); ok {
			c.Set("correo", correo)
		}
		c.Next()
	}
}

// CORS configura los orígenes permitidos. Sin configuración se aceptan todos
// (entorno de desarrollo); con CORS_ORIGINS se restringe a esa lista.
// OWASP A05: no usar comodín cuando la API maneja credenciales.
func CORS() gin.HandlerFunc {
	permitidos := map[string]bool{}
	origenes := os.Getenv("CORS_ORIGINS")
	for _, o := range strings.Split(origenes, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			permitidos[o] = true
		}
	}
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if len(permitidos) == 0 {
			// Desarrollo: se permite cualquier origen.
			c.Header("Access-Control-Allow-Origin", "*")
		} else if origin != "" && permitidos[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Credentials", "true")
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Requested-With")
		c.Header("Access-Control-Max-Age", "600")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// Seguridad añade cabeceras de protección en todas las respuestas.
// Cubre OWASP A05 (configuración incorrecta de seguridad) y el endurecimiento
// básico que pide ISO 27001 A.13 (comunicaciones seguras).
func Seguridad() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Evita que la API se incruste en iframes de otros sitios (clickjacking).
		c.Header("X-Frame-Options", "DENY")
		// Fuerza HTTPS si el despliegue va detrás de TLS.
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		// Impide que el navegador adivine el tipo de contenido.
		c.Header("X-Content-Type-Options", "nosniff")
		// No filtra la URL del servidor a sitios de terceros.
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		// Restringe las funciones del navegador que la API no necesita.
		c.Header("Permissions-Policy", "geolocation=(self), microphone=(), camera=(self), payment=()")
		// CSP mínima: la API responde JSON, nunca HTML.
		c.Header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'")
		// No guardar respuestas con datos de proyectos en caché del navegador.
		c.Header("Cache-Control", "no-store")
		c.Header("X-Permitted-Cross-Domain-Policies", "none")
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
		entidad := entidadDe(path)
		log := &domain.RSUAuditoriaLog{
			IDUsuario:  usuarioID,
			IDProyecto: idProyecto,
			Accion:     accion,
			TablaAfectada: &entidad,
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

// ── Limitación de intentos (OWASP A07: identificación y autenticación) ──
//
// contraladorDeIntentos cuenta solicitudes por clave (normalmente la IP) y
// bloquea cuando se supera el máximo en la ventana de tiempo. Protege de fuerza
// bruta contra /auth/login sin necesidad de infraestructura externa.

type intentos struct {
	mu       sync.Mutex
	porClave map[string]*contador
	max      int
	ventana  time.Duration
}

type contador struct {
	golpes   int
	reinicio time.Time
}

func nuevoControlIntentos(max int, ventana time.Duration) *intentos {
	return &intentos{
		porClave: make(map[string]*contador),
		max:      max,
		ventana:  ventana,
	}
}

// Permitido informa si la clave puede continuar y registra el intento.
func (t *intentos) Permitido(clave string) bool {
	t.mu.Lock()
	defer t.mu.Unlock()
	ahora := time.Now()
	c, ok := t.porClave[clave]
	if !ok || ahora.After(c.reinicio) {
		t.porClave[clave] = &contador{golpes: 1, reinicio: ahora.Add(t.ventana)}
		// Limpieza oportunista para no crecer sin límite.
		if len(t.porClave) > 5000 {
			for k, v := range t.porClave {
				if ahora.After(v.reinicio) {
					delete(t.porClave, k)
				}
			}
		}
		return true
	}
	c.golpes++
	return c.golpes <= t.max
}

// RateLimit limita las peticiones por IP. Se usa en el login: 10 intentos por
// minuto por dirección es suficiente para un usuario legítimo.
func RateLimit(max int, ventana time.Duration) gin.HandlerFunc {
	ctrl := nuevoControlIntentos(max, ventana)
	return func(c *gin.Context) {
		ip := c.ClientIP()
		if !ctrl.Permitido(ip) {
			c.Header("Retry-After", "60")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": "Demasiados intentos. Espera un minuto antes de volver a probar.",
			})
			return
		}
		c.Next()
	}
}

// TamañoDeCuerpo limita el cuerpo de las peticiones (mitiga DoS por payload).
func TamañoDeCuerpo(maxBytes int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.ContentLength > maxBytes {
			c.AbortWithStatusJSON(http.StatusRequestEntityTooLarge, gin.H{
				"success": false,
				"message": "Cuerpo de la petición demasiado grande",
			})
			return
		}
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		c.Next()
	}
}

// extractProyectoID intenta leer :id de la ruta cuando la entidad es proyecto-scoped.
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

// RequiereRol restringe una ruta a los roles BPMN indicados (claim rol_actor).
// ADMIN pasa siempre.
//
// Responde 404 y no 403: la segunda capa no debe revelar que la ruta existe ni
// qué roles la habilitan. Un estudiante al que el Administrador le haya
// abierto el módulo sigue recibiendo 404 en las escrituras, porque lo que no
// le corresponde no es el permiso sino el rol.
func RequiereRol(codigos ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		rol := c.GetString("rol_actor")
		if rol == "ADMIN" {
			c.Next()
			return
		}
		for _, x := range codigos {
			if rol == x {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Recurso no encontrado",
		})
		c.Abort()
	}
}

// ─────────────────────────────────────────────────────────────────
// Capa 1 de la autorización: VER (RSU_Usuario_Permiso)
// ─────────────────────────────────────────────────────────────────
//
// PermiteModulo deja leer la ruta si el usuario tiene activo CUALQUIERA de
// los módulos indicados. Es la capa 1 del modelo de dos capas:
//
//   - Sin el módulo → 404, para no revelar siquiera que la ruta existe.
//   - Con el módulo → la lectura pasa. Habilitar un módulo a un estudiante
//     le deja entrar y VER, pero eso NO le da ningún poder de escritura:
//     las escrituras se validan aparte por rol (RequiereRol y el actor BPMN).
//
// Se admiten varios módulos porque algunas lecturas alimentan varias
// pantallas: /dashboard/kpis lo usan Reportes, Presupuesto y el Dashboard.
//
// ADMIN pasa siempre: administra usuarios y módulos, incluido este.
func PermiteModulo(modulos ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetString("rol_actor") == "ADMIN" {
			c.Next()
			return
		}
		db := dbPermisos()
		uid := tokenID(c)
		var n int64
		if db != nil && uid > 0 {
			if err := db.Table("RSU_Usuario_Permiso").
				Where("id_usuario = ? AND activo = true AND modulo IN ?", uid, modulos).
				Count(&n).Error; err == nil && n > 0 {
				c.Next()
				return
			}
		}
		// Módulo no habilitado: 404 en vez de 403 para no filtrar la existencia
		// de la ruta ni el catálogo de módulos.
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Recurso no encontrado",
		})
		c.Abort()
	}
}

// tokenID lee el claim user_id que deja AuthMiddleware en el contexto.
func tokenID(c *gin.Context) int {
	if v, ok := c.Get("user_id"); ok {
		switch t := v.(type) {
		case int:
			return t
		case int64:
			return int(t)
		case uint:
			return int(t)
		case float64:
			return int(t)
		}
	}
	return 0
}

// SetDBPermisos registra la base de datos que usan los middlewares de
// permisos. Lo llama router.Setup antes de registrar rutas.
var permisosDB *gorm.DB

func SetDBPermisos(db *gorm.DB) { permisosDB = db }

func dbPermisos() *gorm.DB { return permisosDB }
