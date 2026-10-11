package service

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/repository"
)

// ── Asignación Service (Ley 30220 Art 79/86) ──────────────────

type AsignacionService struct {
	repo        *repository.AsignacionRepo
	docenteRepo *repository.DocenteRepo
	db          *gorm.DB
}
func NewAsignacionService(db *gorm.DB) *AsignacionService {
	return &AsignacionService{repo: repository.NewAsignacionRepo(db), docenteRepo: repository.NewDocenteRepo(db), db: db}
}
func (s *AsignacionService) AsignarDocente(req dto.AsignarDocenteReq) (*domain.RSUAsignacionDocente, error) {
	// Validación carga no lectiva Art 86
	var docente domain.Docente
	if err := s.db.First(&docente, "id_docente = ?", req.IDDocente).Error; err != nil {
		return nil, errors.New("docente no encontrado")
	}
	horasYa, err := s.docenteRepo.HorasAsignadas(req.IDDocente, req.IDCiclo)
	if err != nil {
		return nil, fmt.Errorf("error consultando horas asignadas: %w", err)
	}
	if horasYa+req.HorasAsignadas > docente.CargaNoLectivaMax && req.TipoHora == "NO_LECTIVA" {
		return nil, fmt.Errorf("excede carga no lectiva máxima (%.2f). Ya asignadas: %.2f, intenta asignar: %.2f",
			docente.CargaNoLectivaMax, horasYa, req.HorasAsignadas)
	}
	a := &domain.RSUAsignacionDocente{
		IDProyecto: req.IDProyecto, IDDocente: req.IDDocente, IDRolProyecto: req.IDRolProyecto,
		HorasAsignadas: req.HorasAsignadas, TipoHora: req.TipoHora, IDCiclo: req.IDCiclo,
		FechaAsignacion: time.Now(), EstadoAsignacion: "PENDIENTE",
	}
	if err := s.repo.CreateDocente(a); err != nil { return nil, err }
	return a, nil
}
func (s *AsignacionService) InscribirEstudiante(req dto.InscribirEstudianteReq) (*domain.RSUParticipanteEstudiante, error) {
	// Regla V4: 1 proyecto activo por estudiante (INSCRITO/ACTIVO). Si está en otro proyecto activo, rechaza.
	var cnt int64
	s.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO') AND id_proyecto <> ?", req.IDEstudiante, req.IDProyecto).Count(&cnt)
	if cnt > 0 {
		return nil, errors.New("el estudiante ya pertenece a otro proyecto activo. Solo un proyecto a la vez; debe ser retirado del anterior")
	}
	// HU-003: validar ciclo mínimo según ciclo activo y RSU_Tipo_Proyecto.ciclo_minimo_estudiante
	var proj domain.RSUProyecto
	if err := s.db.First(&proj, "id_proyecto = ?", req.IDProyecto).Error; err != nil {
		return nil, errors.New("proyecto no encontrado")
	}
	var tipo domain.RSUTipoProyecto
	if err := s.db.First(&tipo, "id_tipo = ?", proj.IDTipo).Error; err == nil {
		// ciclo activo o ciclo del proyecto
		var cicloActivo domain.CicloAcademico
		if err := s.db.Where("activo = TRUE").First(&cicloActivo).Error; err == nil {
			var ec domain.EstudianteCiclo
			if err := s.db.Where("id_estudiante = ? AND id_ciclo = ?", req.IDEstudiante, cicloActivo.ID).First(&ec).Error; err == nil {
				if ec.CicloNumerico < tipo.CicloMinimo {
					return nil, fmt.Errorf("ciclo mínimo para %s es %d, estudiante va en ciclo %d", tipo.Nombre, tipo.CicloMinimo, ec.CicloNumerico)
				}
			}
		}
	}
	// duplicado en este proyecto
	if s.repo.IsMiembro(req.IDProyecto, req.IDEstudiante) {
		return nil, errors.New("estudiante ya es miembro del equipo")
	}
	// Equipo de 2 a 5 estudiantes (líder + participantes activos)
	var lider int64
	s.db.Model(&domain.RSUProyecto{}).Where("id_proyecto = ? AND id_estudiante_lider IS NOT NULL", req.IDProyecto).Count(&lider)
	nActs, err := s.repo.CountActivosByProyecto(req.IDProyecto)
	if err != nil {
		return nil, fmt.Errorf("error contando equipo activo: %w", err)
	}
	total := nActs
	if lider > 0 && nActs > 0 {
		total = nActs // el líder suele figurar también como participante
	} else {
		total = nActs + lider
	}
	if total >= 5 {
		return nil, errors.New("el equipo ya tiene 5 estudiantes (máximo permitido)")
	}
	p := &domain.RSUParticipanteEstudiante{
		IDProyecto: req.IDProyecto, IDEstudiante: req.IDEstudiante, IDRolProyecto: req.IDRolProyecto,
		FechaInscripcion: time.Now(), EstadoParticipacion: "ACTIVO", ValidacionCiclo: true,
	}
	if err := s.repo.CreateEstudiante(p); err != nil { return nil, err }
	return p, nil
}
func (s *AsignacionService) RetirarEstudiante(idProyecto, idEstudiante uint) error {
	// No dejar el equipo con menos de 2 estudiantes
	var lider *uint
	var proj domain.RSUProyecto
	if err := s.db.First(&proj, "id_proyecto = ?", idProyecto).Error; err == nil {
		lider = proj.IDEstudianteLider
	}
	nActs, _ := s.repo.CountActivosByProyecto(idProyecto)
	total := nActs
	if lider != nil && nActs > 0 {
		total = nActs
	} else if lider != nil {
		total = nActs + 1
	}
	esLider := lider != nil && *lider == idEstudiante
	esPart := s.repo.IsMiembro(idProyecto, idEstudiante)
	if (esLider || esPart) && total <= 2 {
		return errors.New("no se puede retirar: el equipo mínimo es 2 estudiantes")
	}
	return s.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO')", idProyecto, idEstudiante).Update("estado_participacion", "RETIRADO").Error
}
func (s *AsignacionService) ListDocentes(idProyecto uint) ([]domain.RSUAsignacionDocente, error) {
	return s.repo.ListDocentesByProyecto(idProyecto)
}
func (s *AsignacionService) ListEstudiantes(idProyecto uint) ([]domain.RSUParticipanteEstudiante, error) {
	return s.repo.ListEstudiantesByProyecto(idProyecto)
}

