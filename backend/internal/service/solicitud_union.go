package service

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
)

// ── Solicitudes de unión a PEP (HU-063..HU-068, R36–R41) ────────

type SolicitudUnionService struct {
	db *gorm.DB
}

func NewSolicitudUnionService(db *gorm.DB) *SolicitudUnionService {
	return &SolicitudUnionService{db: db}
}

// SolicitudUnionDetalle es la solicitud con datos listos para la bandeja
// del responsable: estudiante pre-cargado + ciclo y escuela (HU-066).
type SolicitudUnionDetalle struct {
	Solicitud domain.RSUSolicitudUnion `json:"solicitud"`
	Ciclo     int                      `json:"ciclo"`
	Escuela   string                   `json:"escuela"`
}

// estadosFinales excluye proyectos cerrados de nuevas solicitudes.
var estadosFinalesSolicitud = []string{"CERRADO", "REPORTADO_SUNEDU", "EVALUACION_VALIDADA"}

func (s *SolicitudUnionService) pushNotificacion(rolDestino, tipo, titulo string, mensaje *string, idProyecto *uint, idUsuario *uint) {
	if rolDestino == "" {
		return
	}
	var ra domain.RSURolActor
	if err := s.db.First(&ra, "codigo = ?", rolDestino).Error; err != nil {
		return
	}
	_ = s.db.Create(&domain.RSUNotificacion{
		RolDestino: rolDestino, Tipo: tipo, Titulo: titulo,
		Mensaje: mensaje, IDProyecto: idProyecto, IDUsuario: idUsuario,
		Leido: false,
	}).Error
}

// rolDeUsuario devuelve el rol actor real del usuario para que la notificación
// caiga en su propia bandeja (la campana filtra por rol_destino = rol_actor).
func (s *SolicitudUnionService) rolDeUsuario(tipoUsuario string, idPersona uint, defecto string) (string, *uint) {
	var u domain.RSUUsuario
	if err := s.db.Where("tipo_usuario = ? AND id_persona = ?", tipoUsuario, idPersona).First(&u).Error; err != nil {
		return defecto, nil
	}
	if u.Rol == "" {
		return defecto, &u.ID
	}
	return u.Rol, &u.ID
}

// equipoOcupado cuenta líder + activos + pendientes (una solicitud aceptada
// no debe superar el máximo de 5 — R39).
func (s *SolicitudUnionService) equipoOcupado(idProyecto uint) (int64, error) {
	var lider int64
	s.db.Model(&domain.RSUProyecto{}).Where("id_proyecto = ? AND id_estudiante_lider IS NOT NULL", idProyecto).Count(&lider)
	var nActs int64
	if err := s.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND estado_participacion IN ('INSCRITO','ACTIVO')", idProyecto).Count(&nActs).Error; err != nil {
		return 0, err
	}
	var nPend int64
	if err := s.db.Model(&domain.RSUSolicitudUnion{}).Where("id_proyecto = ? AND estado = 'PENDIENTE'", idProyecto).Count(&nPend).Error; err != nil {
		return 0, err
	}
	total := nActs + nPend
	if lider > 0 && nActs > 0 {
		total = nActs + nPend // el líder suele figurar también como participante
	} else {
		total = nActs + lider + nPend
	}
	return total, nil
}

// validaElegible aplica V4 (un proyecto activo), ciclo mínimo (R01) y no
// miembro. Se usa al crear y se revalida al aceptar.
func (s *SolicitudUnionService) validaElegible(proj *domain.RSUProyecto, idEstudiante uint) error {
	var cnt int64
	s.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO') AND id_proyecto <> ?", idEstudiante, proj.ID).Count(&cnt)
	if cnt > 0 {
		return errors.New("el estudiante ya pertenece a otro proyecto activo. Solo un proyecto a la vez")
	}
	var tipo domain.RSUTipoProyecto
	if err := s.db.First(&tipo, "id_tipo = ?", proj.IDTipo).Error; err == nil {
		var cicloActivo domain.CicloAcademico
		if err := s.db.Where("activo = TRUE").First(&cicloActivo).Error; err == nil {
			var ec domain.EstudianteCiclo
			if err := s.db.Where("id_estudiante = ? AND id_ciclo = ?", idEstudiante, cicloActivo.ID).First(&ec).Error; err == nil {
				if ec.CicloNumerico < tipo.CicloMinimo {
					return fmt.Errorf("ciclo mínimo para %s es %d, estudiante va en ciclo %d", tipo.Nombre, tipo.CicloMinimo, ec.CicloNumerico)
				}
			}
		}
	}
	return nil
}

func (s *SolicitudUnionService) getProyectoAbierto(idProyecto uint) (*domain.RSUProyecto, error) {
	var proj domain.RSUProyecto
	if err := s.db.First(&proj, "id_proyecto = ?", idProyecto).Error; err != nil {
		return nil, errors.New("proyecto no encontrado")
	}
	// R37: solo PEP recibe solicitudes de unión.
	if len(proj.Modalidad) < 3 || proj.Modalidad[:3] != "PEP" {
		return nil, errors.New("solo los proyectos PEP reciben solicitudes de unión")
	}
	var est domain.RSUEstadoProyecto
	if err := s.db.First(&est, "id_estado = ?", proj.IDEstadoActual).Error; err == nil {
		for _, f := range estadosFinalesSolicitud {
			if est.Codigo == f {
				return nil, errors.New("el proyecto ya está cerrado, no recibe solicitudes")
			}
		}
	}
	return &proj, nil
}

func (s *SolicitudUnionService) Create(idProyecto uint, req dto.CrearSolicitudUnionReq) (*domain.RSUSolicitudUnion, error) {
	proj, err := s.getProyectoAbierto(idProyecto)
	if err != nil {
		return nil, err
	}
	var est domain.Estudiante
	if err := s.db.First(&est, "id_estudiante = ?", req.IDEstudiante).Error; err != nil {
		return nil, errors.New("estudiante no encontrado")
	}
	if proj.IDEstudianteLider != nil && *proj.IDEstudianteLider == req.IDEstudiante {
		return nil, errors.New("ya eres el líder de este proyecto")
	}
	var yaMiembro int64
	s.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO')", idProyecto, req.IDEstudiante).Count(&yaMiembro)
	if yaMiembro > 0 {
		return nil, errors.New("ya eres miembro de este proyecto")
	}
	var yaPend int64
	s.db.Model(&domain.RSUSolicitudUnion{}).Where("id_proyecto = ? AND id_estudiante = ? AND estado = 'PENDIENTE'", idProyecto, req.IDEstudiante).Count(&yaPend)
	if yaPend > 0 {
		return nil, errors.New("ya tienes una solicitud pendiente en este proyecto")
	}
	if err := s.validaElegible(proj, req.IDEstudiante); err != nil {
		return nil, err
	}
	ocup, err := s.equipoOcupado(idProyecto)
	if err != nil {
		return nil, fmt.Errorf("error contando equipo: %w", err)
	}
	if ocup >= 5 {
		return nil, errors.New("el equipo ya tiene 5 estudiantes (máximo permitido)")
	}
	sol := &domain.RSUSolicitudUnion{
		IDProyecto: idProyecto, IDEstudiante: req.IDEstudiante,
		Estado: "PENDIENTE", FechaSolicitud: time.Now(),
	}
	if req.Mensaje != "" {
		sol.MensajeSolicitud = &req.Mensaje
	}
	if err := s.db.Create(sol).Error; err != nil {
		return nil, err
	}
	// Avisa al responsable del PEP (R38: docente asesor/responsable) en su rol.
	titulo := fmt.Sprintf("Nueva solicitud de unión — %s", proj.CodigoProyecto)
	msg := fmt.Sprintf("%s %s (%s) desea unirse al proyecto «%s».", est.Nombres, est.Apellidos, est.Codigo, proj.Titulo)
	var idResp *uint
	rolResp := "DOCENTE_RESP"
	if proj.IDDocenteAsesor != nil {
		rolResp, idResp = s.rolDeUsuario("DOCENTE", *proj.IDDocenteAsesor, rolResp)
	}
	s.pushNotificacion(rolResp, "SOLICITUD_UNION", titulo, &msg, &proj.ID, idResp)
	return sol, nil
}

func (s *SolicitudUnionService) ListByProyecto(idProyecto uint, estado string) ([]SolicitudUnionDetalle, error) {
	q := s.db.Model(&domain.RSUSolicitudUnion{}).Where("id_proyecto = ?", idProyecto)
	if estado != "" {
		q = q.Where("estado = ?", estado)
	}
	var sols []domain.RSUSolicitudUnion
	if err := q.Preload("Estudiante").Order("fecha_solicitud DESC").Find(&sols).Error; err != nil {
		return nil, err
	}
	return s.conDetalle(sols)
}

func (s *SolicitudUnionService) ListByEstudiante(idEstudiante uint) ([]SolicitudUnionDetalle, error) {
	var sols []domain.RSUSolicitudUnion
	if err := s.db.Where("id_estudiante = ?", idEstudiante).Preload("Estudiante").Preload("Proyecto").Order("fecha_solicitud DESC").Find(&sols).Error; err != nil {
		return nil, err
	}
	return s.conDetalle(sols)
}

func (s *SolicitudUnionService) conDetalle(sols []domain.RSUSolicitudUnion) ([]SolicitudUnionDetalle, error) {
	out := make([]SolicitudUnionDetalle, 0, len(sols))
	var cicloActivo domain.CicloAcademico
	tieneCiclo := s.db.Where("activo = TRUE").First(&cicloActivo).Error == nil
	for _, sol := range sols {
		d := SolicitudUnionDetalle{Solicitud: sol}
		if sol.Estudiante != nil {
			var esc domain.Escuela
			if err := s.db.First(&esc, "id_escuela = ?", sol.Estudiante.IDEscuela).Error; err == nil {
				d.Escuela = esc.Nombre
			}
			if tieneCiclo {
				var ec domain.EstudianteCiclo
				if err := s.db.Where("id_estudiante = ? AND id_ciclo = ?", sol.IDEstudiante, cicloActivo.ID).First(&ec).Error; err == nil {
					d.Ciclo = ec.CicloNumerico
				}
			}
		}
		out = append(out, d)
	}
	return out, nil
}

// esResponsable verifica R38: solo el docente asesor/responsable resuelve.
// El ADMIN global también puede resolver (idRevisor 0 = sin persona docente).
func (s *SolicitudUnionService) esResponsable(proj *domain.RSUProyecto, idRevisor uint, esAdmin bool) bool {
	if esAdmin {
		return true
	}
	return proj.IDDocenteAsesor != nil && *proj.IDDocenteAsesor == idRevisor
}

func (s *SolicitudUnionService) Aceptar(idSolicitud, idRevisor uint, esAdmin bool) (*domain.RSUSolicitudUnion, error) {
	var sol domain.RSUSolicitudUnion
	if err := s.db.Preload("Estudiante").First(&sol, "id_solicitud = ?", idSolicitud).Error; err != nil {
		return nil, errors.New("solicitud no encontrada")
	}
	if sol.Estado != "PENDIENTE" {
		return nil, errors.New("la solicitud ya fue resuelta")
	}
	var proj domain.RSUProyecto
	if err := s.db.First(&proj, "id_proyecto = ?", sol.IDProyecto).Error; err != nil {
		return nil, errors.New("proyecto no encontrado")
	}
	if !s.esResponsable(&proj, idRevisor, esAdmin) {
		return nil, errors.New("solo el responsable del PEP puede resolver solicitudes")
	}
	// R39: revalidar cupo + elegibilidad dentro de transacción.
	tx := s.db.Begin()
	ocup, err := s.equipoOcupadoTx(tx, proj.ID, sol.ID)
	if err != nil {
		tx.Rollback()
		return nil, err
	}
	if ocup >= 5 {
		tx.Rollback()
		ahora := time.Now()
		_ = s.db.Model(&sol).Updates(map[string]any{"estado": "RECHAZADA", "motivo_rapido": "CUPO_LLENO", "id_revisor": idRevisor, "fecha_resolucion": ahora})
		sol.Estado = "RECHAZADA"
		mr := "CUPO_LLENO"
		sol.MotivoRapido = &mr
		return nil, errors.New("el equipo se llenó (5 estudiantes): la solicitud quedó rechazada por CUPO_LLENO")
	}
	if err := s.validaElegibleTx(tx, &proj, sol.IDEstudiante); err != nil {
		tx.Rollback()
		return nil, err
	}
	var rolEjec domain.RSURolProyecto
	if err := tx.Where("nombre = ? AND aplica_a = 'ESTUDIANTE'", "Ejecutor").First(&rolEjec).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("rol Ejecutor no configurado")
	}
	pe := &domain.RSUParticipanteEstudiante{
		IDProyecto: proj.ID, IDEstudiante: sol.IDEstudiante, IDRolProyecto: rolEjec.ID,
		FechaInscripcion: time.Now(), EstadoParticipacion: "ACTIVO", ValidacionCiclo: true,
	}
	if err := tx.Create(pe).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("no se pudo inscribir al estudiante en el equipo. Intenta de nuevo")
	}
	ahora := time.Now()
	if err := tx.Model(&sol).Updates(map[string]any{"estado": "ACEPTADA", "id_revisor": idRevisor, "fecha_resolucion": ahora}).Error; err != nil {
		tx.Rollback()
		return nil, err
	}
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}
	sol.Estado = "ACEPTADA"
	sol.IDRevisor = &idRevisor
	sol.FechaResolucion = &ahora
	titulo := fmt.Sprintf("Solicitud aceptada — %s", proj.CodigoProyecto)
	msg := fmt.Sprintf("Fuiste aceptado en el proyecto «%s». Ya eres miembro del equipo.", proj.Titulo)
	rolSol, idSol := s.rolDeUsuario("ESTUDIANTE", sol.IDEstudiante, "ESTUDIANTE_EJEC")
	s.pushNotificacion(rolSol, "UNION_ACEPTADA", titulo, &msg, &proj.ID, idSol)
	return &sol, nil
}

func (s *SolicitudUnionService) Rechazar(idSolicitud, idRevisor uint, esAdmin bool, motivoRapido, motivo string) (*domain.RSUSolicitudUnion, error) {
	if !domain.MotivoRapidoValido(motivoRapido) {
		return nil, errors.New("motivo_rapido inválido (CUPO_LLENO, CICLO_INSUFICIENTE, PERFIL_NO_AFIN, FUERA_DE_PLAZO, OTRO)")
	}
	if motivoRapido == "OTRO" && motivo == "" {
		return nil, errors.New("con motivo OTRO debes escribir el motivo del rechazo")
	}
	var sol domain.RSUSolicitudUnion
	if err := s.db.Preload("Estudiante").First(&sol, "id_solicitud = ?", idSolicitud).Error; err != nil {
		return nil, errors.New("solicitud no encontrada")
	}
	if sol.Estado != "PENDIENTE" {
		return nil, errors.New("la solicitud ya fue resuelta")
	}
	var proj domain.RSUProyecto
	if err := s.db.First(&proj, "id_proyecto = ?", sol.IDProyecto).Error; err != nil {
		return nil, errors.New("proyecto no encontrado")
	}
	if !s.esResponsable(&proj, idRevisor, esAdmin) {
		return nil, errors.New("solo el responsable del PEP puede resolver solicitudes")
	}
	ahora := time.Now()
	upd := map[string]any{"estado": "RECHAZADA", "motivo_rapido": motivoRapido, "id_revisor": idRevisor, "fecha_resolucion": ahora}
	if motivo != "" {
		upd["motivo_rechazo"] = motivo
		sol.MotivoRechazo = &motivo
	}
	if err := s.db.Model(&sol).Updates(upd).Error; err != nil {
		return nil, err
	}
	sol.Estado = "RECHAZADA"
	sol.MotivoRapido = &motivoRapido
	sol.IDRevisor = &idRevisor
	sol.FechaResolucion = &ahora
	titulo := fmt.Sprintf("Solicitud no aceptada — %s", proj.CodigoProyecto)
	msg := fmt.Sprintf("Tu solicitud para «%s» fue rechazada (%s).", proj.Titulo, motivoRapido)
	if motivo != "" {
		msg = fmt.Sprintf("Tu solicitud para «%s» fue rechazada (%s): %s", proj.Titulo, motivoRapido, motivo)
	}
	rolSol, idSol := s.rolDeUsuario("ESTUDIANTE", sol.IDEstudiante, "ESTUDIANTE_EJEC")
	s.pushNotificacion(rolSol, "UNION_RECHAZADA", titulo, &msg, &proj.ID, idSol)
	return &sol, nil
}

func (s *SolicitudUnionService) Cancelar(idSolicitud, idEstudiante uint) error {
	var sol domain.RSUSolicitudUnion
	if err := s.db.First(&sol, "id_solicitud = ?", idSolicitud).Error; err != nil {
		return errors.New("solicitud no encontrada")
	}
	if sol.IDEstudiante != idEstudiante {
		return errors.New("solo el solicitante puede cancelar su solicitud")
	}
	if sol.Estado != "PENDIENTE" {
		return errors.New("solo se puede cancelar una solicitud pendiente")
	}
	return s.db.Model(&sol).Update("estado", "CANCELADA").Error
}

// equipoOcupadoTx y validaElegibleTx son las variantes transaccionales de los
// helpers (leen dentro del tx para que el cupo no cambie a mitad de Aceptar).
func (s *SolicitudUnionService) equipoOcupadoTx(tx *gorm.DB, idProyecto, idSolicitud uint) (int64, error) {
	var lider int64
	tx.Model(&domain.RSUProyecto{}).Where("id_proyecto = ? AND id_estudiante_lider IS NOT NULL", idProyecto).Count(&lider)
	var nActs int64
	if err := tx.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND estado_participacion IN ('INSCRITO','ACTIVO')", idProyecto).Count(&nActs).Error; err != nil {
		return 0, err
	}
	// Pendientes sin contar la propia solicitud (se va a aceptar).
	var nPend int64
	if err := tx.Model(&domain.RSUSolicitudUnion{}).Where("id_proyecto = ? AND estado = 'PENDIENTE' AND id_solicitud <> ?", idProyecto, idSolicitud).Count(&nPend).Error; err != nil {
		return 0, err
	}
	if lider > 0 && nActs > 0 {
		return nActs + nPend, nil
	}
	return nActs + lider + nPend, nil
}

func (s *SolicitudUnionService) validaElegibleTx(tx *gorm.DB, proj *domain.RSUProyecto, idEstudiante uint) error {
	var cnt int64
	tx.Model(&domain.RSUParticipanteEstudiante{}).Where("id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO') AND id_proyecto <> ?", idEstudiante, proj.ID).Count(&cnt)
	if cnt > 0 {
		return errors.New("el estudiante ya pertenece a otro proyecto activo. Solo un proyecto a la vez")
	}
	var tipo domain.RSUTipoProyecto
	if err := tx.First(&tipo, "id_tipo = ?", proj.IDTipo).Error; err == nil {
		var cicloActivo domain.CicloAcademico
		if err := tx.Where("activo = TRUE").First(&cicloActivo).Error; err == nil {
			var ec domain.EstudianteCiclo
			if err := tx.Where("id_estudiante = ? AND id_ciclo = ?", idEstudiante, cicloActivo.ID).First(&ec).Error; err == nil {
				if ec.CicloNumerico < tipo.CicloMinimo {
					return fmt.Errorf("ciclo mínimo para %s es %d, estudiante va en ciclo %d", tipo.Nombre, tipo.CicloMinimo, ec.CicloNumerico)
				}
			}
		}
	}
	return nil
}
