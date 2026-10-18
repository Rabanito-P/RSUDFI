package domain

import "time"

type RSUSolicitudConstancia struct {
	ID             uint          `gorm:"primaryKey;column:id_solicitud" json:"id_solicitud"`
	IDProyecto     uint          `gorm:"column:id_proyecto" json:"id_proyecto"`
	Proyecto       *RSUProyecto  `gorm:"foreignKey:IDProyecto" json:"proyecto,omitempty"`
	IDEstudiante   uint          `gorm:"column:id_estudiante" json:"id_estudiante"`
	Estudiante     *Estudiante   `gorm:"foreignKey:IDEstudiante" json:"estudiante,omitempty"`
	TipoConstancia string        `gorm:"column:tipo_constancia" json:"tipo_constancia"`
	FechaSolicitud time.Time     `gorm:"column:fecha_solicitud" json:"fecha_solicitud"`
	Estado         string        `gorm:"column:estado" json:"estado"`
	IDDocumento    *uint         `gorm:"column:id_documento_emitido" json:"id_documento_emitido"`
	Documento      *RSUDocumento `gorm:"foreignKey:IDDocumento" json:"documento,omitempty"`
	FechaEmision   *time.Time    `gorm:"column:fecha_emision" json:"fecha_emision"`
}

func (RSUSolicitudConstancia) TableName() string { return "RSU_Solicitud_Constancia" }
