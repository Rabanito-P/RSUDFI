package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Escuela ──────────────────────────────────────────────────

type EscuelaRepo struct{ db *gorm.DB }
func NewEscuelaRepo(db *gorm.DB) *EscuelaRepo { return &EscuelaRepo{db} }
func (r *EscuelaRepo) Create(e *domain.Escuela) error { return r.db.Create(e).Error }
func (r *EscuelaRepo) FindAll(page, limit int, idFacultad *uint) ([]domain.Escuela, int64, error) {
	var items []domain.Escuela
	var total int64
	q := r.db.Model(&domain.Escuela{})
	if idFacultad != nil {
		q = q.Where("id_facultad = ?", *idFacultad)
	}
	q.Session(&gorm.Session{}).Count(&total)
	err := q.Preload("Facultad").Preload("Director").Offset((page-1)*limit).Limit(limit).Order("nombre ASC").Find(&items).Error
	return items, total, err
}
func (r *EscuelaRepo) FindByID(id uint) (*domain.Escuela, error) {
	var e domain.Escuela
	err := r.db.Preload("Facultad").Preload("Director").First(&e, "id_escuela = ?", id).Error
	return &e, err
}
func (r *EscuelaRepo) Update(e *domain.Escuela) error { return r.db.Save(e).Error }
func (r *EscuelaRepo) Delete(id uint) error { return r.db.Delete(&domain.Escuela{}, "id_escuela = ?", id).Error }

