package domain

import (
	"time"
)

// ── Comité RSU (M04) — designación por Decano, período 2 años ──
type RSUComiteRSU struct {
	ID                      uint      `gorm:"primaryKey;column:id_comite" json:"id_comite"`
	IDEscuela               uint      `gorm:"column:id_escuela" json:"id_escuela"`
	Escuela                 *Escuela  `gorm:"foreignKey:IDEscuela" json:"escuela,omitempty"`
	IDDocente               uint      `gorm:"column:id_docente" json:"id_docente"`
	Docente                 *Docente  `gorm:"foreignKey:IDDocente" json:"docente,omitempty"`
	EsPresidente            bool      `gorm:"column:es_presidente" json:"es_presidente"`
	PeriodoInicio           string    `gorm:"column:periodo_inicio" json:"periodo_inicio"`
	PeriodoFin              string    `gorm:"column:periodo_fin" json:"periodo_fin"`
	IDResolucionDesignacion *uint     `gorm:"column:id_resolucion_designacion" json:"id_resolucion_designacion"`
	Estado                  string    `gorm:"column:estado" json:"estado"` // ACTIVO|INACTIVO
	FechaDesignacion        time.Time `gorm:"column:fecha_designacion" json:"fecha_designacion"`
	DesignadoPor            *uint     `gorm:"column:designado_por" json:"designado_por"`
}

func (RSUComiteRSU) TableName() string { return "RSU_Comite_RSU" }
