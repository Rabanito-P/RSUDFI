package domain

import (
	"time"
)

// ── MÓDULO 9: Presupuesto ─────────────────────────────────────────

type RSUPresupuestoMovimiento struct {
	ID            uint      `gorm:"primaryKey;column:id_movimiento" json:"id_movimiento"`
	IDProyecto    uint      `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDFacultad    uint      `gorm:"column:id_facultad" json:"id_facultad"`
	Tipo          string    `gorm:"column:tipo" json:"tipo"`
	Monto         float64   `gorm:"column:monto" json:"monto"`
	Fecha         time.Time `gorm:"column:fecha" json:"fecha"`
	Observaciones *string   `gorm:"column:observaciones" json:"observaciones"`
	// Auditoría del registro: la columna es NOT NULL en BD, debe salir del token.
	IDUsuarioRegistro *uint `gorm:"column:id_usuario_registro" json:"id_usuario_registro"`
}

func (RSUPresupuestoMovimiento) TableName() string { return "RSU_Presupuesto_Movimiento" }

type RSUPagoVoucher struct {
	ID              uint      `gorm:"primaryKey;column:id_pago" json:"id_pago"`
	IDProyecto      uint      `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDFacultad      uint      `gorm:"column:id_facultad" json:"id_facultad"`
	Monto           float64   `gorm:"column:monto" json:"monto"`
	FechaPago       time.Time `gorm:"column:fecha_pago" json:"fecha_pago"`
	NumeroOperacion *string   `gorm:"column:numero_operacion" json:"numero_operacion"`
	Banco           *string   `gorm:"column:banco" json:"banco"`
	Estado          string    `gorm:"column:estado" json:"estado"`
}

func (RSUPagoVoucher) TableName() string { return "RSU_Pago_Voucher" }
