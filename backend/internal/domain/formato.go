package domain

import "time"

// RSUFormato es un formato oficial RSU. El catálogo es FIJO: son los 7 formatos
// que el sistema siempre usa (propuesta, planificación Excel, tres entregables,
// encuesta e informe final). El administrador no crea ni borra formatos: solo
// reemplaza el archivo de ejemplo que se ofrece al estudiante.
//
// Ruta vacía significa que todavía se sirve el archivo de fábrica que viene en
// documentos/plantillas/. Cuando el admin sube uno propio se guarda la ruta
// real y se usa esa.
type RSUFormato struct {
	ID             uint      `gorm:"primaryKey;column:id_formato" json:"id_formato"`
	Codigo         string    `gorm:"column:codigo;uniqueIndex" json:"codigo"`
	Nombre         string    `gorm:"column:nombre" json:"nombre"`
	Descripcion    string    `gorm:"column:descripcion" json:"descripcion"`
	// ArchivoBase es el nombre del formato original en documentos/plantillas/.
	ArchivoBase    string    `gorm:"column:archivo_base" json:"archivo_base"`
	// Ruta apunta al archivo subido por el administrador (vacio = usa el base).
	Ruta           string    `gorm:"column:ruta" json:"ruta"`
	NombreArchivo  string    `gorm:"column:nombre_archivo" json:"nombre_archivo"`
	Version        string    `gorm:"column:version" json:"version"`
	PesoBytes      int64     `gorm:"column:peso_bytes" json:"peso_bytes"`
	Orden          int       `gorm:"column:orden" json:"orden"`
	FechaActualiz  time.Time `gorm:"column:fecha_actualizacion" json:"fecha_actualizacion"`
}

func (RSUFormato) TableName() string { return "RSU_Formato" }
