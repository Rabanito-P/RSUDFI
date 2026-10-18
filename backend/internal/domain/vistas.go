package domain

// ── Vistas ────────────────────────────────────────────────────────

type VwProyectoResumen struct {
	IDProyecto           uint     `gorm:"column:id_proyecto" json:"id_proyecto"`
	CodigoProyecto       string   `gorm:"column:codigo_proyecto" json:"codigo_proyecto"`
	Titulo               string   `gorm:"column:titulo" json:"titulo"`
	Facultad             string   `gorm:"column:facultad" json:"facultad"`
	Escuela              string   `gorm:"column:escuela" json:"escuela"`
	TipoProyecto         string   `gorm:"column:tipo_proyecto" json:"tipo_proyecto"`
	EstadoActual         string   `gorm:"column:estado_actual" json:"estado_actual"`
	Semestre             *string  `gorm:"column:semestre" json:"semestre"`
	PresupuestoAprobado  float64  `gorm:"column:presupuesto_aprobado" json:"presupuesto_aprobado"`
	MontoEjecutado       float64  `gorm:"column:monto_ejecutado" json:"monto_ejecutado"`
	PorcentajeAvance     float64  `gorm:"column:porcentaje_avance" json:"porcentaje_avance"`
	EstudianteLider      *string  `gorm:"column:estudiante_lider" json:"estudiante_lider"`
	DocenteAsesor        *string  `gorm:"column:docente_asesor" json:"docente_asesor"`
	TotalBeneficiarios   int      `gorm:"column:total_beneficiarios" json:"total_beneficiarios"`
	PromedioSatisfaccion *float64 `gorm:"column:promedio_satisfaccion" json:"promedio_satisfaccion"`
}

func (VwProyectoResumen) TableName() string { return "vw_rsu_proyectos_resumen" }
