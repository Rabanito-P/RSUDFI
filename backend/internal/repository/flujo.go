package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Flujo ────────────────────────────────────────────────────

type FlujoRepo struct{ db *gorm.DB }

func NewFlujoRepo(db *gorm.DB) *FlujoRepo                      { return &FlujoRepo{db} }
func (r *FlujoRepo) Create(f *domain.RSUFlujoAprobacion) error { return r.db.Create(f).Error }
func (r *FlujoRepo) History(idProyecto uint) ([]domain.RSUFlujoAprobacion, error) {
	var list []domain.RSUFlujoAprobacion
	err := r.db.Preload("EstadoOrigen").Preload("EstadoDestino").Preload("RolActor").
		Where("id_proyecto = ?", idProyecto).Order("fecha_transicion ASC").Find(&list).Error
	return list, err
}
func (r *FlujoRepo) ValidTransicion(origen, destino, rolActor uint) (bool, error) {
	var c int64
	err := r.db.Model(&domain.RSUTransicionEstado{}).
		Where("estado_origen = ? AND estado_destino = ? AND id_rol_actor = ?", origen, destino, rolActor).Count(&c).Error
	return c > 0, err
}

// DestinosValidos devuelve los estados destino permitidos para (origen, rolActor)
// ordenados por el flujo (orden_flujo del estado destino).
func (r *FlujoRepo) DestinosValidos(origen, rolActor uint) ([]string, error) {
	var codigos []string
	err := r.db.Model(&domain.RSUTransicionEstado{}).
		Joins("JOIN \"RSU_Estado_Proyecto\" e ON e.\"id_estado\" = \"RSU_Transicion_Estado\".\"estado_destino\"").
		Where("\"RSU_Transicion_Estado\".\"estado_origen\" = ? AND \"RSU_Transicion_Estado\".\"id_rol_actor\" = ?", origen, rolActor).
		Order("e.\"orden_flujo\" ASC").
		Pluck("e.\"codigo\"", &codigos).Error
	return codigos, err
}

// ResolverEstadoCodigo traduce el código de estado a su id.
func (r *FlujoRepo) ResolverEstadoCodigo(codigo string) (uint, error) {
	var e domain.RSUEstadoProyecto
	if err := r.db.First(&e, "codigo = ?", codigo).Error; err != nil {
		return 0, err
	}
	return e.ID, nil
}
