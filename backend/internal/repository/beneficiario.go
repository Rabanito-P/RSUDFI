package repository

import (
	"strings"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Beneficiario ─────────────────────────────────────────────

type BeneficiarioRepo struct{ db *gorm.DB }
func NewBeneficiarioRepo(db *gorm.DB) *BeneficiarioRepo { return &BeneficiarioRepo{db} }
func (r *BeneficiarioRepo) Create(b *domain.RSUBeneficiario) error { return r.db.Create(b).Error }
func (r *BeneficiarioRepo) FindAll(page, limit int, search string) ([]domain.RSUBeneficiario, int64, error) {
	var items []domain.RSUBeneficiario
	var total int64
	q := r.db.Model(&domain.RSUBeneficiario{})
	if search != "" {
		like := "%" + strings.ReplaceAll(strings.ReplaceAll(search, "%", "\\%"), "_", "\\_") + "%"
		q = q.Where("nombres LIKE ? OR apellidos LIKE ? OR dni LIKE ? OR razon_social LIKE ?", like, like, like, like)
	}
	q.Session(&gorm.Session{}).Count(&total)
	err := q.Offset((page-1)*limit).Limit(limit).Order("fecha_registro DESC").Find(&items).Error
	return items, total, err
}
func (r *BeneficiarioRepo) FindByID(id uint) (*domain.RSUBeneficiario, error) {
	var b domain.RSUBeneficiario
	err := r.db.First(&b, "id_beneficiario = ?", id).Error
	return &b, err
}
func (r *BeneficiarioRepo) Update(b *domain.RSUBeneficiario) error { return r.db.Save(b).Error }
func (r *BeneficiarioRepo) Vincular(pb *domain.RSUProyectoBeneficiario) error { return r.db.Create(pb).Error }
func (r *BeneficiarioRepo) ListByProyecto(idProyecto uint) ([]domain.RSUProyectoBeneficiario, error) {
	var list []domain.RSUProyectoBeneficiario
	err := r.db.Preload("Beneficiario").Where("id_proyecto = ? AND activo = TRUE", idProyecto).Find(&list).Error
	return list, err
}
func (r *BeneficiarioRepo) ExistsVinculo(idProyecto, idBeneficiario uint) bool {
	var c int64
	r.db.Model(&domain.RSUProyectoBeneficiario{}).Where("id_proyecto = ? AND id_beneficiario = ?", idProyecto, idBeneficiario).Count(&c)
	return c > 0
}

