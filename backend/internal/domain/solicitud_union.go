package domain

import (
	"time"
)

// ── Solicitud de unión a PEP (HU-063..HU-068) ────────────────────
// El estudiante solicita unirse a un PEP abierto; el responsable del PEP
// (presidente del Comité en financiado, docente responsable en
// autofinanciado) acepta o rechaza. No es inscripción directa: genera
// estado PENDIENTE hasta resolución (R36–R41).

type RSUSolicitudUnion struct {
	ID               uint       `gorm:"primaryKey;column:id_solicitud" json:"id_solicitud"`
	IDProyecto       uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	Proyecto         *RSUProyecto `gorm:"foreignKey:IDProyecto" json:"proyecto,omitempty"`
	IDEstudiante     uint       `gorm:"column:id_estudiante" json:"id_estudiante"`
	Estudiante       *Estudiante `gorm:"foreignKey:IDEstudiante" json:"estudiante,omitempty"`
	MensajeSolicitud *string    `gorm:"column:mensaje_solicitud" json:"mensaje_solicitud"`
	Estado           string     `gorm:"column:estado" json:"estado"` // PENDIENTE|ACEPTADA|RECHAZADA|CANCELADA
	MotivoRapido     *string    `gorm:"column:motivo_rapido" json:"motivo_rapido"`
	MotivoRechazo    *string    `gorm:"column:motivo_rechazo" json:"motivo_rechazo"`
	IDRevisor        *uint      `gorm:"column:id_revisor" json:"id_revisor"`
	FechaSolicitud   time.Time  `gorm:"column:fecha_solicitud" json:"fecha_solicitud"`
	FechaResolucion  *time.Time `gorm:"column:fecha_resolucion" json:"fecha_resolucion"`
}

func (RSUSolicitudUnion) TableName() string { return "RSU_Solicitud_Union" }

// Motivos rápidos de rechazo (enum fijo — HU-068).
var MotivosRapidosRechazo = []string{
	"CUPO_LLENO",
	"CICLO_INSUFICIENTE",
	"PERFIL_NO_AFIN",
	"FUERA_DE_PLAZO",
	"OTRO",
}

func MotivoRapidoValido(m string) bool {
	for _, v := range MotivosRapidosRechazo {
		if v == m {
			return true
		}
	}
	return false
}
