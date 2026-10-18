package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Ciclo ────────────────────────────────────────────────────

type CicloRepo struct{ db *gorm.DB }

func NewCicloRepo(db *gorm.DB) *CicloRepo                  { return &CicloRepo{db} }
func (r *CicloRepo) Create(c *domain.CicloAcademico) error { return r.db.Create(c).Error }
func (r *CicloRepo) FindAll() ([]domain.CicloAcademico, error) {
	var list []domain.CicloAcademico
	err := r.db.Order("fecha_inicio DESC").Find(&list).Error
	return list, err
}
func (r *CicloRepo) FindByID(id uint) (*domain.CicloAcademico, error) {
	var c domain.CicloAcademico
	err := r.db.First(&c, "id_ciclo = ?", id).Error
	return &c, err
}
func (r *CicloRepo) Active() (*domain.CicloAcademico, error) {
	var c domain.CicloAcademico
	err := r.db.First(&c, "activo = TRUE").Error
	return &c, err
}
