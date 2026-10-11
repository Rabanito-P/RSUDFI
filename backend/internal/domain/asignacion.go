package domain

import (
	"time"
)

// ── MÓDULO 5: Asignación RRHH ─────────────────────────────────────

type RSUAsignacionDocente struct {
	ID              uint       `gorm:"primaryKey;column:id_asignacion" json:"id_asignacion"`
	IDProyecto      uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	Proyecto        *RSUProyecto `gorm:"foreignKey:IDProyecto" json:"proyecto,omitempty"`
	IDDocente       uint       `gorm:"column:id_docente" json:"id_docente"`
	Docente         *Docente   `gorm:"foreignKey:IDDocente" json:"docente,omitempty"`
	IDRolProyecto   uint       `gorm:"column:id_rol_proyecto" json:"id_rol_proyecto"`
	IDCiclo         uint       `gorm:"column:id_ciclo" json:"id_ciclo"`
	HorasAsignadas  float64    `gorm:"column:horas_asignadas" json:"horas_asignadas"`
	TipoHora        string     `gorm:"column:tipo_hora" json:"tipo_hora"`
	FechaAsignacion time.Time  `gorm:"column:fecha_asignacion" json:"fecha_asignacion"`
	EstadoAsignacion string    `gorm:"column:estado_asignacion" json:"estado_asignacion"`
	AprobadoPor     *uint      `gorm:"column:aprobado_por" json:"aprobado_por"`
}

func (RSUAsignacionDocente) TableName() string { return "RSU_Asignacion_Docente" }

type RSUParticipanteEstudiante struct {
	ID              uint       `gorm:"primaryKey;column:id_participante" json:"id_participante"`
	IDProyecto      uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDEstudiante    uint       `gorm:"column:id_estudiante" json:"id_estudiante"`
	Estudiante      *Estudiante `gorm:"foreignKey:IDEstudiante" json:"estudiante,omitempty"`
	IDRolProyecto   uint       `gorm:"column:id_rol_proyecto" json:"id_rol_proyecto"`
	HorasAcumuladas float64    `gorm:"column:horas_acumuladas" json:"horas_acumuladas"`
	FechaInscripcion time.Time `gorm:"column:fecha_inscripcion" json:"fecha_inscripcion"`
	EstadoParticipacion string `gorm:"column:estado_participacion" json:"estado_participacion"`
	ValidacionCiclo bool    `gorm:"column:validacion_ciclo" json:"validacion_ciclo"`
}

func (RSUParticipanteEstudiante) TableName() string { return "RSU_Participante_Estudiante" }
