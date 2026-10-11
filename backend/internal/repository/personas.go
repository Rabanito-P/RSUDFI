package repository

import (
	"strings"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Docente / Estudiante ─────────────────────────────────────

type DocenteRepo struct{ db *gorm.DB }
func NewDocenteRepo(db *gorm.DB) *DocenteRepo { return &DocenteRepo{db} }
func (r *DocenteRepo) Create(d *domain.Docente) error { return r.db.Create(d).Error }
func (r *DocenteRepo) FindAll(page, limit int, search string) ([]domain.Docente, int64, error) {
	var items []domain.Docente
	var total int64
	q := r.db.Model(&domain.Docente{})
	if search != "" {
		like := "%" + strings.ReplaceAll(strings.ReplaceAll(search, "%", "\\%"), "_", "\\_") + "%"
		q = q.Where("nombres LIKE ? OR apellidos LIKE ? OR dni LIKE ?", like, like, like)
	}
	q.Session(&gorm.Session{}).Count(&total)
	err := q.Preload("Escuela").Offset((page-1)*limit).Limit(limit).Order("apellidos ASC").Find(&items).Error
	return items, total, err
}
func (r *DocenteRepo) FindByID(id uint) (*domain.Docente, error) {
	var d domain.Docente
	err := r.db.Preload("Escuela").First(&d, "id_docente = ?", id).Error
	return &d, err
}
func (r *DocenteRepo) HorasAsignadas(idDocente, idCiclo uint) (float64, error) {
	var total *float64
	err := r.db.Model(&domain.RSUAsignacionDocente{}).
		Select("COALESCE(SUM(horas_asignadas),0)").
		Where("id_docente = ? AND id_ciclo = ? AND estado_asignacion = 'APROBADA'", idDocente, idCiclo).
		Scan(&total).Error
	if total == nil {
		return 0, err
	}
	return *total, err
}

type EstudianteRepo struct{ db *gorm.DB }
func NewEstudianteRepo(db *gorm.DB) *EstudianteRepo { return &EstudianteRepo{db} }
func (r *EstudianteRepo) Create(e *domain.Estudiante) error { return r.db.Create(e).Error }
func (r *EstudianteRepo) FindAll(page, limit int, search string) ([]domain.Estudiante, int64, error) {
	var items []domain.Estudiante
	var total int64
	q := r.db.Model(&domain.Estudiante{})
	if search != "" {
		like := "%" + strings.ReplaceAll(strings.ReplaceAll(search, "%", "\\%"), "_", "\\_") + "%"
		q = q.Where("nombres LIKE ? OR apellidos LIKE ? OR dni LIKE ?", like, like, like)
	}
	q.Session(&gorm.Session{}).Count(&total)
	err := q.Preload("Escuela").Offset((page-1)*limit).Limit(limit).Order("apellidos ASC").Find(&items).Error
	return items, total, err
}
func (r *EstudianteRepo) FindByID(id uint) (*domain.Estudiante, error) {
	var e domain.Estudiante
	err := r.db.Preload("Escuela").First(&e, "id_estudiante = ?", id).Error
	return &e, err
}
func (r *EstudianteRepo) GetCicloNumerico(idEstudiante, idCiclo uint) (int, error) {
	var ec domain.EstudianteCiclo
	err := r.db.First(&ec, "id_estudiante = ? AND id_ciclo = ?", idEstudiante, idCiclo).Error
	if err != nil {
		return 0, err
	}
	return ec.CicloNumerico, nil
}

