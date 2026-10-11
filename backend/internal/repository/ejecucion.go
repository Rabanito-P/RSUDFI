package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Actividad / Monitoreo / Entregables ──────────────────────

type ActividadRepo struct{ db *gorm.DB }
func NewActividadRepo(db *gorm.DB) *ActividadRepo { return &ActividadRepo{db} }
func (r *ActividadRepo) Create(a *domain.RSUActividadCampo) error { return r.db.Create(a).Error }
func (r *ActividadRepo) FindByProyecto(idProyecto uint) ([]domain.RSUActividadCampo, error) {
	var list []domain.RSUActividadCampo
	err := r.db.Preload("Fotos").Where("id_proyecto = ?", idProyecto).Order("fecha_programada ASC").Find(&list).Error
	return list, err
}
func (r *ActividadRepo) FindByID(id uint) (*domain.RSUActividadCampo, error) {
	var a domain.RSUActividadCampo
	err := r.db.Preload("Fotos").First(&a, "id_actividad = ?", id).Error
	return &a, err
}
func (r *ActividadRepo) Update(a *domain.RSUActividadCampo) error { return r.db.Save(a).Error }

type MonitoreoRepo struct{ db *gorm.DB }
func NewMonitoreoRepo(db *gorm.DB) *MonitoreoRepo { return &MonitoreoRepo{db} }
func (r *MonitoreoRepo) Create(m *domain.RSUMonitoreo) error { return r.db.Create(m).Error }
func (r *MonitoreoRepo) FindByProyecto(idProyecto uint) ([]domain.RSUMonitoreo, error) {
	var list []domain.RSUMonitoreo
	err := r.db.Where("id_proyecto = ?", idProyecto).Order("fecha_monitoreo DESC").Find(&list).Error
	return list, err
}

type EntregableRepo struct{ db *gorm.DB }
func NewEntregableRepo(db *gorm.DB) *EntregableRepo { return &EntregableRepo{db} }
func (r *EntregableRepo) Create(e *domain.RSUEntregable) error { return r.db.Create(e).Error }
func (r *EntregableRepo) FindByProyecto(idProyecto uint) ([]domain.RSUEntregable, error) {
	var list []domain.RSUEntregable
	err := r.db.Preload("Documento").Where("id_proyecto = ?", idProyecto).Order("orden ASC").Find(&list).Error
	return list, err
}
func (r *EntregableRepo) FindByProyectoOrden(idProyecto uint, orden int) (*domain.RSUEntregable, error) {
	var e domain.RSUEntregable
	err := r.db.Preload("Documento").First(&e, "id_proyecto = ? AND orden = ?", idProyecto, orden).Error
	return &e, err
}
func (r *EntregableRepo) FindByID(id uint) (*domain.RSUEntregable, error) {
	var e domain.RSUEntregable
	err := r.db.First(&e, "id_entregable = ?", id).Error
	return &e, err
}
func (r *EntregableRepo) Update(e *domain.RSUEntregable) error { return r.db.Save(e).Error }

