package domain

import (
	"time"
)

// ── MÓDULO 4: Proyecto ────────────────────────────────────────────

type RSUProyecto struct {
	ID                    uint       `gorm:"primaryKey;column:id_proyecto" json:"id_proyecto"`
	CodigoProyecto        string     `gorm:"column:codigo_proyecto;unique" json:"codigo_proyecto"`
	Titulo                string     `gorm:"column:titulo" json:"titulo"`
	IDEscuela             uint       `gorm:"column:id_escuela" json:"id_escuela"`
	Escuela               *Escuela   `gorm:"foreignKey:IDEscuela" json:"escuela,omitempty"`
	IDTipo                uint       `gorm:"column:id_tipo" json:"id_tipo"`
	Tipo                  *RSUTipoProyecto `gorm:"foreignKey:IDTipo" json:"tipo,omitempty"`
	Modalidad             string     `gorm:"column:modalidad" json:"modalidad"` // SSU|PEP_FINANCIADO|PEP_AUTOFINANCIADO|VOLUNTARIADO|PUBLICACION_CIENTIFICA
	IDLineaAccion         *uint      `gorm:"column:id_linea_accion" json:"id_linea_accion"`
	LineaAccion           *RSULineaAccion `gorm:"foreignKey:IDLineaAccion" json:"linea_accion,omitempty"`
	IDEstadoActual        uint       `gorm:"column:id_estado_actual" json:"id_estado_actual"`
	EstadoActual          *RSUEstadoProyecto `gorm:"foreignKey:IDEstadoActual" json:"estado_actual,omitempty"`
	IDCicloCreacion       uint       `gorm:"column:id_ciclo_creacion" json:"id_ciclo_creacion"`
	CicloCreacion         *CicloAcademico `gorm:"foreignKey:IDCicloCreacion" json:"ciclo_creacion,omitempty"`
	IDEstudianteLider     *uint      `gorm:"column:id_estudiante_lider" json:"id_estudiante_lider"`
	EstudianteLider       *Estudiante `gorm:"foreignKey:IDEstudianteLider" json:"estudiante_lider,omitempty"`
	IDDocenteAsesor       *uint      `gorm:"column:id_docente_asesor" json:"id_docente_asesor"`
	DocenteAsesor         *Docente   `gorm:"foreignKey:IDDocenteAsesor" json:"docente_asesor,omitempty"`
	Descripcion           *string    `gorm:"column:descripcion" json:"descripcion"`
	ObjetivoGeneral       *string    `gorm:"column:objetivo_general" json:"objetivo_general"`
	ObjetivosEspecificos  *string    `gorm:"column:objetivos_especificos" json:"objetivos_especificos"`
	PoblacionBeneficiaria *string    `gorm:"column:poblacion_beneficiaria" json:"poblacion_beneficiaria"`
	SectorBeneficiario    *string    `gorm:"column:sector_beneficiario" json:"sector_beneficiario"`
	NumeroBeneficiarios   int        `gorm:"column:numero_beneficiarios" json:"numero_beneficiarios"`
	LugarIntervencion     *string    `gorm:"column:lugar_intervencion" json:"lugar_intervencion"`
	Semestre              *string    `gorm:"column:semestre" json:"semestre"`
	FechaInicioPlan       *time.Time `gorm:"column:fecha_inicio_plan" json:"fecha_inicio_plan"`
	FechaFinPlan          *time.Time `gorm:"column:fecha_fin_plan" json:"fecha_fin_plan"`
	PresupuestoSolicitado float64    `gorm:"column:presupuesto_solicitado" json:"presupuesto_solicitado"`
	PresupuestoAprobado   float64    `gorm:"column:presupuesto_aprobado" json:"presupuesto_aprobado"`
	MontoEjecutado        float64    `gorm:"column:monto_ejecutado" json:"monto_ejecutado"`
	PorcentajeAvance      float64    `gorm:"column:porcentaje_avance" json:"porcentaje_avance"`
	ArchivoProyectoURL    *string    `gorm:"column:archivo_proyecto_url" json:"archivo_proyecto_url"`
	ArchivoAprobacionURL  *string    `gorm:"column:archivo_aprobacion_url" json:"archivo_aprobacion_url"`
	IDResolucionAprobacion *uint     `gorm:"column:id_resolucion_aprobacion" json:"id_resolucion_aprobacion"`
	IDResolucionCierre    *uint      `gorm:"column:id_resolucion_cierre" json:"id_resolucion_cierre"`
	FechaAprobacion       *time.Time `gorm:"column:fecha_aprobacion" json:"fecha_aprobacion"`
	FechaCierre           *time.Time `gorm:"column:fecha_cierre" json:"fecha_cierre"`
	Activo                bool       `gorm:"column:activo" json:"activo"`
	CreatedAt             time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt             time.Time  `gorm:"column:updated_at" json:"updated_at"`
}

func (RSUProyecto) TableName() string { return "RSU_Proyecto" }

type RSUEntregable struct {
	ID              uint       `gorm:"primaryKey;column:id_entregable" json:"id_entregable"`
	IDProyecto      uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	Nombre          string     `gorm:"column:nombre" json:"nombre"`
	Orden           int        `gorm:"column:orden" json:"orden"`
	FechaLimite     *time.Time `gorm:"column:fecha_limite" json:"fecha_limite"`
	HorasAsignadas  float64    `gorm:"column:horas_asignadas" json:"horas_asignadas"`
	Estado          string     `gorm:"column:estado" json:"estado"`
	IDVerificador   *uint      `gorm:"column:id_verificador" json:"id_verificador"`
	Observaciones   *string    `gorm:"column:observaciones" json:"observaciones"`
	// PDF registrado por el equipo (descargable). Un entregable = un documento vigente.
	IDDocumento     *uint         `gorm:"column:id_documento" json:"id_documento"`
	Documento       *RSUDocumento `gorm:"foreignKey:IDDocumento" json:"documento,omitempty"`
}

func (RSUEntregable) TableName() string { return "RSU_Entregable" }
