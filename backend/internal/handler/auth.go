package handler

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/auth"
	"undc-rsu/backend/internal/config"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/pkg/utils"
)

type AuthHandler struct {
	provider auth.Provider
	db       *gorm.DB
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{provider: auth.NewDBProvider(db, cfg), db: db}
}

// Login por correo + password (bcrypt contra RSU_Usuario)
// @Tags		Auth
// @Accept		json
// @Produce	json
// @Param		body body dto.LoginReq true "Credenciales"
// @Success	200 {object} dto.LoginResp "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "Credenciales inválidas"
// @Router		/api/v1/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	pr, err := h.provider.Login(req.Correo, req.Password)
	if err != nil {
		utils.Fail(c, 401, err.Error(), nil)
		return
	}
	utils.Success(c, dto.LoginResp{
		Token:      pr.Token,
		Rol:        pr.Rol,
		RolActor:   pr.RolActor,
		RolActorID: pr.RolActorID,
		TipoActor:  pr.TipoActor,
		ID:         pr.ID,
		PersonaID:  pr.PersonaID,
		Nombre:     pr.Nombre,
		Correo:     pr.Correo,
	}, "Login OK")
}

// Perfil del usuario autenticado. Permite validar la sesión al iniciar la app:
// si el token ya no es válido responde 401 y el frontend cierra sesión y vuelve al login.
// @Tags		Auth
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/auth/me [get]
func (h *AuthHandler) Me(c *gin.Context) {
	correo, _ := c.Get("correo")
	rolActor, _ := c.Get("rol_actor")
	var uid uint
	if v, ok := c.Get("user_id"); ok {
		if id, ok := v.(uint); ok {
			uid = id
		}
	}

	out := gin.H{
		"id":           uid,
		"correo":       correo,
		"rol_actor":    rolActor,
		"rol_actor_id": 0,
		"rol":          "",
		"nombre":       "",
		"persona_id":   0,
		"activo":       false,
	}

	if uid != 0 {
		var u domain.RSUUsuario
		if err := h.db.First(&u, "id_usuario = ?", uid).Error; err == nil {
			out["rol_actor"] = u.Rol
			out["rol"] = rolGlobalDe(u.Rol, u.TipoUsuario)
			out["nombre"] = nombreDe(h.db, u)
			out["activo"] = u.Activo
			var ra domain.RSURolActor
			if err := h.db.First(&ra, "codigo = ?", u.Rol).Error; err == nil {
				out["rol_actor_id"] = ra.ID
			}
			out["persona_id"] = personaIDDe(h.db, u)
		}
	}

	utils.Success(c, out, "OK")
}

func rolGlobalDe(rolActor, tipoUsuario string) string {
	switch {
	case rolActor == "ADMIN":
		return "ADMIN"
	case tipoUsuario == "ESTUDIANTE":
		return "ESTUDIANTE"
	case tipoUsuario == "DOCENTE":
		return "DOCENTE"
	default:
		return "DIRECTIVO"
	}
}

func personaIDDe(db *gorm.DB, u domain.RSUUsuario) uint {
	if u.IDPersona != nil && *u.IDPersona != 0 {
		return *u.IDPersona
	}
	switch u.TipoUsuario {
	case "DOCENTE":
		var d domain.Docente
		if err := db.First(&d, "correo_institucional = ?", u.Correo).Error; err == nil {
			return d.ID
		}
	case "ESTUDIANTE":
		var e domain.Estudiante
		if err := db.First(&e, "correo_institucional = ?", u.Correo).Error; err == nil {
			return e.ID
		}
	}
	return 0
}

func nombreDe(db *gorm.DB, u domain.RSUUsuario) string {
	if u.Nombre != "" {
		return u.Nombre
	}
	if u.TipoUsuario == "DOCENTE" {
		var d domain.Docente
		if err := db.First(&d, "correo_institucional = ?", u.Correo).Error; err == nil {
			return d.Nombres + " " + d.Apellidos
		}
	}
	if u.TipoUsuario == "ESTUDIANTE" {
		var e domain.Estudiante
		if err := db.First(&e, "correo_institucional = ?", u.Correo).Error; err == nil {
			return e.Nombres + " " + e.Apellidos
		}
	}
	return u.Correo
}