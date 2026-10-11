package domain

import (
	"time"
)

// ── Configuración (M11) — parámetros configurables (V1.1 §5.1) ──
type RSUConfiguracion struct {
	ID             uint      `gorm:"primaryKey;column:id_config" json:"id_config"`
	Clave          string    `gorm:"column:clave;unique" json:"clave"`
	Valor          string    `gorm:"column:valor" json:"valor"`
	Descripcion    *string   `gorm:"column:descripcion" json:"descripcion"`
	Tipo           string    `gorm:"column:tipo" json:"tipo"`           // STRING|INT|FLOAT|BOOL|LIST|JSON
	Ambito         string    `gorm:"column:ambito" json:"ambito"`       // GLOBAL|FACULTAD|ESCUELA
	IDFacultad     *uint     `gorm:"column:id_facultad" json:"id_facultad"`
	ActualizadoPor *uint     `gorm:"column:actualizado_por" json:"actualizado_por"`
	UpdatedAt      time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (RSUConfiguracion) TableName() string { return "RSU_Configuracion" }
