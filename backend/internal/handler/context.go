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

// Roles de gestión: ven y actúan sobre cualquier proyecto de su ámbito.
var rolesGestion = map[string]bool{
	"ADMIN": true, "DIR_ESCUELA": true, "DIR_RS_FACULTAD": true, "DIR_CENTRAL_RS": true,
	"CONSEJO_FACULTAD": true, "DIR_DEPTO": true, "COMITE_PS": true, "COMITE_CALIDAD": true,
	"UNIDAD_ABAST": true,
}

// esGestion reporta si el token es de un rol de dirección/gestión.
func esGestion(c *gin.Context) bool {
	return rolesGestion[c.GetString("rol_actor")]
}

// puedeVerProyecto (control de acceso por objeto, OWASP A01): true si el
// usuario puede ver los archivos del proyecto — miembros del equipo, docente
// asesor o roles de gestión. Se usa en listados y descargas de archivos.
func puedeVerProyecto(db *gorm.DB, c *gin.Context, idProyecto uint) bool {
	if idProyecto == 0 {
		return false
	}
	if esGestion(c) {
		return true
	}
	u := usuarioDeToken(db, c)
	if u == nil || !u.Activo {
		return false
	}
	persona := personaIDFromToken(db, c)
	switch u.TipoUsuario {
	case "DOCENTE":
		var n int64
		db.Model(&domain.RSUProyecto{}).
			Where("id_proyecto = ? AND id_docente_asesor = ?", idProyecto, persona).Count(&n)
		return n > 0
	case "ESTUDIANTE":
		var n int64
		db.Model(&domain.RSUProyecto{}).
			Where("id_proyecto = ? AND id_estudiante_lider = ?", idProyecto, persona).Count(&n)
		if n > 0 {
			return true
		}
		db.Model(&domain.RSUParticipanteEstudiante{}).
			Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO')", idProyecto, persona).Count(&n)
		return n > 0
	}
	return false
}

// isPDF valida la extensión del archivo recibido.
func isPDF(name string) bool {
	return len(name) > 4 && name[len(name)-4:] == ".pdf"
}
