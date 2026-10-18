package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ─────────────────────────────────────────────────────────────────
// HU-F1-04 / HU-F1-06 / HU-F1-07 — Bucle del docente asesor
// Base: rules (3) §3.1 punto 2, §5 CAMINO 1 y CAMINO 3
// ─────────────────────────────────────────────────────────────────

// DecisionAsesorReq: lo que el docente responde tras recibir una propuesta.
type DecisionAsesorReq struct {
	ProyectoID uint   `json:"id_proyecto" binding:"required"`
	Decision   string `json:"decision" binding:"required,oneof=ACEPTAR RECHAZAR"`
	// Rechazar exige motivo (regla R26 vigente, conservada).
	Motivo *string `json:"motivo"`
}

// EnviarAsesorReq: el líder remite la propuesta al docente asesor.
type EnviarAsesorReq struct {
	ProyectoID      uint   `json:"id_proyecto" binding:"required"`
	IDDocenteAsesor *uint  `json:"id_docente_asesor"`
	Comentario      string `json:"comentario"`
}

// ResolverDecisionAsesor aplica la respuesta del docente asesor.
//
// CAMINO BUENO (ACEPTAR): valida el cupo del ciclo, pasa a ACEPTADO_ASESOR
//
//	y notifica al lider (CA-4.3 a CA-4.7).
//
// CAMINO 1 (RECHAZAR): pasa a OBSERVADO_ASESOR con motivo obligatorio y
//
//	congela el contenido tecnico para el reintento (CA-4.8 a CA-4.11).
func (s *ProyectoService) ResolverDecisionAsesor(req DecisionAsesorReq, idUsuario uint) error {
	proj, err := s.proyectoRepo.FindByID(req.ProyectoID)
	if err != nil {
		return errors.New("proyecto no encontrado")
	}
	estadoActual := codigoEstadoDe(s.db, proj.IDEstadoActual)
	if estadoActual != "ENVIADO_ASESOR" {
		return fmt.Errorf("el proyecto está en %s: solo se responde cuando espera al docente asesor", estadoActual)
	}
	if proj.IDDocenteAsesor == nil {
		return errors.New("el proyecto no tiene docente asesor asignado")
	}

	switch strings.ToUpper(strings.TrimSpace(req.Decision)) {
	case "ACEPTAR":
		// CA-4.2: el tope de asesorias se evalua en el ciclo del proyecto.
		// El proyecto que se acepta queda excluido del conteo: de lo
		// contrario ocuparia cupo y bloquearia su propia aprobacion.
		max := int(maxProyectosDocente(s.db))
		n, err := s.docenteRepo.ProyectosAsesoradosActivosEnCiclo(*proj.IDDocenteAsesor, proj.IDCicloCreacion, proj.ID)
		if err == nil {
			if err := validarCupoAsesor(int(n), max); err != nil {
				return err
			}
		}
		return s.transicionarFase1(proj, "ACEPTADO_ASESOR", "ACEPTADO_ASESOR", req.Motivo, idUsuario, rolAsesorID(s.db))

	case "RECHAZAR":
		// CA-4.9: el motivo es obligatorio para que el lider sepa qué corregir.
		if req.Motivo == nil || strings.TrimSpace(*req.Motivo) == "" {
			return errors.New("debes escribir el motivo del rechazo de la asesoría (R26)")
		}
		return s.transicionarFase1(proj, "OBSERVADO_ASESOR", "RECHAZADO", req.Motivo, idUsuario, rolAsesorID(s.db))
	}
	return errors.New("decisión inválida: use ACEPTAR o RECHAZAR")
}

// EnviarAAsesor (HU-F1-03) remite la propuesta al docente asesor.
//
// Antes del envío se validan los CA de HU-F1-02: equipo completo y
// cronograma con las horas minimas. El envio deja el proyecto en
// ENVIADO_ASESOR, congelando el contenido tecnico.
func (s *ProyectoService) EnviarAAsesor(req EnviarAsesorReq, idUsuario uint) error {
	proj, err := s.proyectoRepo.FindByID(req.ProyectoID)
	if err != nil {
		return errors.New("proyecto no encontrado")
	}
	estadoActual := codigoEstadoDe(s.db, proj.IDEstadoActual)
	if estadoActual != "BORRADOR" && estadoActual != "OBSERVADO_ASESOR" {
		return fmt.Errorf("el proyecto está en %s: solo se envía al asesor desde BORRADOR o tras un rechazo", estadoActual)
	}
	// El asesor puede cambiarse solo tras un rechazo (CA-6.2).
	if req.IDDocenteAsesor != nil {
		if estadoActual == "BORRADOR" {
			return errors.New("el docente asesor se define al crear el proyecto")
		}
		proj.IDDocenteAsesor = req.IDDocenteAsesor
		if err := s.proyectoRepo.Update(proj); err != nil {
			return err
		}
	}
	if proj.IDDocenteAsesor == nil {
		return errors.New("debes indicar el docente asesor del proyecto")
	}
	// CA-4.2 en el momento del envio: si el docente ya lleno su cupo en el
	// ciclo, se avisa antes de remitir la propuesta.
	max := int(maxProyectosDocente(s.db))
	if n, err := s.docenteRepo.ProyectosAsesoradosActivosEnCiclo(*proj.IDDocenteAsesor, proj.IDCicloCreacion, 0); err == nil {
		if err := validarCupoAsesor(int(n), max); err != nil {
			return err
		}
	}
	var comentario *string
	if c := strings.TrimSpace(req.Comentario); c != "" {
		comentario = &c
	}
	return s.transicionarFase1(proj, "ENVIADO_ASESOR", "APROBADO", comentario, idUsuario, rolEstudiantePropID(s.db))
}

// transicionarFase1 mueve el proyecto a un estado de Fase 1 dejando
// trazabilidad y notificando a las partes interested.
func (s *ProyectoService) transicionarFase1(proj *domain.RSUProyecto, destino, resultado string,
	comentarios *string, idUsuario uint, idRolActor int) error {

	destinoID, err := s.flujoRepo.ResolverEstadoCodigo(destino)
	if err != nil {
		return fmt.Errorf("estado destino inválido: %s", destino)
	}
	if !flujoRepoValida(s.db, proj.IDEstadoActual, destinoID, uint(idRolActor)) {
		return fmt.Errorf("transición no permitida: revise el flujo BPMN y el rol actor")
	}
	flujo := &domain.RSUFlujoAprobacion{
		IDProyecto:      proj.ID,
		IDEstadoOrigen:  proj.IDEstadoActual,
		IDEstadoDestino: destinoID,
		IDRolActor:      uint(idRolActor),
		IDUsuario:       idUsuario,
		Comentarios:     comentarios,
		Resultado:       resultado,
		FechaTransicion: time.Now(),
	}
	if err := s.flujoRepo.Create(flujo); err != nil {
		return err
	}
	if err := s.proyectoRepo.UpdateEstado(proj.ID, destinoID); err != nil {
		return err
	}
	s.notificarCambioEstadoFase1(proj, destino, comentarios)
	return nil
}

// notificarCambioEstadoFase1 cumple CA-7.6: todo cambio de estado de
// Fase 1 notifica a las partes involucradas.
//
// La pertenencia importa: el aviso del estudiante líder y el del docente
// asesor van dirigidos a ESA persona (id_usuario), no a una bandera de rol.
// Con bandera de rol todos los docentes veían los avisos de proyectos que
// no asesoran y el expediente no les cargaba.
//
// A los actores institucionales (Dirección de Escuela y Dir. RS de la
// Facultad) sí les corresponde la bandera de rol: por su ámbito les toca ver
// todos los proyectos de la Facultad.
func (s *ProyectoService) notificarCambioEstadoFase1(proj *domain.RSUProyecto, destino string, comentarios *string) {
	var conComments string
	if comentarios != nil {
		conComments = strings.TrimSpace(*comentarios)
	}
	aviso := conComments
	if aviso == "" {
		aviso = "Sin comentarios"
	}
	mensaje := fmt.Sprintf("%s «%s» pasó a %s. %s",
		proj.CodigoProyecto, proj.Titulo, destino, aviso)
	titulo := fmt.Sprintf("%s — %s", destino, proj.CodigoProyecto)

	// Dirigidos a la persona concreta del proyecto.
	if proj.IDEstudianteLider != nil {
		s.pushNotificacion("ESTUDIANTE_PROP", "TRANSICION", titulo, &mensaje, &proj.ID,
			s.idUsuarioDePersona("ESTUDIANTE", proj.IDEstudianteLider))
	}
	if proj.IDDocenteAsesor != nil {
		s.pushNotificacion("DOCENTE_RESP", "TRANSICION", titulo, &mensaje, &proj.ID,
			s.idUsuarioDePersona("DOCENTE", proj.IDDocenteAsesor))
	}

	// Autoridades de la Facultad: por su ámbito les corresponde verlos todos.
	for _, rol := range []string{"DIR_ESCUELA", "DIR_RS_FACULTAD"} {
		s.pushNotificacion(rol, "TRANSICION", titulo, &mensaje, &proj.ID, nil)
	}
}

// ─────────────────────────────────────────────────────────────────
// HU-F1-07 — Reactivación de un proyecto archivado por vencimiento
// ─────────────────────────────────────────────────────────────────

// ReactivarArchivado (CA-7.4 / CA-7.5) devuelve el proyecto archivado a
// BORRADOR para que el lider lo reenvíe. Solo procede si el docente
// asesor tiene cupo libre en el ciclo: es el estándar fijado por el
// usuario (un proyecto bloqueado no se abre hasta que el docente
// tenga otro cupo libre).
func (s *ProyectoService) ReactivarArchivado(idProyecto, idCiclo uint, idUsuario uint) error {
	proj, err := s.proyectoRepo.FindByID(idProyecto)
	if err != nil {
		return errors.New("proyecto no encontrado")
	}
	if codigoEstadoDe(s.db, proj.IDEstadoActual) != "ARCHIVADO_VENCIMIENTO" {
		return errors.New("el proyecto no está archivado por vencimiento")
	}
	if proj.IDDocenteAsesor == nil {
		return errors.New("el proyecto no tiene docente asesor registrado")
	}
	max := int(maxProyectosDocente(s.db))
	n, err := s.docenteRepo.ProyectosAsesoradosActivosEnCiclo(*proj.IDDocenteAsesor, proj.IDCicloCreacion, proj.ID)
	if err != nil {
		return err
	}
	cupoLibre := int(n) < max
	if err := validarReactivacionArchivado(cupoLibre); err != nil {
		return err
	}
	return s.transicionarFase1(proj, "BORRADOR", "APROBADO", nil, idUsuario, rolEstudiantePropID(s.db))
}

// HorasCronogramaProyecto suma las horas planificadas del proyecto a
// partir de la duración de sus actividades (CA-2.4).
func (s *ProyectoService) HorasCronogramaProyecto(idProyecto uint) (float64, error) {
	var minutos *float64
	err := s.db.Model(&domain.RSUActividadCampo{}).
		Select("COALESCE(SUM(minutos),0)").
		Where("id_proyecto = ?", idProyecto).
		Scan(&minutos).Error
	if minutos == nil {
		return 0, err
	}
	return *minutos / 60, err
}

// ValidarEnvioProposal aplica los CA de HU-F1-02 antes de enviar al asesor:
// cronograma minimo de horas (CA-2.4) y advertencia de prorroga (CA-2.6).
func (s *ProyectoService) ValidarEnvioPropuesta(idProyecto uint) error {
	horas, err := s.HorasCronogramaProyecto(idProyecto)
	if err != nil {
		return err
	}
	minimo := minimoHorasSSU(s.db)
	if err := validarHorasCronograma(horas, minimo); err != nil {
		return err
	}
	if adv, ok := revisarHorasCronograma(horas, minimo); ok {
		return &AdvertenciaHorasError{Mensaje: adv}
	}
	return nil
}

// AdvertenciaHorasError representa una advertencia NO bloqueante: el
// proyecto puede enviarse, pero queda en condicion de prorroga.
type AdvertenciaHorasError struct{ Mensaje string }

func (e *AdvertenciaHorasError) Error() string { return e.Mensaje }

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

// codigoEstadoDe traduce el id de estado del proyecto a su código.
func codigoEstadoDe(db *gorm.DB, id uint) string {
	var codigo string
	if err := db.Model(&domain.RSUEstadoProyecto{}).
		Select("codigo").Where("id_estado = ?", id).Scan(&codigo).Error; err != nil {
		return ""
	}
	return codigo
}

// flujoRepoValida confirma que la tupla (origen, destino, rol) exista en
// RSU_Transicion_Estado: una transición solo procede si el flujo la autoriza.
func flujoRepoValida(db *gorm.DB, origen, destino, rol uint) bool {
	var n int64
	db.Table("RSU_Transicion_Estado").
		Where("estado_origen = ? AND estado_destino = ? AND id_rol_actor = ?", origen, destino, rol).
		Count(&n)
	return n > 0
}

// idRolActorByCodigo resuelve el id de RSU_Rol_Actor a partir del código.
func idRolActorByCodigo(db *gorm.DB, codigo string) int {
	var id int
	if err := db.Model(&domain.RSURolActor{}).
		Select("id_rol_actor").Where("codigo = ?", codigo).Scan(&id).Error; err != nil {
		return 0
	}
	return id
}

func rolAsesorID(db *gorm.DB) int { return idRolActorByCodigo(db, "DOCENTE_RESP") }

func rolEstudiantePropID(db *gorm.DB) int { return idRolActorByCodigo(db, "ESTUDIANTE_PROP") }

func rolAdminID(db *gorm.DB) int { return idRolActorByCodigo(db, "ADMIN") }

// minimoHorasSSU lee RSU_Configuracion.minimo_horas_ssu. Hasta ahora esa
// clave era código muerto; HU-F1-02 la convierte en configuración efectiva.
func minimoHorasSSU(db *gorm.DB) float64 {
	var valor *string
	db.Model(&domain.RSUConfiguracion{}).
		Select("valor").Where("clave = ?", "minimo_horas_ssu").Scan(&valor)
	if valor == nil || strings.TrimSpace(*valor) == "" {
		return MinimoHorasSSU
	}
	var n float64
	if _, err := fmt.Sscanf(strings.TrimSpace(*valor), "%g", &n); err != nil || n <= 0 {
		return MinimoHorasSSU
	}
	return n
}
