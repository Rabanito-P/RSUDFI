package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Solicitudes de constancia (RSU_Solicitud_Constancia) ──────

type ConstanciaRepo struct{ db *gorm.DB }
func NewConstanciaRepo(db *gorm.DB) *ConstanciaRepo { return &ConstanciaRepo{db} }

func (r *ConstanciaRepo) Create(s *domain.RSUSolicitudConstancia) error { return r.db.Create(s).Error }

func (r *ConstanciaRepo) FindByEstudiante(idEstudiante uint) ([]domain.RSUSolicitudConstancia, error) {
	var list []domain.RSUSolicitudConstancia
	err := r.db.
		Preload("Proyecto").
		Preload("Estudiante").
		Preload("Documento").
		Where("id_estudiante = ?", idEstudiante).
		Order("fecha_solicitud DESC").
		Find(&list).Error
	return list, err
}

func (r *ConstanciaRepo) ExistePendiente(idProyecto, idEstudiante uint, tipo string) bool {
	var c int64
	r.db.Model(&domain.RSUSolicitudConstancia{}).
		Where("id_proyecto = ? AND id_estudiante = ? AND tipo_constancia = ? AND estado != 'RECHAZADA'", idProyecto, idEstudiante, tipo).
		Count(&c)
	return c > 0
}
