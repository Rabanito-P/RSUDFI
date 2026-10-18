package repository

import (
	"strings"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Docente / Estudiante ─────────────────────────────────────

type DocenteRepo struct{ db *gorm.DB }

func NewDocenteRepo(db *gorm.DB) *DocenteRepo         { return &DocenteRepo{db} }
func (r *DocenteRepo) Create(d *domain.Docente) error { return r.db.Create(d).Error }
func (r *DocenteRepo) FindAll(page, limit int, search string) ([]domain.Docente, int64, error) {
	var items []domain.Docente
	var total int64
	q := r.db.Model(&domain.Docente{})
	if search != "" {
		like := "%" + strings.ReplaceAll(strings.ReplaceAll(search, "%", "\\%"), "_", "\\_") + "%"
		q = q.Where("nombres LIKE ? OR apellidos LIKE ? OR dni LIKE ?", like, like, like)
	}
	q.Session(&gorm.Session{}).Count(&total)
	err := q.Preload("Escuela").Offset((page - 1) * limit).Limit(limit).Order("apellidos ASC").Find(&items).Error
	return items, total, err
}
func (r *DocenteRepo) FindByID(id uint) (*domain.Docente, error) {
	var d domain.Docente
	err := r.db.Preload("Escuela").First(&d, "id_docente = ?", id).Error
	return &d, err
}
func (r *DocenteRepo) HorasAsignadas(idDocente, idCiclo uint) (float64, error) {
	var total *float64
	err := r.db.Model(&domain.RSUAsignacionDocente{}).
		Select("COALESCE(SUM(horas_asignadas),0)").
		Where("id_docente = ? AND id_ciclo = ? AND estado_asignacion = 'APROBADA'", idDocente, idCiclo).
		Scan(&total).Error
	if total == nil {
		return 0, err
	}
	return *total, err
}

// ProyectosAsesoradosActivos cuenta los proyectos NO finalizados donde el
// docente es asesor. Norma institucional: un docente no puede asesorar más
// de 2 equipos/proyectos a la vez (máximo configurable en
// RSU_Configuracion.maximo_proyectos_ssu_docente).
func (r *DocenteRepo) ProyectosAsesoradosActivos(idDocente uint) (int64, error) {
	var n int64
	err := r.db.Model(&domain.RSUProyecto{}).
		Where(`"id_docente_asesor" = ? AND "activo" = ? AND "id_estado_actual" IN (
			SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo" NOT IN ('CERRADO','REPORTADO_SUNEDU','EVALUACION_VALIDADA'))`,
			idDocente, true).
		Count(&n).Error
	return n, err
}

// ProyectosAsesoradosActivosEnCiclo cuenta los proyectos que ocupan cupo
// de asesoria del docente DENTRO de un ciclo concreto.
//
// `excluirProyecto` permite dejar fuera un proyecto del conteo: es lo que
// hace falta cuando el docente ACEPTA una asesoria, porque el proyecto que
// se acepta no debe competir consigo mismo por el tope.
//
// HU-F1-03 CA-3.2 / HU-F1-04 CA-4.2: el tope de asesorias se evalua por
// ciclo, no de forma global. Base: rules (3) §3.1 punto 2 ("el docente
// tenga menos de 2 SSU en el ciclo") e info/objetivo.txt R06.
//
// Tres exclusiones:
//   - ARCHIVADO_VENCIMIENTO: libera el cupo (CA-7.2), por eso se puede
//     reactivar el proyecto cuando el docente recupera cupo.
//   - Solo modalidad SSU: los PEP los propone el propio docente o el
//     Comite, asi que no compiten por el tope de "asesorados" (R42).
//   - Los proyectos ya concluidos tampoco ocupan cupo.
func (r *DocenteRepo) ProyectosAsesoradosActivosEnCiclo(idDocente, idCiclo, excluirProyecto uint) (int, error) {
	var n int64
	q := r.db.Model(&domain.RSUProyecto{}).
		Where(`"id_docente_asesor" = ? AND "activo" = ? AND "id_ciclo_creacion" = ?
			AND "modalidad" = 'SSU'
			AND "id_estado_actual" NOT IN (
				SELECT "id_estado" FROM "RSU_Estado_Proyecto"
				WHERE "codigo" IN ('CERRADO','REPORTADO_SUNEDU','EVALUACION_VALIDADA','ARCHIVADO_VENCIMIENTO'))`,
			idDocente, true, idCiclo)
	if excluirProyecto != 0 {
		q = q.Where("id_proyecto <> ?", excluirProyecto)
	}
	err := q.Count(&n).Error
	return int(n), err
}

type EstudianteRepo struct{ db *gorm.DB }

func NewEstudianteRepo(db *gorm.DB) *EstudianteRepo         { return &EstudianteRepo{db} }
func (r *EstudianteRepo) Create(e *domain.Estudiante) error { return r.db.Create(e).Error }
func (r *EstudianteRepo) FindAll(page, limit int, search string) ([]domain.Estudiante, int64, error) {
	var items []domain.Estudiante
	var total int64
	q := r.db.Model(&domain.Estudiante{})
	if search != "" {
		like := "%" + strings.ReplaceAll(strings.ReplaceAll(search, "%", "\\%"), "_", "\\_") + "%"
		q = q.Where("nombres LIKE ? OR apellidos LIKE ? OR dni LIKE ?", like, like, like)
	}
	q.Session(&gorm.Session{}).Count(&total)
	err := q.Preload("Escuela").Offset((page - 1) * limit).Limit(limit).Order("apellidos ASC").Find(&items).Error
	return items, total, err
}
func (r *EstudianteRepo) FindByID(id uint) (*domain.Estudiante, error) {
	var e domain.Estudiante
	err := r.db.Preload("Escuela").First(&e, "id_estudiante = ?", id).Error
	return &e, err
}
func (r *EstudianteRepo) GetCicloNumerico(idEstudiante, idCiclo uint) (int, error) {
	var ec domain.EstudianteCiclo
	err := r.db.First(&ec, "id_estudiante = ? AND id_ciclo = ?", idEstudiante, idCiclo).Error
	if err != nil {
		return 0, err
	}
	return ec.CicloNumerico, nil
}
