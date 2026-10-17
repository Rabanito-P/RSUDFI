package service

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/mail"
)

// ── HU-060: cambio de líder del proyecto ───────────────────────
// El liderazgo puede transferirse a otro miembro del equipo por decisión del
// propio líder o de la Dirección de RSU de Facultad. Se notifica por panel y
// por correo (Resend) al líder saliente y al entrante, con el motivo.

var celularRegex = regexp.MustCompile(`^9[0-9]{8}$`)

// celularValido verifica el formato peruano: 9 dígitos empezando en 9.
func celularValido(s string) bool { return celularRegex.MatchString(s) }

// maxProyectosDocente devuelve el máximo de proyectos que un docente puede
// asesorar a la vez (configurable en RSU_Configuracion). Fallback: 2.
func maxProyectosDocente(db *gorm.DB) int64 {
	var cfg domain.RSUConfiguracion
	if err := db.Where("clave = ?", "maximo_proyectos_ssu_docente").First(&cfg).Error; err == nil {
		if n, err := strconv.ParseInt(strings.TrimSpace(cfg.Valor), 10, 64); err == nil && n > 0 {
			return n
		}
	}
	return 2
}

// GuardarCelularLider persiste el celular del líder en Estudiante.celular.
// Se llama al crear el proyecto (el líder lo declara en el formulario HU-001).
func (s *ProyectoService) GuardarCelularLider(idEstudiante uint, celular string) error {
	c := strings.TrimSpace(celular)
	if c == "" {
		return nil
	}
	if !celularValido(c) {
		return errors.New("celular inválido: 9 dígitos empezando en 9 (ej. 987654321)")
	}
	return s.db.Model(&domain.Estudiante{}).
		Where("id_estudiante = ?", idEstudiante).
		Update("celular", c).Error
}

// nombreEstudiante devuelve "Nombres Apellidos" para los mensajes.
func (s *ProyectoService) nombreEstudiante(idEstudiante uint) string {
	var e domain.Estudiante
	if err := s.db.First(&e, "id_estudiante = ?", idEstudiante).Error; err == nil {
		return strings.TrimSpace(e.Nombres + " " + e.Apellidos)
	}
	return "un miembro del equipo"
}

func (s *ProyectoService) codigoEstado(idEstado uint) string {
	var codigo string
	_ = s.db.Model(&domain.RSUEstadoProyecto{}).
		Select("codigo").
		Where("id_estado = ?", idEstado).
		Scan(&codigo).Error
	return codigo
}

// CambiarLider transfiere el liderazgo del proyecto a otro miembro del equipo,
// registra el motivo en el historial y notifica a ambos por panel y correo.
func (s *ProyectoService) CambiarLider(idProyecto uint, req dto.CambioLiderReq) (*domain.RSUProyecto, error) {
	proj, err := s.proyectoRepo.FindByID(idProyecto)
	if err != nil {
		return nil, err
	}
	if proj.IDEstudianteLider == nil {
		return nil, errors.New("este proyecto no tiene líder asignado")
	}
	if *proj.IDEstudianteLider == req.IDNuevoLider {
		return nil, errors.New("ese estudiante ya es el líder del proyecto")
	}
	motivo := strings.TrimSpace(req.Motivo)
	if motivo == "" {
		return nil, errors.New("debes escribir el motivo del cambio de líder (HU-060)")
	}
	// No se transfiere liderazgo de un proyecto cerrado: el ciclo ya terminó.
	switch s.codigoEstado(proj.IDEstadoActual) {
	case "CERRADO", "REPORTADO_SUNEDU", "EVALUACION_VALIDADA":
		return nil, errors.New("no se puede cambiar el líder de un proyecto cerrado o reportado")
	}
	// El nuevo líder debe ser miembro vigente del equipo.
	var part domain.RSUParticipanteEstudiante
	if err := s.db.Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO')",
		idProyecto, req.IDNuevoLider).First(&part).Error; err != nil {
		return nil, errors.New("el nuevo líder debe ser miembro del equipo del proyecto")
	}
	anterior := *proj.IDEstudianteLider
	if err := s.db.Model(&domain.RSUProyecto{}).
		Where("id_proyecto = ?", idProyecto).
		Update("id_estudiante_lider", req.IDNuevoLider).Error; err != nil {
		return nil, err
	}
	proj.IDEstudianteLider = &req.IDNuevoLider

	nombreAnterior := s.nombreEstudiante(anterior)
	nombreNuevo := s.nombreEstudiante(req.IDNuevoLider)
	cod := proj.CodigoProyecto
	tit := proj.Titulo

	// ── Panel (notificaciones dirigidas) + correo a cada líder ──
	idSal := s.idUsuarioDePersona("ESTUDIANTE", &anterior)
	idEnt := s.idUsuarioDePersona("ESTUDIANTE", &req.IDNuevoLider)

	msgSal := fmt.Sprintf("El liderazgo de %s «%s» fue transferido a %s. Motivo: %s. Sigues en el equipo y puedes seguir subiendo documentos.", cod, tit, nombreNuevo, motivo)
	s.pushNotificacion("ESTUDIANTE_PROP", "LIDER_CAMBIADO", "Dejaste de ser líder — "+cod, &msgSal, &idProyecto, idSal)

	msgEnt := fmt.Sprintf("A partir de ahora eres líder de %s «%s». Motivo del cambio: %s. Como líder gestionas el equipo y los envíos.", cod, tit, motivo)
	s.pushNotificacion("ESTUDIANTE_PROP", "LIDER_CAMBIADO", "Ahora eres líder — "+cod, &msgEnt, &idProyecto, idEnt)

	// Correos (Resend): el saliente y el entrante reciben plantilla dedicada.
	base := mail.DatosProyecto{Codigo: cod, Titulo: tit, Motivo: motivo}
	if dest, ok := s.correoDeUsuarioID(idSal); ok {
		d := base
		d.Destinatario = nombreAnterior
		s.enviarCorreos([]destCorreo{dest}, d, func(m mail.DatosProyecto) (string, string, string) {
			return mail.CorreoLiderCambiado(m, false, nombreNuevo)
		})
	}
	if dest, ok := s.correoDeUsuarioID(idEnt); ok {
		d := base
		d.Destinatario = nombreNuevo
		s.enviarCorreos([]destCorreo{dest}, d, func(m mail.DatosProyecto) (string, string, string) {
			return mail.CorreoLiderCambiado(m, true, nombreAnterior)
		})
	}
	// El asesor se entera por el panel (sin correo extra: no es parte del cambio).
	if proj.IDDocenteAsesor != nil {
		msgAs := fmt.Sprintf("El líder de %s cambió: %s ahora es líder del equipo. Motivo: %s.", cod, nombreNuevo, motivo)
		s.pushNotificacion("DOCENTE_RESP", "LIDER_CAMBIADO", "Cambio de líder — "+cod, &msgAs, &idProyecto, s.idUsuarioDePersona("DOCENTE", proj.IDDocenteAsesor))
	}
	return proj, nil
}
