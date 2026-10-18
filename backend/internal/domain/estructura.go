package domain

import (
	"time"
)

// ── MÓDULO 1: Estructura Organizacional ───────────────────────────

type Facultad struct {
	ID        uint      `gorm:"primaryKey;column:id_facultad" json:"id_facultad"`
	Codigo    string    `gorm:"column:codigo;unique;size:10" json:"codigo"`
	Nombre    string    `gorm:"column:nombre;size:200" json:"nombre"`
	DecanoID  *uint     `gorm:"column:decano_id" json:"decano_id"`
	Decano    *Docente  `gorm:"foreignKey:DecanoID" json:"decano,omitempty"`
	Activo    bool      `gorm:"column:activo;default:true" json:"activo"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}

func (Facultad) TableName() string { return "Facultad" }

type Escuela struct {
	ID         uint      `gorm:"primaryKey;column:id_escuela" json:"id_escuela"`
	IDFacultad uint      `gorm:"column:id_facultad" json:"id_facultad"`
	Facultad   *Facultad `gorm:"foreignKey:IDFacultad" json:"facultad,omitempty"`
	Codigo     string    `gorm:"column:codigo;unique;size:10" json:"codigo"`
	Nombre     string    `gorm:"column:nombre;size:200" json:"nombre"`
	DirectorID *uint     `gorm:"column:director_id" json:"director_id"`
	Director   *Docente  `gorm:"foreignKey:DirectorID" json:"director,omitempty"`
	Activo     bool      `gorm:"column:activo;default:true" json:"activo"`
}

func (Escuela) TableName() string { return "Escuela" }

type DepartamentoAcademico struct {
	ID         uint   `gorm:"primaryKey;column:id_departamento" json:"id_departamento"`
	IDFacultad uint   `gorm:"column:id_facultad" json:"id_facultad"`
	Nombre     string `gorm:"column:nombre" json:"nombre"`
	DirectorID *uint  `gorm:"column:director_id" json:"director_id"`
}

func (DepartamentoAcademico) TableName() string { return "Departamento_Academico" }

type CicloAcademico struct {
	ID          uint      `gorm:"primaryKey;column:id_ciclo" json:"id_ciclo"`
	Nombre      string    `gorm:"column:nombre;unique;size:20" json:"nombre"`
	FechaInicio time.Time `gorm:"column:fecha_inicio" json:"fecha_inicio"`
	FechaFin    time.Time `gorm:"column:fecha_fin" json:"fecha_fin"`
	Activo      bool      `gorm:"column:activo" json:"activo"`
}

func (CicloAcademico) TableName() string { return "Ciclo_Academico" }
