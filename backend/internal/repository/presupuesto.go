package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Presupuesto ──────────────────────────────────────────────

type PresupuestoRepo struct{ db *gorm.DB }

func NewPresupuestoRepo(db *gorm.DB) *PresupuestoRepo { return &PresupuestoRepo{db} }
func (r *PresupuestoRepo) CreateMov(m *domain.RSUPresupuestoMovimiento) error {
	return r.db.Create(m).Error
}
func (r *PresupuestoRepo) FindByProyecto(idProyecto uint) ([]domain.RSUPresupuestoMovimiento, error) {
	var list []domain.RSUPresupuestoMovimiento
	err := r.db.Where("id_proyecto = ?", idProyecto).Order("fecha DESC").Find(&list).Error
	return list, err
}
func (r *PresupuestoRepo) CreateVoucher(v *domain.RSUPagoVoucher) error { return r.db.Create(v).Error }
func (r *PresupuestoRepo) FindVouchers(idProyecto uint) ([]domain.RSUPagoVoucher, error) {
	var list []domain.RSUPagoVoucher
	err := r.db.Where("id_proyecto = ?", idProyecto).Order("fecha_pago DESC").Find(&list).Error
	return list, err
}
