package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Documento / Resolucion ───────────────────────────────────

type DocumentoRepo struct{ db *gorm.DB }

func NewDocumentoRepo(db *gorm.DB) *DocumentoRepo            { return &DocumentoRepo{db} }
func (r *DocumentoRepo) Create(d *domain.RSUDocumento) error { return r.db.Create(d).Error }
func (r *DocumentoRepo) FindByProyecto(idProyecto uint) ([]domain.RSUDocumento, error) {
	var list []domain.RSUDocumento
	err := r.db.Preload("TipoDoc").Where("id_proyecto = ?", idProyecto).Order("fecha_subida DESC").Find(&list).Error
	return list, err
}
func (r *DocumentoRepo) FindByID(id uint) (*domain.RSUDocumento, error) {
	var d domain.RSUDocumento
	err := r.db.First(&d, "id_documento = ?", id).Error
	return &d, err
}
