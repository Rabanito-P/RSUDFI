package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Catalogos ────────────────────────────────────────────────

type CatalogoRepo struct{ db *gorm.DB }

func NewCatalogoRepo(db *gorm.DB) *CatalogoRepo { return &CatalogoRepo{db} }
func (r *CatalogoRepo) TiposProyecto() ([]domain.RSUTipoProyecto, error) {
	var l []domain.RSUTipoProyecto
	err := r.db.Find(&l).Error
	return l, err
}
func (r *CatalogoRepo) LineasAccion() ([]domain.RSULineaAccion, error) {
	var l []domain.RSULineaAccion
	err := r.db.Find(&l).Error
	return l, err
}
func (r *CatalogoRepo) Estados() ([]domain.RSUEstadoProyecto, error) {
	var l []domain.RSUEstadoProyecto
	err := r.db.Order("orden_flujo ASC").Find(&l).Error
	return l, err
}
func (r *CatalogoRepo) RolesActor() ([]domain.RSURolActor, error) {
	var l []domain.RSURolActor
	err := r.db.Find(&l).Error
	return l, err
}
func (r *CatalogoRepo) TiposDocumento() ([]domain.RSUTipoDocumento, error) {
	var l []domain.RSUTipoDocumento
	err := r.db.Find(&l).Error
	return l, err
}
func (r *CatalogoRepo) Transiciones() ([]domain.RSUTransicionEstado, error) {
	var l []domain.RSUTransicionEstado
	err := r.db.Preload("RolActor").Find(&l).Error
	return l, err
}
func (r *CatalogoRepo) PreguntasEncuesta() ([]domain.RSUPreguntaEncuesta, error) {
	var l []domain.RSUPreguntaEncuesta
	err := r.db.Order("orden ASC").Find(&l).Error
	return l, err
}
