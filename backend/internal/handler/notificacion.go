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
func (h *NotificacionHandler) List(c *gin.Context) {
	rol := c.Query("rol_destino")
	if rol == "" { rol = c.Query("rol_actor") }
	var rolPtr *string
	if rol != "" { rolPtr = &rol }
	var uidPtr *uint
	if v := c.Query("usuario"); v != "" {
		if n, err := strconv.Atoi(v); err == nil { u := uint(n); uidPtr = &u }
	}
	if v := c.Query("id_usuario"); v != "" {
		if n, err := strconv.Atoi(v); err == nil { u := uint(n); uidPtr = &u }
	}
	onlyUnread := c.Query("only_unread") == "true" || c.Query("unread") == "true"
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 100 { limit = 20 }
	items, total, err := h.repo.List(rolPtr, uidPtr, onlyUnread, limit)
	if err != nil { utils.Fail(c, 500, "Error listando notificaciones", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(1, limit, total), "OK")
}
func (h *NotificacionHandler) CountUnread(c *gin.Context) {
	rol := c.Query("rol_destino")
	if rol == "" { rol = c.Query("rol_actor") }
	if rol == "" { utils.Fail(c, 400, "rol_destino requerido", nil); return }
	cnt, _ := h.repo.CountUnread(rol)
	utils.Success(c, gin.H{"rol_destino": rol, "unread": cnt}, "OK")
}
func (h *NotificacionHandler) Counts(c *gin.Context) {
	// GET /notificaciones/counts?roles=DIR_ESCUELA,CONSEJO_FACULTAD
	rolesQ := c.Query("roles")
	if rolesQ == "" { rolesQ = c.Query("rol_destino") }
	if rolesQ == "" {
		// devuelve conteo global por rol
		allRoles := []string{"ESTUDIANTE_PROP","ESTUDIANTE_EJEC","DOCENTE_RESP","DOCENTE_COLAB","DIR_ESCUELA","COMITE_PS","DIR_RS_FACULTAD","CONSEJO_FACULTAD","DIR_DEPTO","DIR_CENTRAL_RS","UNIDAD_ABAST","COMITE_CALIDAD"}
		rolesQ = ""
		for i, r := range allRoles { if i>0 { rolesQ += "," }; rolesQ += r }
	}
	var roles []string
	for _, p := range splitComma(rolesQ) { if p != "" { roles = append(roles, p) } }
	m, _ := h.repo.CountUnreadByRoles(roles)
	utils.Success(c, m, "OK")
}
func splitComma(s string) []string {
	var out []string
	cur := ""
	for _, ch := range s { if ch == ',' { out = append(out, cur); cur = "" } else { cur += string(ch) } }
	out = append(out, cur)
	return out
}
func (h *NotificacionHandler) MarkRead(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.repo.MarkRead(uint(id)); err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, nil, "Marcada como leída")
}
func (h *NotificacionHandler) MarkAllRead(c *gin.Context) {
	rol := c.Query("rol_destino")
	if rol == "" { rol = c.Query("rol_actor") }
	if rol != "" {
		h.repo.MarkAllRead(rol)
	}
	utils.Success(c, nil, "Todas marcadas leídas")
}
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
func (h *NotificacionHandler) Health(c *gin.Context){ c.JSON(http.StatusOK, gin.H{"notificaciones":"ok"})}
