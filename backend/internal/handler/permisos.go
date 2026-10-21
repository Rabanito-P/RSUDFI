package handler

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ─────────────────────────────────────────────────────────────────
// Autorización en dos capas (decisión del usuario)
// ─────────────────────────────────────────────────────────────────
//
//	Capa 1 · VER          RSU_Usuario_Permiso.activo.
//	                      Si el módulo no está habilitado, la ruta
//	                      responde 404: no se revela ni que exista.
//	                      Un estudiante al que el Administrador le
//	                      habilite un módulo entra y lo LEE.
//
//	Capa 2 · INTERACTUAR  el rol actor del token (rol_actor) contra
//	                      RSU_Transicion_Estado. Aunque tenga el módulo
//	                      habilitado, ninguna escritura le corresponde
//	                      si su rol no es elACTOR de esa transición.
//
// Los roles dinámicos por proyecto (RSU_Proyecto_Rol) se suman a la capa 2:
// un docente colaborador o un ejecutor con rol asignado en ese proyecto.

// esDocenteToken indica si el token corresponde a un docente.
func esDocenteToken(db *gorm.DB, c *gin.Context) bool {
	u := usuarioDeToken(db, c)
	return u != nil && u.TipoUsuario == "DOCENTE"
}

// puedeVerificarEntregable indica si quien llama puede aprobar u observar un
// entregable: el docente asesor/responsable del proyecto, un docente con rol
// dinámico en ese proyecto, o cualquier rol de gestión.
//
// El estudiante que sube el entregable NO puede aprobarlo aunque tenga el
// módulo 'entregables' habilitado: esa es la capa 2, la del rol.
func puedeVerificarEntregable(db *gorm.DB, c *gin.Context, idProyecto uint) bool {
	if esGestion(c) {
		return true
	}
	if !esDocenteToken(db, c) {
		return false
	}
	persona := personaIDFromToken(db, c)
	if idProyecto == 0 || persona == 0 {
		return false
	}
	var n int64
	db.Model(&domain.RSUProyecto{}).
		Where("id_proyecto = ? AND id_docente_asesor = ?", idProyecto, persona).Count(&n)
	if n > 0 {
		return true
	}
	// Rol dinámico dentro del proyecto (docente colaborador, apoyo...).
	// RSU_Proyecto_Rol se identifica por (id_proyecto, id_usuario, tipo_usuario).
	db.Model(&domain.RSUProyectoRol{}).
		Where(`id_proyecto = ? AND activo = true AND tipo_usuario = ? AND id_usuario = ?`,
			idProyecto, "DOCENTE", tokenUserID(c)).Count(&n)
	return n > 0
}

// puedeEditarEvidencias (R33/R46, fase de ejecución): escribir actividades de
// campo, fotos o asistencia exige ser miembro ACTIVO/INSCRITO del equipo, el
// docente asesor del proyecto (o un docente con rol dinámico RSU_Proyecto_Rol)
// o un rol de gestión. Es la capa 2 de autorización: el módulo habilitado
// (capa 1) por sí solo no basta para escribir en proyectos ajenos.
func puedeEditarEvidencias(db *gorm.DB, c *gin.Context, idProyecto uint) bool {
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
		return puedeVerificarEntregable(db, c, idProyecto)
	case "ESTUDIANTE":
		var n int64
		// Líder del proyecto.
		db.Model(&domain.RSUProyecto{}).
			Where("id_proyecto = ? AND id_estudiante_lider = ?", idProyecto, persona).Count(&n)
		if n > 0 {
			return true
		}
		// Participante inscrito o activo (un EXPULSADO ya no registra).
		db.Model(&domain.RSUParticipanteEstudiante{}).
			Where(`id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO')`,
				idProyecto, persona).Count(&n)
		return n > 0
	}
	return false
}

// uintPtrU devuelve un *uint o nil cuando el valor es 0, para no persistir
// un id de persona inexistente en lugar de NULL.
func uintPtrU(n int) *uint {
	if n == 0 {
		return nil
	}
	v := uint(n)
	return &v
}
