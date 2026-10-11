package domain

import "time"

// ── MÓDULO 2: Justificación de faltas (HU-014, R11: máx 2 por estudiante) ──

type RSUJustificacionFalta struct {
	ID                 uint       `gorm:"primaryKey;column:id_justificacion" json:"id_justificacion"`
	IDActividad        uint       `gorm:"column:id_actividad" json:"id_actividad"`
	IDEstudiante       uint       `gorm:"column:id_estudiante" json:"id_estudiante"`
	FechaAusencia      time.Time  `gorm:"column:fecha_ausencia" json:"fecha_ausencia"`
	HoraInicioActividad *string   `gorm:"column:hora_inicio_actividad" json:"hora_inicio_actividad,omitempty"`
	HoraFinActividad   *string    `gorm:"column:hora_fin_actividad" json:"hora_fin_actividad,omitempty"`
	Motivo             string     `gorm:"column:motivo" json:"motivo"`
	IDDocumentoEvidencia *uint    `gorm:"column:id_documento_evidencia" json:"id_documento_evidencia,omitempty"`
	Estado             string     `gorm:"column:estado" json:"estado"`
	IDVerificador      *uint      `gorm:"column:id_verificador" json:"id_verificador,omitempty"`
	FechaVerificacion  *time.Time `gorm:"column:fecha_verificacion" json:"fecha_verificacion,omitempty"`
	Observaciones      *string    `gorm:"column:observaciones" json:"observaciones,omitempty"`

	// Relaciones de lectura (no persisten columnas)
	Actividad  *RSUActividadCampo `gorm:"foreignKey:IDActividad" json:"actividad,omitempty"`
	Estudiante *Estudiante        `gorm:"foreignKey:IDEstudiante" json:"estudiante,omitempty"`
}

func (RSUJustificacionFalta) TableName() string { return "RSU_Justificacion_Falta" }

// ── MÓDULO 2: Modificación de informe (HU-015) ──

type RSUModificacionInforme struct {
	ID                 uint      `gorm:"primaryKey;column:id_modificacion" json:"id_modificacion"`
	IDProyecto         uint      `gorm:"column:id_proyecto" json:"id_proyecto"`
	Motivo             string    `gorm:"column:motivo" json:"motivo"`
	IDDocumentoSolicitud *uint   `gorm:"column:id_documento_solicitud" json:"id_documento_solicitud,omitempty"`
	FechaSolicitud     time.Time `gorm:"column:fecha_solicitud" json:"fecha_solicitud"`
	Estado             string    `gorm:"column:estado" json:"estado"`
	IDVerificador      *uint     `gorm:"column:id_verificador" json:"id_verificador,omitempty"`
	FechaVerificacion  *time.Time `gorm:"column:fecha_verificacion" json:"fecha_verificacion,omitempty"`
	Observaciones      *string   `gorm:"column:observaciones" json:"observaciones,omitempty"`

	Proyecto  *RSUProyecto  `gorm:"foreignKey:IDProyecto" json:"proyecto,omitempty"`
	Documento *RSUDocumento `gorm:"foreignKey:IDDocumentoSolicitud" json:"documento,omitempty"`
}

func (RSUModificacionInforme) TableName() string { return "RSU_Modificacion_Informe" }
