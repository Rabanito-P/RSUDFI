package domain

import (
	"time"
)

// ── Roles dinámicos por proyecto (V1.1 §1) ──────────────
// Un usuario puede tener 1+ roles por proyecto (asignación dinámica).
type RSUProyectoRol struct {
	IDProyecto      uint      `gorm:"primaryKey;column:id_proyecto" json:"id_proyecto"`
	IDUsuario       uint      `gorm:"primaryKey;column:id_usuario" json:"id_usuario"`
	TipoUsuario     string    `gorm:"primaryKey;column:tipo_usuario" json:"tipo_usuario"` // DOCENTE|ESTUDIANTE|ADMINISTRATIVO
	RolActor        string    `gorm:"primaryKey;column:rol_actor;size:50" json:"rol_actor"`
	Proyecto        *RSUProyecto `gorm:"foreignKey:IDProyecto" json:"proyecto,omitempty"`
	RolActorRef     *RSURolActor `gorm:"foreignKey:RolActor;references:Codigo" json:"rol_actor_ref,omitempty"`
	FechaAsignacion time.Time `gorm:"column:fecha_asignacion" json:"fecha_asignacion"`
	AsignadoPor     *uint     `gorm:"column:asignado_por" json:"asignado_por"`
	Activo          bool      `gorm:"column:activo;default:true" json:"activo"`
}

func (RSUProyectoRol) TableName() string { return "RSU_Proyecto_Rol" }
