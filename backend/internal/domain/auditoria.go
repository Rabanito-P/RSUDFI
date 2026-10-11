package domain

import (
	"time"
)

type RSUAuditoriaLog struct {
	ID                uint       `gorm:"primaryKey;column:id_log" json:"id_log"`
	IDUsuario         uint       `gorm:"column:id_usuario" json:"id_usuario"`
	IDProyecto        *uint      `gorm:"column:id_proyecto" json:"id_proyecto"`
	Accion            string     `gorm:"column:accion" json:"accion"`
	TablaAfectada     *string    `gorm:"column:tabla_afectada" json:"tabla_afectada"`
	IDRegistroAfectado *uint     `gorm:"column:id_registro_afectado" json:"id_registro_afectado"`
	ValorAnterior     *string    `gorm:"column:valor_anterior" json:"valor_anterior"`
	ValorNuevo        *string    `gorm:"column:valor_nuevo" json:"valor_nuevo"`
	IPOrigen          *string    `gorm:"column:ip_origen" json:"ip_origen"`
	FechaHora         time.Time  `gorm:"column:fecha_hora" json:"fecha_hora"`
}

func (RSUAuditoriaLog) TableName() string { return "RSU_Auditoria_Log" }
