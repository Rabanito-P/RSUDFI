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

// RecalcularMontoEjecutado (HU-016): tras cada movimiento, el monto ejecutado
// del proyecto pasa a ser la suma de los movimientos tipo EJECUCION. Se hace
// dentro del repo para que la fórmula viva en un solo lugar; el porcentaje de
// avance no se toca aquí: lo mantiene el monitoreo (HU-018, R30).
func (r *PresupuestoRepo) RecalcularMontoEjecutado(idProyecto uint) error {
	var total float64
	if err := r.db.Model(&domain.RSUPresupuestoMovimiento{}).
		Select("COALESCE(SUM(monto), 0)").
		Where("id_proyecto = ? AND tipo = ?", idProyecto, "EJECUCION").
		Scan(&total).Error; err != nil {
		return err
	}
	return r.db.Model(&domain.RSUProyecto{}).
		Where("id_proyecto = ?", idProyecto).
		Update("monto_ejecutado", total).Error
}
