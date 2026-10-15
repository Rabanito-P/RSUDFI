package domain

import (
	"time"

	"gorm.io/gorm"
)

// ── HU-023: encuesta de satisfacción del docente asesor ──
// La responde el estudiante ejecutor sobre el asesor de SU proyecto.
type RSUEncuestaSatisfaccion struct {
	ID              uint      `gorm:"primaryKey;column:id_encuesta" json:"id_encuesta"`
	IDProyecto      uint      `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDDocenteAsesor uint      `gorm:"column:id_docente_asesor" json:"id_docente_asesor"`
	IDEstudiante    uint      `gorm:"column:id_estudiante" json:"id_estudiante"`
	FechaRegistro   time.Time `gorm:"column:fecha_registro" json:"fecha_registro"`
	Estado          string    `gorm:"column:estado" json:"estado"`
	IDDocumento     *uint     `gorm:"column:id_documento" json:"id_documento"`
	PromedioGeneral *float64  `gorm:"column:promedio_general" json:"promedio_general"`
	Comentario      *string   `gorm:"column:comentario" json:"comentario"`
}

func (RSUEncuestaSatisfaccion) TableName() string { return "RSU_Encuesta_Satisfaccion" }

type EncuestaSatisfaccionRepo struct{ db *gorm.DB }

func NewEncuestaSatisfaccionRepo(db *gorm.DB) *EncuestaSatisfaccionRepo {
	return &EncuestaSatisfaccionRepo{db: db}
}

func (r *EncuestaSatisfaccionRepo) Create(e *RSUEncuestaSatisfaccion) error {
	return r.db.Create(e).Error
}

// Existe reporta si el estudiante ya evaluó al asesor de ese proyecto.
func (r *EncuestaSatisfaccionRepo) Existe(idProyecto, idEstudiante uint) (bool, error) {
	var n int64
	err := r.db.Model(&RSUEncuestaSatisfaccion{}).
		Where("id_proyecto = ? AND id_estudiante = ?", idProyecto, idEstudiante).
		Count(&n).Error
	return n > 0, err
}

func (r *EncuestaSatisfaccionRepo) ByProyecto(idProyecto uint) ([]RSUEncuestaSatisfaccion, error) {
	var list []RSUEncuestaSatisfaccion
	err := r.db.Where("id_proyecto = ?", idProyecto).Order("fecha_registro DESC").Find(&list).Error
	return list, err
}
