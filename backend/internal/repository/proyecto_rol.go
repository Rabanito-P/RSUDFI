package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Roles dinámicos por proyecto (V1.1 §1) ──────────────

type ProyectoRolRepo struct{ db *gorm.DB }
func NewProyectoRolRepo(db *gorm.DB) *ProyectoRolRepo { return &ProyectoRolRepo{db} }

func (r *ProyectoRolRepo) Create(pr *domain.RSUProyectoRol) error { return r.db.Create(pr).Error }
func (r *ProyectoRolRepo) FindByProyecto(idProyecto uint) ([]domain.RSUProyectoRol, error) {
	var list []domain.RSUProyectoRol
	err := r.db.Where("id_proyecto = ? AND activo = TRUE", idProyecto).Find(&list).Error
	return list, err
}
func (r *ProyectoRolRepo) FindByUsuario(tipoUsuario string, idUsuario uint) ([]domain.RSUProyectoRol, error) {
	var list []domain.RSUProyectoRol
	err := r.db.Where("tipo_usuario = ? AND id_usuario = ? AND activo = TRUE", tipoUsuario, idUsuario).Find(&list).Error
	return list, err
}
func (r *ProyectoRolRepo) RolDeUsuarioEnProyecto(idProyecto uint, tipoUsuario string, idUsuario uint) ([]string, error) {
	var roles []string
	err := r.db.Model(&domain.RSUProyectoRol{}).
		Where("id_proyecto = ? AND tipo_usuario = ? AND id_usuario = ? AND activo = TRUE", idProyecto, tipoUsuario, idUsuario).
		Pluck("rol_actor", &roles).Error
	return roles, err
}
func (r *ProyectoRolRepo) Delete(idProyecto uint, tipoUsuario string, idUsuario uint, rolActor string) error {
	return r.db.Where("id_proyecto = ? AND tipo_usuario = ? AND id_usuario = ? AND rol_actor = ?", idProyecto, tipoUsuario, idUsuario, rolActor).
		Delete(&domain.RSUProyectoRol{}).Error
}
func (r *ProyectoRolRepo) Existe(idProyecto uint, tipoUsuario string, idUsuario uint, rolActor string) bool {
	var c int64
	r.db.Model(&domain.RSUProyectoRol{}).
		Where("id_proyecto = ? AND tipo_usuario = ? AND id_usuario = ? AND rol_actor = ? AND activo = TRUE", idProyecto, tipoUsuario, idUsuario, rolActor).
		Count(&c)
	return c > 0
}

