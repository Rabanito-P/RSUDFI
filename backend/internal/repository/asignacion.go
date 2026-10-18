package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Asignaciones ─────────────────────────────────────────────

type AsignacionRepo struct{ db *gorm.DB }

func NewAsignacionRepo(db *gorm.DB) *AsignacionRepo { return &AsignacionRepo{db} }
func (r *AsignacionRepo) CreateDocente(a *domain.RSUAsignacionDocente) error {
	return r.db.Create(a).Error
}
func (r *AsignacionRepo) ListDocentesByProyecto(idProyecto uint) ([]domain.RSUAsignacionDocente, error) {
	var list []domain.RSUAsignacionDocente
	err := r.db.Preload("Docente").Where("id_proyecto = ?", idProyecto).Find(&list).Error
	return list, err
}
func (r *AsignacionRepo) CreateEstudiante(p *domain.RSUParticipanteEstudiante) error {
	return r.db.Create(p).Error
}
func (r *AsignacionRepo) ListEstudiantesByProyecto(idProyecto uint) ([]domain.RSUParticipanteEstudiante, error) {
	var list []domain.RSUParticipanteEstudiante
	err := r.db.Preload("Estudiante").Where("id_proyecto = ?", idProyecto).Find(&list).Error
	return list, err
}
func (r *AsignacionRepo) IsMiembro(idProyecto, idEstudiante uint) bool {
	var c int64
	r.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO')", idProyecto, idEstudiante).Count(&c)
	return c > 0
}
func (r *AsignacionRepo) CountActivosByProyecto(idProyecto uint) (int64, error) {
	var c int64
	err := r.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND estado_participacion IN ('INSCRITO','ACTIVO')", idProyecto).Count(&c).Error
	return c, err
}
