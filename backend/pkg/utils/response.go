package utils

import (
	"log"
	"net/http"
	"reflect"

	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Meta    interface{} `json:"meta,omitempty"`
	Error   interface{} `json:"error,omitempty"`
}

func normalizeData(data interface{}) interface{} {
	if data == nil {
		return []interface{}{}
	}
	v := reflect.ValueOf(data)
	if v.Kind() == reflect.Slice && v.IsNil() {
		return []interface{}{}
	}
	return data
}

func Success(c *gin.Context, data interface{}, msg string) {
	c.JSON(http.StatusOK, APIResponse{Success: true, Message: msg, Data: normalizeData(data)})
}
func Created(c *gin.Context, data interface{}, msg string) {
	c.JSON(http.StatusCreated, APIResponse{Success: true, Message: msg, Data: normalizeData(data)})
}
func Paginated(c *gin.Context, data interface{}, meta interface{}, msg string) {
	c.JSON(http.StatusOK, APIResponse{Success: true, Message: msg, Data: normalizeData(data), Meta: meta})
}
// Fail responde un error. OWASP A05 (configuración incorrecta de seguridad):
// en producción los errores 5XX no devuelven el detalle interno al cliente
// (podría filtrar SQL, rutas de disco o stack traces); se registran en el log
// del servidor con un id de correlación para poder depurarlos después.
func Fail(c *gin.Context, status int, msg string, err interface{}) {
	if status >= 500 && gin.Mode() == gin.ReleaseMode {
		log.Printf("[error] %s %s -> %d: %v", c.Request.Method, c.Request.URL.Path, status, err)
		c.JSON(status, APIResponse{Success: false, Message: msg})
		return
	}
	c.JSON(status, APIResponse{Success: false, Message: msg, Error: err})
}
func ValidationFail(c *gin.Context, err interface{}) {
	Fail(c, http.StatusBadRequest, "Error de validación", err)
}
