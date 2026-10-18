package repository

import (
	"time"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Justificación de faltas (HU-014) ──

type JustificacionRepo struct{ db *gorm.DB }

func NewJustificacionRepo(db *gorm.DB) *JustificacionRepo { return &JustificacionRepo{db: db} }

// Create registra la justificación; el estado inicial siempre es PENDIENTE.
func (r *JustificacionRepo) Create(j *domain.RSUJustificacionFalta) error {
	j.Estado = "PENDIENTE"
	return r.db.Create(j).Error
}

// ByEstudiante lista las justificaciones de un estudiante con actividad incluida.
func (r *JustificacionRepo) ByEstudiante(idEstudiante uint) ([]domain.RSUJustificacionFalta, error) {
	var list []domain.RSUJustificacionFalta
	err := r.db.Preload("Actividad").
		Where("id_estudiante = ?", idEstudiante).
		Order("fecha_ausencia DESC, id_justificacion DESC").
		Find(&list).Error
	return list, err
}

// CountActivas cuenta las justificaciones PENDIENTE/REVISADO (las que ocupan cupo).
// R11: máximo 2 por estudiante.
func (r *JustificacionRepo) CountActivas(idEstudiante uint) (int64, error) {
	var n int64
	err := r.db.Model(&domain.RSUJustificacionFalta{}).
		Where("id_estudiante = ? AND estado IN ('PENDIENTE','REVISADO')", idEstudiante).
		Count(&n).Error
	return n, err
}

func (r *JustificacionRepo) FindByID(id uint) (*domain.RSUJustificacionFalta, error) {
	var j domain.RSUJustificacionFalta
	if err := r.db.Preload("Actividad").First(&j, "id_justificacion = ?", id).Error; err != nil {
		return nil, err
	}
	return &j, nil
}

// UpdateEstado cambia el estado, verificador y observaciones.
func (r *JustificacionRepo) UpdateEstado(id uint, estado string, idVerificador *uint, obs *string) error {
	upd := map[string]any{
		"estado":             estado,
		"id_verificador":     idVerificador,
		"observaciones":      obs,
		"fecha_verificacion": time.Now(),
	}
	return r.db.Model(&domain.RSUJustificacionFalta{}).Where("id_justificacion = ?", id).Updates(upd).Error
}

// ── Modificación de informe (HU-015) ──

type ModificacionRepo struct{ db *gorm.DB }

func NewModificacionRepo(db *gorm.DB) *ModificacionRepo { return &ModificacionRepo{db: db} }

func (r *ModificacionRepo) Create(m *domain.RSUModificacionInforme) error {
	m.Estado = "PENDIENTE"
	if m.FechaSolicitud.IsZero() {
		m.FechaSolicitud = time.Now()
	}
	return r.db.Create(m).Error
}

func (r *ModificacionRepo) ByProyecto(idProyecto uint) ([]domain.RSUModificacionInforme, error) {
	var list []domain.RSUModificacionInforme
	err := r.db.Preload("Documento").
		Where("id_proyecto = ?", idProyecto).
		Order("fecha_solicitud DESC, id_modificacion DESC").
		Find(&list).Error
	return list, err
}

func (r *ModificacionRepo) FindByID(id uint) (*domain.RSUModificacionInforme, error) {
	var m domain.RSUModificacionInforme
	if err := r.db.Preload("Documento").First(&m, "id_modificacion = ?", id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *ModificacionRepo) UpdateEstado(id uint, estado string, idVerificador *uint, obs *string) error {
	upd := map[string]any{
		"estado":             estado,
		"id_verificador":     idVerificador,
		"observaciones":      obs,
		"fecha_verificacion": time.Now(),
	}
	return r.db.Model(&domain.RSUModificacionInforme{}).Where("id_modificacion = ?", id).Updates(upd).Error
}
