package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Configuración (M11) ─────────────────────────────────

type ConfiguracionRepo struct{ db *gorm.DB }
func NewConfiguracionRepo(db *gorm.DB) *ConfiguracionRepo { return &ConfiguracionRepo{db} }

func (r *ConfiguracionRepo) FindAll(ambito string, idFacultad *uint) ([]domain.RSUConfiguracion, error) {
	var list []domain.RSUConfiguracion
	q := r.db.Model(&domain.RSUConfiguracion{})
	if ambito != "" {
		q = q.Where("ambito = ?", ambito)
	}
	if idFacultad != nil {
		q = q.Where("id_facultad = ? OR ambito = 'GLOBAL'", *idFacultad)
	}
	err := q.Order("clave ASC").Find(&list).Error
	return list, err
}
func (r *ConfiguracionRepo) GetByClave(clave string) (*domain.RSUConfiguracion, error) {
	var c domain.RSUConfiguracion
	err := r.db.Where("clave = ? AND ambito = 'GLOBAL'", clave).First(&c).Error
	return &c, err
}
func (r *ConfiguracionRepo) Valor(clave string) (string, error) {
	var v string
	err := r.db.Model(&domain.RSUConfiguracion{}).Where("clave = ? AND ambito = 'GLOBAL'", clave).Pluck("valor", &v).Error
	return v, err
}
func (r *ConfiguracionRepo) Upsert(c *domain.RSUConfiguracion) error {
	// upsert por clave+ambito+id_facultad
	var existing domain.RSUConfiguracion
	err := r.db.Where("clave = ? AND ambito = ? AND (id_facultad = ? OR (id_facultad IS NULL AND ? IS NULL))",
		c.Clave, c.Ambito, c.IDFacultad, c.IDFacultad).First(&existing).Error
	if err == nil {
		c.ID = existing.ID
		return r.db.Save(c).Error
	}
	return r.db.Create(c).Error
}
func (r *ConfiguracionRepo) Delete(id uint) error { return r.db.Delete(&domain.RSUConfiguracion{}, "id_config = ?", id).Error }

