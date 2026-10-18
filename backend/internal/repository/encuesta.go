package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Encuestas / Indicadores ──────────────────────────────────

type EncuestaRepo struct{ db *gorm.DB }

func NewEncuestaRepo(db *gorm.DB) *EncuestaRepo { return &EncuestaRepo{db} }
func (r *EncuestaRepo) CreateEncuesta(e *domain.RSUEncuestaBeneficiario) error {
	return r.db.Create(e).Error
}
func (r *EncuestaRepo) CreateRespuesta(resp *domain.RSURespuestaEncuesta) error {
	return r.db.Create(resp).Error
}
func (r *EncuestaRepo) FindByProyecto(idProyecto uint) ([]domain.RSUEncuestaBeneficiario, error) {
	var list []domain.RSUEncuestaBeneficiario
	err := r.db.Preload("Beneficiario").
		// Las respuestas y su pregunta permiten calcular el promedio por cada
		// una de las dimensiones del indicador.
		Preload("Respuestas.Pregunta").
		Where("id_proyecto = ?", idProyecto).
		Order("fecha_aplicacion DESC").
		Find(&list).Error
	return list, err
}
func (r *EncuestaRepo) FindRespuestas(idEncuesta uint) ([]domain.RSURespuestaEncuesta, error) {
	var list []domain.RSURespuestaEncuesta
	err := r.db.Preload("Pregunta").Where("id_encuesta_benef = ?", idEncuesta).Find(&list).Error
	return list, err
}
func (r *EncuestaRepo) PromedioProyecto(idProyecto uint) (*float64, error) {
	var avg *float64
	err := r.db.Model(&domain.RSUEncuestaBeneficiario{}).Select("AVG(promedio_general)").Where("id_proyecto = ?", idProyecto).Scan(&avg).Error
	return avg, err
}

type IndicadorRepo struct{ db *gorm.DB }

func NewIndicadorRepo(db *gorm.DB) *IndicadorRepo                   { return &IndicadorRepo{db} }
func (r *IndicadorRepo) Create(i *domain.RSUIndicadorImpacto) error { return r.db.Create(i).Error }
func (r *IndicadorRepo) FindByProyecto(idProyecto uint) ([]domain.RSUIndicadorImpacto, error) {
	var list []domain.RSUIndicadorImpacto
	err := r.db.Where("id_proyecto = ?", idProyecto).Find(&list).Error
	return list, err
}
func (r *IndicadorRepo) Update(i *domain.RSUIndicadorImpacto) error { return r.db.Save(i).Error }
