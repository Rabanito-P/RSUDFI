package domain

import (
	"time"
)

// ── MÓDULO 8B: Beneficiarios ──────────────────────────────────────

type RSUBeneficiario struct {
	ID                    uint       `gorm:"primaryKey;column:id_beneficiario" json:"id_beneficiario"`
	TipoBeneficiario      string     `gorm:"column:tipo_beneficiario" json:"tipo_beneficiario"`
	DNI                   *string    `gorm:"column:dni" json:"dni"`
	Nombres               *string    `gorm:"column:nombres" json:"nombres"`
	Apellidos             *string    `gorm:"column:apellidos" json:"apellidos"`
	RUC                   *string    `gorm:"column:ruc" json:"ruc"`
	RazonSocial           *string    `gorm:"column:razon_social" json:"razon_social"`
	Celular               *string    `gorm:"column:celular" json:"celular"`
	CorreoElectronico     *string    `gorm:"column:correo_electronico" json:"correo_electronico"`
	Direccion             *string    `gorm:"column:direccion" json:"direccion"`
	Distrito              *string    `gorm:"column:distrito" json:"distrito"`
	Provincia             *string    `gorm:"column:provincia" json:"provincia"`
	Departamento          *string    `gorm:"column:departamento" json:"departamento"`
	Sexo                  *string    `gorm:"column:sexo" json:"sexo"`
	CondicionVulnerabilidad *string  `gorm:"column:condicion_vulnerabilidad" json:"condicion_vulnerabilidad"`
	Activo                bool       `gorm:"column:activo" json:"activo"`
	FechaRegistro         time.Time  `gorm:"column:fecha_registro" json:"fecha_registro"`
}

func (RSUBeneficiario) TableName() string { return "RSU_Beneficiario" }

type RSUProyectoBeneficiario struct {
	ID              uint `gorm:"primaryKey;column:id_vinculacion" json:"id_vinculacion"`
	IDProyecto      uint `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDBeneficiario  uint `gorm:"column:id_beneficiario" json:"id_beneficiario"`
	Beneficiario    *RSUBeneficiario `gorm:"foreignKey:IDBeneficiario" json:"beneficiario,omitempty"`
	FechaIncorporacion time.Time `gorm:"column:fecha_incorporacion" json:"fecha_incorporacion"`
	RolEnProyecto   *string `gorm:"column:rol_en_proyecto" json:"rol_en_proyecto"`
	Activo          bool `gorm:"column:activo" json:"activo"`
}

func (RSUProyectoBeneficiario) TableName() string { return "RSU_Proyecto_Beneficiario" }

type RSUAsistenciaBeneficiario struct {
	ID            uint  `gorm:"primaryKey;column:id_asistencia" json:"id_asistencia"`
	IDActividad   uint  `gorm:"column:id_actividad" json:"id_actividad"`
	IDBeneficiario uint `gorm:"column:id_beneficiario" json:"id_beneficiario"`
	Beneficiario  *RSUBeneficiario `gorm:"foreignKey:IDBeneficiario" json:"beneficiario,omitempty"`
}

func (RSUAsistenciaBeneficiario) TableName() string { return "RSU_Asistencia_Beneficiario" }
