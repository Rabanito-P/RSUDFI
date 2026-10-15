package handler

import (
	"net/http"
	"strconv"

	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type NotificacionHandler struct {
	repo *repository.NotificacionRepo
	db   *gorm.DB
}
func NewNotificacionHandler(db *gorm.DB) *NotificacionHandler {
	return &NotificacionHandler{repo: repository.NewNotificacionRepo(db), db: db}
}

// GET /notificaciones?rol_destino=DIR_ESCUELA&only_unread=true&limit=20&usuario=1
// Bandeja de notificaciones por rol_destino
// @Tags		Notificaciones
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/notificaciones [get]
func (h *NotificacionHandler) List(c *gin.Context) {
	rol := c.Query("rol_destino")
	if rol == "" { rol = c.Query("rol_actor") }
	var rolPtr *string
	if rol != "" { rolPtr = &rol }
	idUsuario := usuarioDeQuery(c)
	onlyUnread := c.Query("only_unread") == "true" || c.Query("unread") == "true"
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 100 { limit = 20 }
	items, total, err := h.repo.List(rolPtr, idUsuario, onlyUnread, limit)
	if err != nil { utils.Fail(c, 500, "Error listando notificaciones", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(1, limit, total), "OK")
}
// Contador de no leídas por rol
// @Tags		Notificaciones
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/notificaciones/count [get]
func (h *NotificacionHandler) CountUnread(c *gin.Context) {
	rol := c.Query("rol_destino")
	if rol == "" { rol = c.Query("rol_actor") }
	if rol == "" { utils.Fail(c, 400, "rol_destino requerido", nil); return }
	cnt, err := h.repo.CountUnread(rol, usuarioDeQuery(c))
	if err != nil { utils.Fail(c, 500, "Error contando no leídas", err.Error()); return }
	utils.Success(c, gin.H{"rol_destino": rol, "unread": cnt}, "OK")
}

// usuarioDeQuery lee ?usuario= / ?id_usuario= para que el contador y el
// "marcar todas" sean individuales (no barran con los avisos de otras
// cuentas que comparten el mismo rol_destino).
func usuarioDeQuery(c *gin.Context) *uint {
	v := c.Query("usuario")
	if v == "" { v = c.Query("id_usuario") }
	if v == "" { return nil }
	if n, err := strconv.Atoi(v); err == nil && n > 0 { u := uint(n); return &u }
	return nil
}
// Contadores multi-rol (counts?roles=A,B)
// @Tags		Notificaciones
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/notificaciones/counts [get]
func (h *NotificacionHandler) Counts(c *gin.Context) {
	// GET /notificaciones/counts?roles=DIR_ESCUELA,CONSEJO_FACULTAD
	rolesQ := c.Query("roles")
	if rolesQ == "" { rolesQ = c.Query("rol_destino") }
	if rolesQ == "" {
		var roles []domain.RSURolActor
		h.db.Find(&roles)
		for i, r := range roles {
			if i > 0 { rolesQ += "," }
			rolesQ += r.Codigo
		}
	}
	var roles []string
	for _, p := range splitComma(rolesQ) { if p != "" { roles = append(roles, p) } }
	m, err := h.repo.CountUnreadByRoles(roles)
	if err != nil { utils.Fail(c, 500, "Error contando no leídas", err.Error()); return }
	utils.Success(c, m, "OK")
}
func splitComma(s string) []string {
	var out []string
	cur := ""
	for _, ch := range s { if ch == ',' { out = append(out, cur); cur = "" } else { cur += string(ch) } }
	out = append(out, cur)
	return out
}
// Marcar notificación como leída
// @Tags		Notificaciones
// @Accept		json
// @Produce	json
// @Param		id path int true "ID notificación"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/notificaciones/{id}/leido [patch]
func (h *NotificacionHandler) MarkRead(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.repo.MarkRead(uint(id)); err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, nil, "Marcada como leída")
}
// Marcar todas como leídas por rol
// @Tags		Notificaciones
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/notificaciones/marcar-todas-leidas [patch]
func (h *NotificacionHandler) MarkAllRead(c *gin.Context) {
	rol := c.Query("rol_destino")
	if rol == "" { rol = c.Query("rol_actor") }
	if rol != "" {
		if err := h.repo.MarkAllRead(rol, usuarioDeQuery(c)); err != nil { utils.Fail(c, 500, "Error marcando como leídas", err.Error()); return }
	}
	utils.Success(c, nil, "Todas marcadas leídas")
}
// Crear notificación manual
// @Tags		Notificaciones
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/notificaciones [post]
func (h *NotificacionHandler) Create(c *gin.Context) {
	var body struct{
		RolDestino string `json:"rol_destino" binding:"required"`
		Tipo string `json:"tipo" binding:"required"`
		Titulo string `json:"titulo" binding:"required"`
		Mensaje *string `json:"mensaje"`
		IDProyecto *uint `json:"id_proyecto"`
		IDUsuario *uint `json:"id_usuario"`
	}
	if err := c.ShouldBindJSON(&body); err != nil { utils.ValidationFail(c, err.Error()); return }
	n := &domain.RSUNotificacion{
		RolDestino: body.RolDestino,
		Tipo: body.Tipo,
		Titulo: body.Titulo,
		Mensaje: body.Mensaje,
		IDProyecto: body.IDProyecto,
		IDUsuario: body.IDUsuario,
		Leido: false,
	}
	if err := h.repo.Create(n); err != nil {
		utils.Fail(c, 400, "No se pudo crear notificación", err.Error()); return
	}
	utils.Created(c, n, "Notificación creada")
}
// Healthcheck de notificaciones
// @Tags		Notificaciones
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/notificaciones/health [get]
func (h *NotificacionHandler) Health(c *gin.Context){ c.JSON(http.StatusOK, gin.H{"notificaciones":"ok"})}
