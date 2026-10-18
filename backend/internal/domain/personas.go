package domain

import (
	"strings"
	"time"
)

// ── MÓDULO 2: Personas ────────────────────────────────────────────

type Docente struct {
	ID                uint     `gorm:"primaryKey;column:id_docente" json:"id_docente"`
	CodigoDocente     string   `gorm:"column:codigo_docente;unique;size:20" json:"codigo_docente"`
	DNI               string   `gorm:"column:dni;unique;size:8" json:"dni"`
	Nombres           string   `gorm:"column:nombres" json:"nombres"`
	Apellidos         string   `gorm:"column:apellidos" json:"apellidos"`
	Correo            string   `gorm:"column:correo_institucional" json:"correo_institucional"`
	IDEscuela         uint     `gorm:"column:id_escuela" json:"id_escuela"`
	Escuela           *Escuela `gorm:"foreignKey:IDEscuela" json:"escuela,omitempty"`
	IDDepartamento    *uint    `gorm:"column:id_departamento" json:"id_departamento"`
	TipoDocente       string   `gorm:"column:tipo_docente" json:"tipo_docente"`
	Categoria         *string  `gorm:"column:categoria" json:"categoria"`
	CargaLectivaMax   float64  `gorm:"column:carga_lectiva_max" json:"carga_lectiva_max"`
	CargaNoLectivaMax float64  `gorm:"column:carga_no_lectiva_max" json:"carga_no_lectiva_max"`
	Activo            bool     `gorm:"column:activo;default:true" json:"activo"`
	NombreCompleto    string   `gorm:"-" json:"nombre_completo"`
}

func (Docente) TableName() string { return "Docente" }

type Estudiante struct {
	ID           uint       `gorm:"primaryKey;column:id_estudiante" json:"id_estudiante"`
	Codigo       string     `gorm:"column:codigo_estudiante;unique" json:"codigo_estudiante"`
	DNI          string     `gorm:"column:dni;unique" json:"dni"`
	Nombres      string     `gorm:"column:nombres" json:"nombres"`
	Apellidos    string     `gorm:"column:apellidos" json:"apellidos"`
	Correo       string     `gorm:"column:correo_institucional" json:"correo_institucional"`
	Celular      *string    `gorm:"column:celular" json:"celular"`
	IDEscuela    uint       `gorm:"column:id_escuela" json:"id_escuela"`
	Escuela      *Escuela   `gorm:"foreignKey:IDEscuela" json:"escuela,omitempty"`
	Estado       string     `gorm:"column:estado" json:"estado"`
	FechaIngreso *time.Time `gorm:"column:fecha_ingreso" json:"fecha_ingreso"`
}

func (Estudiante) TableName() string { return "Estudiante" }

// CelularFormateado devuelve el celular o "—" para vistas.
func (e *Estudiante) CelularFormateado() string {
	if e.Celular != nil && strings.TrimSpace(*e.Celular) != "" {
		return *e.Celular
	}
	return "—"
}

type EstudianteCiclo struct {
	IDEstudiante  uint   `gorm:"primaryKey;column:id_estudiante" json:"id_estudiante"`
	IDCiclo       uint   `gorm:"primaryKey;column:id_ciclo" json:"id_ciclo"`
	CicloNumerico int    `gorm:"column:ciclo_numerico" json:"ciclo_numerico"`
	Estado        string `gorm:"column:estado" json:"estado"`
}

func (EstudianteCiclo) TableName() string { return "Estudiante_Ciclo" }
