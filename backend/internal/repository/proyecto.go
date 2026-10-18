package repository

import (
	"strings"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

func escapeLike(s string) string {
	return strings.ReplaceAll(strings.ReplaceAll(s, "%", "\\%"), "_", "\\_")
}

// ── Proyecto ─────────────────────────────────────────────────

type ProyectoRepo struct{ db *gorm.DB }

func NewProyectoRepo(db *gorm.DB) *ProyectoRepo { return &ProyectoRepo{db} }

func (r *ProyectoRepo) Create(p *domain.RSUProyecto) error { return r.db.Create(p).Error }
func (r *ProyectoRepo) FindAll(page, limit int, estado *uint, escuela *uint, search string, modalidades []string) ([]domain.RSUProyecto, int64, error) {
	var items []domain.RSUProyecto
	var total int64
	q := r.db.Model(&domain.RSUProyecto{})
	if estado != nil {
		q = q.Where("id_estado_actual = ?", *estado)
	}
	if escuela != nil {
		q = q.Where("id_escuela = ?", *escuela)
	}
	// HU-063: filtro por modalidad (p. ej. ?modalidad=PEP_FINANCIADO,PEP_AUTOFINANCIADO).
	if len(modalidades) > 0 {
		q = q.Where("modalidad IN ?", modalidades)
	}
	if search != "" {
		like := "%" + escapeLike(search) + "%"
		q = q.Where("titulo LIKE ? OR codigo_proyecto LIKE ?", like, like)
	}
	q.Session(&gorm.Session{}).Count(&total)
	err := q.Preload("Escuela.Facultad").Preload("Tipo").Preload("EstadoActual").Preload("EstudianteLider").Preload("DocenteAsesor").
		Offset((page - 1) * limit).Limit(limit).Order("created_at DESC").Find(&items).Error
	return items, total, err
}
func (r *ProyectoRepo) FindAllByDocente(page, limit int, idDocente uint, search string) ([]domain.RSUProyecto, int64, error) {
	var items []domain.RSUProyecto
	var total int64
	q := r.db.Model(&domain.RSUProyecto{}).Where("id_docente_asesor = ?", idDocente)
	if search != "" {
		like := "%" + escapeLike(search) + "%"
		q = q.Where("titulo LIKE ? OR codigo_proyecto LIKE ?", like, like)
	}
	q.Session(&gorm.Session{}).Count(&total)
	err := q.Preload("Escuela.Facultad").Preload("Tipo").Preload("EstadoActual").Preload("EstudianteLider").Preload("DocenteAsesor").
		Offset((page - 1) * limit).Limit(limit).Order("created_at DESC").Find(&items).Error
	return items, total, err
}
func (r *ProyectoRepo) FindByID(id uint) (*domain.RSUProyecto, error) {
	var p domain.RSUProyecto
	err := r.db.Preload("Escuela.Facultad").Preload("Tipo").Preload("LineaAccion").Preload("EstadoActual").
		Preload("CicloCreacion").Preload("EstudianteLider").Preload("DocenteAsesor").
		First(&p, "id_proyecto = ?", id).Error
	return &p, err
}
func (r *ProyectoRepo) Update(p *domain.RSUProyecto) error { return r.db.Save(p).Error }
func (r *ProyectoRepo) UpdateEstado(id uint, estadoID uint) error {
	return r.db.Model(&domain.RSUProyecto{}).Where("id_proyecto = ?", id).Update("id_estado_actual", estadoID).Error
}

// UpdatePlazoSubsanacion fija el vencimiento y el motivo de la devolución
// (HU-F2-02). Se actualiza aparte del estado para no pisar el cambio de estado
// con un Save completo del struct.
func (r *ProyectoRepo) UpdatePlazoSubsanacion(id uint, limite, motivo, camposBloqueados *string) error {
	return r.db.Model(&domain.RSUProyecto{}).Where("id_proyecto = ?", id).
		Updates(map[string]any{
			"fecha_limite_subsanacion": limite,
			"motivo_observacion":       motivo,
			"campos_bloqueados":        camposBloqueados,
		}).Error
}
func (r *ProyectoRepo) VwResumen(page, limit int) ([]domain.VwProyectoResumen, int64, error) {
	var items []domain.VwProyectoResumen
	var total int64
	r.db.Model(&domain.VwProyectoResumen{}).Count(&total)
	err := r.db.Offset((page - 1) * limit).Limit(limit).Order("id_proyecto DESC").Find(&items).Error
	return items, total, err
}
func (r *ProyectoRepo) FindAllByEstudiante(page, limit int, idEstudiante uint, search string) ([]domain.RSUProyecto, int64, error) {
	var items []domain.RSUProyecto
	var total int64
	q := r.db.Model(&domain.RSUProyecto{}).
		Joins("LEFT JOIN \"RSU_Participante_Estudiante\" pe ON pe.\"id_proyecto\" = \"RSU_Proyecto\".\"id_proyecto\" AND pe.\"estado_participacion\" IN ('INSCRITO','ACTIVO','FINALIZADO')").
		Where("\"RSU_Proyecto\".\"id_estudiante_lider\" = ? OR pe.\"id_estudiante\" = ?", idEstudiante, idEstudiante)
	if search != "" {
		like := "%" + escapeLike(search) + "%"
		q = q.Where("\"RSU_Proyecto\".\"titulo\" LIKE ? OR \"RSU_Proyecto\".\"codigo_proyecto\" LIKE ?", like, like)
	}
	// count distinct sin ORDER BY para PG 18
	q2 := q.Session(&gorm.Session{})
	q2.Distinct("\"RSU_Proyecto\".\"id_proyecto\"").Count(&total)
	err := q.Group("\"RSU_Proyecto\".\"id_proyecto\"").Preload("Escuela.Facultad").Preload("Tipo").Preload("EstadoActual").
		Offset((page - 1) * limit).Limit(limit).Order("MAX(\"RSU_Proyecto\".\"created_at\") DESC").Find(&items).Error
	return items, total, err
}
func (r *ProyectoRepo) IsEstudianteMiembro(idProyecto, idEstudiante uint) bool {
	var c int64
	r.db.Model(&domain.RSUProyecto{}).Where("id_proyecto = ? AND id_estudiante_lider = ?", idProyecto, idEstudiante).Count(&c)
	if c > 0 {
		return true
	}
	r.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO')", idProyecto, idEstudiante).Count(&c)
	return c > 0
}
