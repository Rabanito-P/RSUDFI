package domain

import "time"

type RSUUsuario struct {
	ID           uint       `gorm:"primaryKey;column:id_usuario" json:"id_usuario"`
	Correo       string     `gorm:"column:correo;unique;size:150" json:"correo"`
	Nombre       string     `gorm:"column:nombre;size:150" json:"nombre"`
	PasswordHash string     `gorm:"column:password_hash" json:"-"`
	Rol          string     `gorm:"column:rol;size:30" json:"rol"`
	TipoUsuario  string     `gorm:"column:tipo_usuario;size:20" json:"tipo_usuario"`
	IDPersona    *uint      `gorm:"column:id_persona" json:"id_persona"`
	Activo       bool       `gorm:"column:activo;default:true" json:"activo"`
	UltimoLogin  *time.Time `gorm:"column:ultimo_login" json:"ultimo_login"`
	CreatedAt    time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (RSUUsuario) TableName() string { return "RSU_Usuario" }

// ── Permisos por usuario (activación de funciones/módulos) ──

type RSUUsuarioPermiso struct {
	ID        uint      `gorm:"primaryKey;column:id_permiso" json:"id_permiso"`
	IDUsuario uint      `gorm:"column:id_usuario" json:"id_usuario"`
	Modulo    string    `gorm:"column:modulo" json:"modulo"`
	Activo    bool      `gorm:"column:activo;default:true" json:"activo"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (RSUUsuarioPermiso) TableName() string { return "RSU_Usuario_Permiso" }
