package repository

import (
	"strings"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Facultad ─────────────────────────────────────────────────

type FacultadRepo struct{ db *gorm.DB }
func NewFacultadRepo(db *gorm.DB) *FacultadRepo { return &FacultadRepo{db} }
func (r *FacultadRepo) Create(f *domain.Facultad) error { return r.db.Create(f).Error }
func (r *FacultadRepo) FindAll(page, limit int, search string) ([]domain.Facultad, int64, error) {
	var items []domain.Facultad
	var total int64
	q := r.db.Model(&domain.Facultad{})
	if search != "" {
		like := "%" + strings.ReplaceAll(strings.ReplaceAll(search, "%", "\\%"), "_", "\\_") + "%"
		q = q.Where("nombre LIKE ? OR codigo LIKE ?", like, like)
	}
	q.Session(&gorm.Session{}).Count(&total)
	err := q.Preload("Decano").Offset((page-1)*limit).Limit(limit).Order("nombre ASC").Find(&items).Error
	return items, total, err
}
func (r *FacultadRepo) FindByID(id uint) (*domain.Facultad, error) {
	var f domain.Facultad
	err := r.db.Preload("Decano").First(&f, "id_facultad = ?", id).Error
	return &f, err
}
func (r *FacultadRepo) Update(f *domain.Facultad) error { return r.db.Save(f).Error }
func (r *FacultadRepo) Delete(id uint) error { return r.db.Delete(&domain.Facultad{}, "id_facultad = ?", id).Error }

