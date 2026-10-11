package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Comité RSU (M04) ────────────────────────────────────

type ComiteRSURepo struct{ db *gorm.DB }
func NewComiteRSURepo(db *gorm.DB) *ComiteRSURepo { return &ComiteRSURepo{db} }

func (r *ComiteRSURepo) Create(c *domain.RSUComiteRSU) error { return r.db.Create(c).Error }
func (r *ComiteRSURepo) FindByEscuela(idEscuela uint) ([]domain.RSUComiteRSU, error) {
	var list []domain.RSUComiteRSU
	err := r.db.Preload("Docente").Preload("Escuela").Where("id_escuela = ? AND estado = 'ACTIVO'", idEscuela).Order("fecha_designacion DESC").Find(&list).Error
	return list, err
}
func (r *ComiteRSURepo) PresidenteDeEscuela(idEscuela uint) (*domain.RSUComiteRSU, error) {
	var c domain.RSUComiteRSU
	err := r.db.Preload("Docente").Where("id_escuela = ? AND es_presidente = TRUE AND estado = 'ACTIVO'", idEscuela).
		Order("fecha_designacion DESC").First(&c).Error
	return &c, err
}
func (r *ComiteRSURepo) Delete(id uint) error { return r.db.Delete(&domain.RSUComiteRSU{}, "id_comite = ?", id).Error }

