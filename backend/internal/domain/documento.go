package domain

import (
	"time"
)

// ── MÓDULO 6: Documentos ──────────────────────────────────────────

type RSUDocumento struct {
	ID              uint              `gorm:"primaryKey;column:id_documento" json:"id_documento"`
	IDProyecto      uint              `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDTipoDoc       uint              `gorm:"column:id_tipo_doc" json:"id_tipo_doc"`
	TipoDoc         *RSUTipoDocumento `gorm:"foreignKey:IDTipoDoc" json:"tipo_doc,omitempty"`
	NombreArchivo   string            `gorm:"column:nombre_archivo" json:"nombre_archivo"`
	URLArchivo      string            `gorm:"column:url_archivo" json:"url_archivo"`
	HashArchivo     *string           `gorm:"column:hash_archivo" json:"hash_archivo"`
	TamanoBytes     *int              `gorm:"column:tamaño_bytes" json:"tamano_bytes"`
	Version         int               `gorm:"column:version" json:"version"`
	IDUsuarioSubida uint              `gorm:"column:id_usuario_subida" json:"id_usuario_subida"`
	FechaSubida     time.Time         `gorm:"column:fecha_subida" json:"fecha_subida"`
	Vigente         bool              `gorm:"column:vigente" json:"vigente"`
	Observaciones   *string           `gorm:"column:observaciones" json:"observaciones"`
}

func (RSUDocumento) TableName() string { return "RSU_Documento" }

type RSUResolucion struct {
	ID               uint      `gorm:"primaryKey;column:id_resolucion" json:"id_resolucion"`
	IDProyecto       uint      `gorm:"column:id_proyecto" json:"id_proyecto"`
	TipoResolucion   string    `gorm:"column:tipo_resolucion" json:"tipo_resolucion"`
	NumeroResolucion string    `gorm:"column:numero_resolucion;unique" json:"numero_resolucion"`
	FechaResolucion  time.Time `gorm:"column:fecha_resolucion" json:"fecha_resolucion"`
	IDDocumento      *uint     `gorm:"column:id_documento" json:"id_documento"`
	IDOrgano         uint      `gorm:"column:id_organo" json:"id_organo"`
	Observaciones    *string   `gorm:"column:observaciones" json:"observaciones"`
}

func (RSUResolucion) TableName() string { return "RSU_Resolucion" }
