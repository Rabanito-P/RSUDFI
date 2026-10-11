package domain

import (
	"time"
)

// ── MÓDULO 8: Ejecución ───────────────────────────────────────────

type RSUActividadCampo struct {
	ID              uint       `gorm:"primaryKey;column:id_actividad" json:"id_actividad"`
	IDProyecto      uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDEntregable    *uint      `gorm:"column:id_entregable" json:"id_entregable"`
	Nombre          string     `gorm:"column:nombre" json:"nombre"`
	Descripcion     *string    `gorm:"column:descripcion" json:"descripcion"`
	FechaProgramada *time.Time `gorm:"column:fecha_programada" json:"fecha_programada"`
	FechaEjecucion  *time.Time `gorm:"column:fecha_ejecucion" json:"fecha_ejecucion"`
	HoraInicio      *string    `gorm:"column:hora_inicio" json:"hora_inicio"`
	HoraFin         *string    `gorm:"column:hora_fin" json:"hora_fin"`
	Minutos         int        `gorm:"column:minutos" json:"minutos"`
	Lugar           *string    `gorm:"column:lugar" json:"lugar"`
	Estado          string     `gorm:"column:estado" json:"estado"`
	NroBeneficiarios int       `gorm:"column:nro_beneficiarios" json:"nro_beneficiarios"`
	Fotos           []RSUActividadFoto `gorm:"foreignKey:IDActividad" json:"fotos,omitempty"`
}

func (RSUActividadCampo) TableName() string { return "RSU_Actividad_Campo" }

type RSUActividadFoto struct {
	ID                  uint       `gorm:"primaryKey;column:id_foto" json:"id_foto"`
	IDActividad         uint       `gorm:"column:id_actividad" json:"id_actividad"`
	URLFoto             string     `gorm:"column:url_foto" json:"url_foto"`
	Descripcion         *string    `gorm:"column:descripcion" json:"descripcion"`
	FechaSubida         time.Time  `gorm:"column:fecha_subida" json:"fecha_subida"`
	// Etapa de la captura dentro de la actividad: INICIO, SEGUIMIENTO_1..3 o FIN.
	// Junto con MinutosTranscurridos permite reconstruir el cronograma real.
	Etapa               *string    `gorm:"column:etapa" json:"etapa,omitempty"`
	MinutosTranscurridos int       `gorm:"column:minutos_transcurridos" json:"minutos_transcurridos"`
}

func (RSUActividadFoto) TableName() string { return "RSU_Actividad_Foto" }

type RSUMonitoreo struct {
	ID              uint       `gorm:"primaryKey;column:id_monitoreo" json:"id_monitoreo"`
	IDProyecto      uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	FechaMonitoreo  time.Time  `gorm:"column:fecha_monitoreo" json:"fecha_monitoreo"`
	IDMonitor       uint       `gorm:"column:id_monitor" json:"id_monitor"`
	PorcentajeAvance *float64  `gorm:"column:porcentaje_avance" json:"porcentaje_avance"`
	Resultado       string     `gorm:"column:resultado" json:"resultado"`
	Observaciones   *string    `gorm:"column:observaciones" json:"observaciones"`
}

func (RSUMonitoreo) TableName() string { return "RSU_Monitoreo" }
