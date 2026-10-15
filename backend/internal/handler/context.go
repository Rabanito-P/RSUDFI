package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// tokenUserID devuelve el id de usuario autenticado leído del JWT (claim user_id
// puesto en el contexto por AuthMiddleware). Es la única fuente confiable de
// identidad: nunca se debe aceptar un id que venga en el body o el form.
func tokenUserID(c *gin.Context) int {
	if v, ok := c.Get("user_id"); ok {
		switch t := v.(type) {
		case int:
			return t
		case int64:
			return int(t)
		case uint:
			return int(t)
		case uint64:
			return int(t)
		case float64:
			return int(t)
		case string:
			if n, err := strconv.Atoi(t); err == nil {
				return n
			}
		}
	}
	return 0
}

// personaIDFromToken resuelve el id de persona (Docente/Estudiante) dueña del
// token. RSU_Usuario.id es distinto de Docente.id/Estudiante.id: el vínculo real
// es RSU_Usuario.id_persona. Devuelve 0 cuando no se puede resolver.
// usuarioDeToken devuelve el RSUUsuario del token (o nil).
// La validación de membresía debe usar el tipo_usuario REAL del usuario, no
// adivinar por la persona: un docente con id_persona 2 colisiona con el
// estudiante 2 y recibía un 403 injustificado.
func usuarioDeToken(db *gorm.DB, c *gin.Context) *domain.RSUUsuario {
	uid := tokenUserID(c)
	if uid <= 0 || db == nil {
		return nil
	}
	var u domain.RSUUsuario
	if err := db.First(&u, "id_usuario = ?", uid).Error; err != nil {
		return nil
	}
	return &u
}

// esEstudianteToken reporta si el usuario del token es de tipo ESTUDIANTE.
func esEstudianteToken(db *gorm.DB, c *gin.Context) bool {
	u := usuarioDeToken(db, c)
	return u != nil && u.TipoUsuario == "ESTUDIANTE"
}

func personaIDFromToken(db *gorm.DB, c *gin.Context) int {
	uid := tokenUserID(c)
	if uid <= 0 || db == nil {
		return 0
	}
	var u domain.RSUUsuario
	if err := db.Select("id_persona").First(&u, "id_usuario = ?", uid).Error; err != nil {
		return 0
	}
	if u.IDPersona == nil {
		return 0
	}
	return int(*u.IDPersona)
	}

// isPDF valida la extensión del archivo recibido.
func isPDF(name string) bool {
	return len(name) > 4 && name[len(name)-4:] == ".pdf"
}
