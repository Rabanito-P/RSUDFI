package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Dashboard / Audit ────────────────────────────────────────

type DashboardRepo struct{ db *gorm.DB }
func NewDashboardRepo(db *gorm.DB) *DashboardRepo { return &DashboardRepo{db} }

func (r *DashboardRepo) CountProyectos() int64 { var c int64; r.db.Model(&domain.RSUProyecto{}).Count(&c); return c }
func (r *DashboardRepo) CountByEstado() ([]struct{ Estado string; Total int64; Color *string }, error) {
	type row struct{ Estado string; Total int64; Color *string }
	var rows []row
	// Postgres 18 con tablas quoted "RSU_Proyecto" / "RSU_Estado_Proyecto"
	err := r.db.Table("\"RSU_Proyecto\" p").
		Select("e.\"nombre\" as estado, COUNT(*) as total, e.\"color_ui\" as color").
		Joins("JOIN \"RSU_Estado_Proyecto\" e ON p.\"id_estado_actual\" = e.\"id_estado\"").
		Group("e.\"nombre\", e.\"color_ui\", e.\"orden_flujo\"").Order("e.\"orden_flujo\"").
		Scan(&rows).Error
	var out []struct{ Estado string; Total int64; Color *string }
	for _, x := range rows { out = append(out, struct{Estado string; Total int64; Color *string}{Estado: x.Estado, Total: x.Total, Color: x.Color}) }
	return out, err
}
func (r *DashboardRepo) CountByFacultad() ([]struct{ Facultad string; Total int64 }, error) {
	type row struct{ Facultad string; Total int64 }
	var rows []row
	err := r.db.Table("\"RSU_Proyecto\" p").
		Select("f.\"nombre\" as facultad, COUNT(*) as total").
		Joins("JOIN \"Escuela\" e ON p.\"id_escuela\" = e.\"id_escuela\"").
		Joins("JOIN \"Facultad\" f ON e.\"id_facultad\" = f.\"id_facultad\"").
		Group("f.\"nombre\"").Scan(&rows).Error
	var out []struct{ Facultad string; Total int64 }
	for _, x := range rows { out = append(out, struct{Facultad string; Total int64}{Facultad: x.Facultad, Total: x.Total}) }
	return out, err
}

