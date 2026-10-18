package domain

import (
	"time"
)

// ── MÓDULO 7: Flujo ───────────────────────────────────────────────

type RSUFlujoAprobacion struct {
	ID                  uint               `gorm:"primaryKey;column:id_flujo" json:"id_flujo"`
	IDProyecto          uint               `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDEstadoOrigen      uint               `gorm:"column:id_estado_origen" json:"id_estado_origen"`
	EstadoOrigen        *RSUEstadoProyecto `gorm:"foreignKey:IDEstadoOrigen" json:"estado_origen,omitempty"`
	IDEstadoDestino     uint               `gorm:"column:id_estado_destino" json:"id_estado_destino"`
	EstadoDestino       *RSUEstadoProyecto `gorm:"foreignKey:IDEstadoDestino" json:"estado_destino,omitempty"`
	IDRolActor          uint               `gorm:"column:id_rol_actor" json:"id_rol_actor"`
	RolActor            *RSURolActor       `gorm:"foreignKey:IDRolActor" json:"rol_actor,omitempty"`
	IDUsuario           uint               `gorm:"column:id_usuario" json:"id_usuario"`
	IDDocumentoSustento *uint              `gorm:"column:id_documento_sustento" json:"id_documento_sustento"`
	IDResolucion        *uint              `gorm:"column:id_resolucion" json:"id_resolucion"`
	FechaTransicion     time.Time          `gorm:"column:fecha_transicion" json:"fecha_transicion"`
	Comentarios         *string            `gorm:"column:comentarios" json:"comentarios"`
	Resultado           string             `gorm:"column:resultado" json:"resultado"`
}

func (RSUFlujoAprobacion) TableName() string { return "RSU_Flujo_Aprobacion" }

type RSUVerificacion struct {
	ID                uint      `gorm:"primaryKey;column:id_verificacion" json:"id_verificacion"`
	IDProyecto        uint      `gorm:"column:id_proyecto" json:"id_proyecto"`
	TipoVerificacion  string    `gorm:"column:tipo_verificacion" json:"tipo_verificacion"`
	IDVerificador     uint      `gorm:"column:id_verificador" json:"id_verificador"`
	IDRolVerificador  uint      `gorm:"column:id_rol_verificador" json:"id_rol_verificador"`
	FechaVerificacion time.Time `gorm:"column:fecha_verificacion" json:"fecha_verificacion"`
	Resultado         string    `gorm:"column:resultado" json:"resultado"`
	Observaciones     *string   `gorm:"column:observaciones" json:"observaciones"`
	IDDocumento       *uint     `gorm:"column:id_documento" json:"id_documento"`
}

func (RSUVerificacion) TableName() string { return "RSU_Verificacion" }
