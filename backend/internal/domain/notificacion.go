package domain

import (
	"time"
)

// ── Notificaciones por rol (12 lanes BPMN) ────────────────────────
type RSUNotificacion struct {
	ID              uint      `gorm:"primaryKey;column:id_notificacion" json:"id_notificacion"`
	IDUsuario       *uint     `gorm:"column:id_usuario" json:"id_usuario"`
	RolDestino      string    `gorm:"column:rol_destino;size:50" json:"rol_destino"`
	Tipo            string    `gorm:"column:tipo;size:30" json:"tipo"`
	Titulo          string    `gorm:"column:titulo;size:200" json:"titulo"`
	Mensaje         *string   `gorm:"column:mensaje" json:"mensaje"`
	IDProyecto      *uint     `gorm:"column:id_proyecto" json:"id_proyecto"`
	Proyecto        *RSUProyecto `gorm:"foreignKey:IDProyecto" json:"proyecto,omitempty"`
	Leido           bool      `gorm:"column:leido;default:false" json:"leido"`
	CreatedAt       time.Time `gorm:"column:created_at" json:"created_at"`
}

func (RSUNotificacion) TableName() string { return "RSU_Notificacion" }
