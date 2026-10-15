package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/repository"
)

// ── Proyecto Service (núcleo RSU) ────────────────────────────

type ProyectoService struct {
	proyectoRepo   *repository.ProyectoRepo
	docenteRepo    *repository.DocenteRepo
	estudianteRepo *repository.EstudianteRepo
	catalogoRepo   *repository.CatalogoRepo
	flujoRepo      *repository.FlujoRepo
	db             *gorm.DB
}

func NewProyectoService(db *gorm.DB) *ProyectoService {
	return &ProyectoService{
		proyectoRepo:   repository.NewProyectoRepo(db),
		docenteRepo:    repository.NewDocenteRepo(db),
		estudianteRepo: repository.NewEstudianteRepo(db),
		catalogoRepo:   repository.NewCatalogoRepo(db),
		flujoRepo:      repository.NewFlujoRepo(db),
		db: db,
	}
}

// rolDestinoPorEstado devuelve el rol actor que debe actuar al LLEGAR a un estado.
// Se busca el rol que tiene una transición DESDE ese estado (el siguiente lane del flujo),
// no el que la ejecutó, para que la notificación caiga en la bandeja correcta.
func (s *ProyectoService) rolDestinoPorEstado(estadoCodigo string) string {
	var codigo string
	err := s.db.Model(&domain.RSUTransicionEstado{}).
		Select("r.\"codigo\"").
		Joins(`JOIN "RSU_Estado_Proyecto" e ON e."id_estado" = "RSU_Transicion_Estado"."estado_origen"`).
		Joins(`JOIN "RSU_Rol_Actor" r ON r."id_rol_actor" = "RSU_Transicion_Estado"."id_rol_actor"`).
		Where(`e."codigo" = ?`, estadoCodigo).
		Order(`"RSU_Transicion_Estado"."id_transicion" ASC`).
		Scan(&codigo).Error
	if err == nil && codigo != "" {
		return codigo
	}
	return ""
}

func (s *ProyectoService) pushNotificacion(rolDestino, tipo, titulo string, mensaje *string, idProyecto *uint, idUsuario *uint) {
	if rolDestino == "" {
		return
	}
	// valida que rolDestino exista en RSU_Rol_Actor para no violar FK
	var ra domain.RSURolActor
	if err := s.db.First(&ra, "codigo = ?", rolDestino).Error; err != nil {
		return
	}
	n := &domain.RSUNotificacion{
		RolDestino: rolDestino,
		Tipo:       tipo,
		Titulo:     titulo,
		Mensaje:    mensaje,
		IDProyecto: idProyecto,
		IDUsuario:  idUsuario,
		Leido:      false,
	}
	_ = s.db.Create(n).Error
}

// idUsuarioDePersona traduce el id de persona (Docente/Estudiante) al id de
// RSU_Usuario. Sin esto las notificaciones "personales" quedaban con el id de
// persona y el filtro individual del header no las encontraba: todos veían
// los avisos de los demás.
func (s *ProyectoService) idUsuarioDePersona(tipoUsuario string, idPersona *uint) *uint {
	if idPersona == nil || *idPersona == 0 {
		return nil
	}
	var u domain.RSUUsuario
	if err := s.db.Where("tipo_usuario = ? AND id_persona = ?", tipoUsuario, *idPersona).First(&u).Error; err != nil {
		return nil
	}
	return &u.ID
}

func (s *ProyectoService) Create(req dto.CreateProyectoReq) (*domain.RSUProyecto, error) {
	// HU-069: modalidad explícita con default SSU + regla por rol.
	modalidad := strings.ToUpper(strings.TrimSpace(req.Modalidad))
	if modalidad == "" {
		modalidad = "SSU"
	}
	switch modalidad {
	case "SSU", "PEP_FINANCIADO", "PEP_AUTOFINANCIADO", "VOLUNTARIADO", "PUBLICACION_CIENTIFICA":
	default:
		return nil, errors.New("modalidad inválida (SSU, PEP_FINANCIADO, PEP_AUTOFINANCIADO, VOLUNTARIADO, PUBLICACION_CIENTIFICA)")
	}
	if req.IDEstudianteLider != nil && (modalidad == "PEP_FINANCIADO" || modalidad == "PEP_AUTOFINANCIADO") {
		return nil, errors.New("los proyectos PEP los crea el docente responsable o el Comité; el estudiante solo crea SSU o Voluntariado")
	}
	// Regla V4: estudiante solo 1 proyecto activo a la vez (lider o participante INSCRITO/ACTIVO). Si lo retiran (RETIRADO/FINALIZADO) queda libre.
	if req.IDEstudianteLider != nil {
		var cnt int64
		s.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO')", *req.IDEstudianteLider).Count(&cnt)
		if cnt > 0 {
			return nil, errors.New("el estudiante ya pertenece a un proyecto activo. Debe ser retirado del proyecto anterior para crear uno nuevo")
		}
		// también verifica si es lider de un proyecto aún no finalizado (fallback sin participante)
		var cntLider int64
		s.db.Model(&domain.RSUProyecto{}).Where("id_estudiante_lider = ? AND activo = true", *req.IDEstudianteLider).Joins("JOIN \"RSU_Estado_Proyecto\" e ON \"RSU_Proyecto\".\"id_estado_actual\" = e.\"id_estado\"").Where("e.\"codigo\" NOT IN ('CERRADO','REPORTADO_SUNEDU','EVALUACION_VALIDADA')").Count(&cntLider)
		if cntLider > 0 {
			return nil, errors.New("el estudiante ya lidera un proyecto activo. Solo un proyecto a la vez")
		}
		tipo, err := s.getTipo(req.IDTipo)
		if err != nil { return nil, err }
		cicloNum, err := s.estudianteRepo.GetCicloNumerico(*req.IDEstudianteLider, req.IDCicloCreacion)
		if err != nil {
			return nil, errors.New("estudiante no matriculado en el ciclo indicado o ciclo incorrecto")
		}
		if cicloNum < tipo.CicloMinimo {
			return nil, fmt.Errorf("ciclo mínimo requerido para %s es ciclo %d, estudiante está en ciclo %d", tipo.Nombre, tipo.CicloMinimo, cicloNum)
		}
	}
	// Validar estado inicial = BORRADOR (orden 1)
	var estado domain.RSUEstadoProyecto
	if err := s.db.Where("codigo = ?", "BORRADOR").First(&estado).Error; err != nil {
		return nil, errors.New("estado BORRADOR no configurado en BD")
	}
	// Validar fechas
	if req.FechaInicioPlan != nil && req.FechaFinPlan != nil {
		fi, _ := time.Parse("2006-01-02", *req.FechaInicioPlan)
		ff, _ := time.Parse("2006-01-02", *req.FechaFinPlan)
		if !ff.After(fi) {
			return nil, errors.New("fecha_fin_plan debe ser posterior a fecha_inicio_plan")
		}
	}
	p := &domain.RSUProyecto{
		CodigoProyecto: req.CodigoProyecto,
		Titulo:         req.Titulo,
		IDEscuela:      req.IDEscuela,
		IDTipo:         req.IDTipo,
		Modalidad:      modalidad,
		IDLineaAccion:  req.IDLineaAccion,
		IDEstadoActual: estado.ID,
		IDCicloCreacion: req.IDCicloCreacion,
		IDEstudianteLider: req.IDEstudianteLider,
		IDDocenteAsesor: req.IDDocenteAsesor,
		Descripcion: req.Descripcion,
		ObjetivoGeneral: req.ObjetivoGeneral,
		ObjetivosEspecificos: req.ObjetivosEspecificos,
		PoblacionBeneficiaria: req.PoblacionBeneficiaria,
		SectorBeneficiario: req.SectorBeneficiario,
		LugarIntervencion: req.LugarIntervencion,
		PresupuestoSolicitado: req.PresupuestoSolicitado,
		Activo: true,
	}
	if req.FechaInicioPlan != nil {
		if t, err := time.Parse("2006-01-02", *req.FechaInicioPlan); err == nil { p.FechaInicioPlan = &t }
	}
	if req.FechaFinPlan != nil {
		if t, err := time.Parse("2006-01-02", *req.FechaFinPlan); err == nil { p.FechaFinPlan = &t }
	}
	if err := s.proyectoRepo.Create(p); err != nil {
		low := strings.ToLower(err.Error())
		if strings.Contains(low, "duplicate") || strings.Contains(low, "unique") || strings.Contains(low, "violates unique") {
			return nil, errors.New("código de proyecto ya existe")
		}
		return nil, err
	}
	// HU-001 CA5 + HU-033: todo líder es automáticamente miembro del equipo (Ejecutor) para subir docs/entregables aunque no sea líder exclusivo
	if req.IDEstudianteLider != nil {
		// buscar rol Ejecutor (ESTUDIANTE)
		var rolEjec domain.RSURolProyecto
		if err := s.db.Where("nombre = ? AND aplica_a = 'ESTUDIANTE'", "Ejecutor").First(&rolEjec).Error; err == nil {
			pe := &domain.RSUParticipanteEstudiante{
				IDProyecto: p.ID, IDEstudiante: *req.IDEstudianteLider, IDRolProyecto: rolEjec.ID,
				FechaInscripcion: time.Now(), EstadoParticipacion: "ACTIVO", ValidacionCiclo: true,
			}
			_ = s.db.Create(pe).Error // ignora duplicado si ya existe
		}
	}
	projCreado, _ := s.proyectoRepo.FindByID(p.ID)
	// ── Notificaciones HU-052..055: crear proyecto → avisa al equipo + director escuela (cuando se envíe lo duplicará)
	if projCreado != nil {
		cod := projCreado.CodigoProyecto
		tit := projCreado.Titulo
		if req.IDEstudianteLider != nil {
			msg := fmt.Sprintf("Tu proyecto %s «%s» quedó en BORRADOR. Todo el equipo (líder o participantes) ya puede subir documentos y evidencias (HU-033).", cod, tit)
			idLider := s.idUsuarioDePersona("ESTUDIANTE", req.IDEstudianteLider)
			s.pushNotificacion("ESTUDIANTE_PROP", "PROYECTO_CREADO", "Proyecto creado en BORRADOR — "+cod, &msg, &projCreado.ID, idLider)
			s.pushNotificacion("ESTUDIANTE_EJEC", "PROYECTO_CREADO", "Nuevo proyecto en tu equipo — "+cod, &msg, &projCreado.ID, idLider)
		}
		if req.IDDocenteAsesor != nil {
			msg2 := fmt.Sprintf("Has sido asignado como asesor en %s «%s». Valida ciclo mínimo y carga no lectiva.", cod, tit)
			s.pushNotificacion("DOCENTE_RESP", "ASIGNACION", "Asignación como asesor — "+cod, &msg2, &projCreado.ID, s.idUsuarioDePersona("DOCENTE", req.IDDocenteAsesor))
		}
	}
	return projCreado, nil
}

func (s *ProyectoService) getTipo(id uint) (*domain.RSUTipoProyecto, error) {
	var t domain.RSUTipoProyecto
	err := s.db.First(&t, "id_tipo = ?", id).Error
	return &t, err
}

func (s *ProyectoService) List(page, limit int, estado, escuela *uint, search string, modalidades []string) ([]domain.RSUProyecto, int64, error) {
	return s.proyectoRepo.FindAll(page, limit, estado, escuela, search, modalidades)
}
func (s *ProyectoService) ListByEstudiante(page, limit int, idEstudiante uint, search string) ([]domain.RSUProyecto, int64, error) {
	return s.proyectoRepo.FindAllByEstudiante(page, limit, idEstudiante, search)
}
func (s *ProyectoService) ListByDocente(page, limit int, idDocente uint, search string) ([]domain.RSUProyecto, int64, error) {
	return s.proyectoRepo.FindAllByDocente(page, limit, idDocente, search)
}
func (s *ProyectoService) IsMiembro(idProyecto, idEstudiante uint) bool {
	return s.proyectoRepo.IsEstudianteMiembro(idProyecto, idEstudiante)
}
func (s *ProyectoService) Get(id uint) (*domain.RSUProyecto, error) { return s.proyectoRepo.FindByID(id) }

func (s *ProyectoService) Update(id uint, req dto.UpdateProyectoReq) (*domain.RSUProyecto, error) {
	p, err := s.proyectoRepo.FindByID(id)
	if err != nil { return nil, err }
	if req.Titulo != nil { p.Titulo = *req.Titulo }
	if req.Descripcion != nil { p.Descripcion = req.Descripcion }
	if req.ObjetivoGeneral != nil { p.ObjetivoGeneral = req.ObjetivoGeneral }
	if req.PorcentajeAvance != nil {
		if *req.PorcentajeAvance < 0 || *req.PorcentajeAvance > 100 {
			return nil, errors.New("porcentaje_avance debe estar entre 0 y 100")
		}
		p.PorcentajeAvance = *req.PorcentajeAvance
	}
	if req.PresupuestoSolicitado != nil { p.PresupuestoSolicitado = *req.PresupuestoSolicitado }
	if req.PresupuestoAprobado != nil { p.PresupuestoAprobado = *req.PresupuestoAprobado }
	if req.MontoEjecutado != nil { p.MontoEjecutado = *req.MontoEjecutado }
	if req.LugarIntervencion != nil { p.LugarIntervencion = req.LugarIntervencion }
	if err := s.proyectoRepo.Update(p); err != nil { return nil, err }
	return p, nil
}

func (s *ProyectoService) Transicion(idProyecto uint, req dto.TransicionReq) error {
	proj, err := s.proyectoRepo.FindByID(idProyecto)
	if err != nil {
		return err
	}

	// Resuelve el estado destino: por codigo si viene informado; si no,
	// toma el unico destino valido para (estado_actual, rol_actor).
	var destinoID uint
	codigo := strings.TrimSpace(req.EstadoDestino)
	if codigo == "" {
		destinos, err := s.flujoRepo.DestinosValidos(proj.IDEstadoActual, req.IDRolActor)
		if err != nil {
			return err
		}
		switch len(destinos) {
		case 0:
			return errors.New("transicion no permitida: tu rol no tiene accion para el estado actual del proyecto")
		case 1:
			codigo = destinos[0]
		default:
			return fmt.Errorf("indica el estado destino: tus opciones son %s", strings.Join(destinos, ", "))
		}
	}
	destinoID, err = s.flujoRepo.ResolverEstadoCodigo(codigo)
	if err != nil {
		return fmt.Errorf("estado destino invalido: %s", codigo)
	}

	// validar transicion permitida segun RSU_Transicion_Estado
	ok, err := s.flujoRepo.ValidTransicion(proj.IDEstadoActual, destinoID, req.IDRolActor)
	if err != nil {
		return err
	}
	if !ok {
		return errors.New("transicion no permitida: revise flujo BPMN y rol actor")
	}

	// R26: observar o rechazar exige motivo — sin él el emisor no sabe qué corregir.
	if req.Resultado != "APROBADO" && (req.Comentarios == nil || strings.TrimSpace(*req.Comentarios) == "") {
		return errors.New("debes escribir el motivo de la devolución (R26)")
	}

	// R27 / HU-005 / HU-007: el V°B° de Escuela y el dictamen del Consejo
	// (con Resolución) exigen PDF firmado de sustento. Sin documento no aprob.
	if req.Resultado == "APROBADO" && req.IDDocumentoSustento == nil {
		switch codigo {
		case "CON_VB_ESCUELA", "APROBADO_CON_RESOLUCION":
			return errors.New("esta aprobación requiere adjuntar el PDF firmado (R27). Súbelo en Documentos y referencia su id")
		}
	}

	// crear registro de trazabilidad
	flujo := &domain.RSUFlujoAprobacion{
		IDProyecto:          idProyecto,
		IDEstadoOrigen:      proj.IDEstadoActual,
		IDEstadoDestino:      destinoID,
		IDRolActor:          req.IDRolActor,
		IDUsuario:           req.IDUsuario,
		IDDocumentoSustento: req.IDDocumentoSustento,
		Comentarios:         req.Comentarios,
		Resultado:           req.Resultado,
		FechaTransicion:     time.Now(),
	}
	if err := s.flujoRepo.Create(flujo); err != nil {
		return err
	}
	// El estado se mueve también al rechazar, devolver u observar: si queda en
	// el estado anterior, el rebote RECHAZADO → BORRADOR (R25/R31) nunca
	// encuentra el proyecto en RECHAZADO y el flujo de corrección se traba.
	if req.Resultado == "APROBADO" || req.Resultado == "RECHAZADO" || req.Resultado == "DEVUELTO" || req.Resultado == "OBSERVADO" {
		if err := s.proyectoRepo.UpdateEstado(idProyecto, destinoID); err != nil {
			return err
		}
	}
	// ── Circuito de notificaciones del flujo (HU-052..055, R26/R31/R32) ──
	// Dos caminos según el resultado:
	//   APROBADO/derivado → avisa al lane DESTINO (quien debe actuar ahora).
	//   RECHAZADO/OBSERVADO/DEVUELTO → vuelve al EMISOR con el motivo (R26).
	// Las notificaciones de lane son bandera de rol (id_usuario NULL): las ve
	// cualquier usuario con ese rol_destino. Antes llevaban el id del ejecutor
	// y el destinatario real nunca las veía en su campana.
	var estadoDest domain.RSUEstadoProyecto
	if err := s.db.First(&estadoDest, "id_estado = ?", destinoID).Error; err == nil {
		titulo := proj.Titulo
		cod := proj.CodigoProyecto
		nombreRolActor := s.nombreRolActor(req.IDRolActor)
		if req.Resultado == "APROBADO" {
			if rolDestino := s.rolDestinoPorEstado(estadoDest.Codigo); rolDestino != "" {
				msg := fmt.Sprintf("El proyecto %s «%s» avanzó a %s. Te toca revisarlo en tu bandeja.", cod, titulo, estadoDest.Nombre)
				tituloNotif := fmt.Sprintf("%s — %s", estadoDest.Nombre, cod)
				s.pushNotificacion(rolDestino, "TRANSICION", tituloNotif, &msg, &idProyecto, nil)
			}
			teamMsg := fmt.Sprintf("Avance! %s cambió a %s. El equipo puede seguir subiendo evidencias.", cod, estadoDest.Nombre)
			s.pushNotificacion("ESTUDIANTE_EJEC", "AVANCE_EQUIPO", teamMsg, &teamMsg, &idProyecto, nil)
			s.pushNotificacion("DOCENTE_RESP", "AVANCE_EQUIPO", teamMsg, &teamMsg, &idProyecto, proj.IDDocenteAsesor)
		} else {
			// Rechazo/observación: R26 exige motivo — se valida antes de registrar.
			// Vuelve a quien puede corregir y reenviar: los roles con salida
			// desde RECHAZADO (R25/R31: estudiante o docente que propuso).
			rolEmisor := s.rolDestinoPorEstado(estadoDest.Codigo)
			if rolEmisor != "" {
				motivo := "(sin motivo)"
				if req.Comentarios != nil && strings.TrimSpace(*req.Comentarios) != "" {
					motivo = *req.Comentarios
				}
				msg := fmt.Sprintf("%s devolvió tu proyecto %s «%s» desde %s. Motivo: %s. Corrígelo y vuelve a enviarlo.",
					nombreRolActor, cod, titulo, proj.EstadoActual.Nombre, motivo)
				tituloNotif := fmt.Sprintf("Devuelto: %s — %s", proj.EstadoActual.Nombre, cod)
				s.pushNotificacion(rolEmisor, "TRANSICION_DEVUELTA", tituloNotif, &msg, &idProyecto, nil)
			}
		}
	}
	return nil
}

// nombreRolActor devuelve el nombre legible del rol (para los mensajes).
func (s *ProyectoService) nombreRolActor(idRol uint) string {
	var ra domain.RSURolActor
	if err := s.db.First(&ra, "id_rol_actor = ?", idRol).Error; err == nil {
		return ra.Nombre
	}
	return "El revisor"
}

// rolEmisorPorEstado devuelve el rol que ENVIÓ el proyecto desde ese estado
// (quien tiene una transición de salida hacia la revisión): es quien debe
// recibir la devolución cuando el revisor rechaza u observa.
func (s *ProyectoService) rolEmisorPorEstado(estadoCodigo string) string {
	var codigo string
	// Salida "hacia adelante" (no a RECHAZADO): el emisor original.
	err := s.db.Model(&domain.RSUTransicionEstado{}).
		Select(`r."codigo"`).
		Joins(`JOIN "RSU_Estado_Proyecto" e ON e."id_estado" = "RSU_Transicion_Estado"."estado_origen"`).
		Joins(`JOIN "RSU_Estado_Proyecto" d ON d."id_estado" = "RSU_Transicion_Estado"."estado_destino"`).
		Joins(`JOIN "RSU_Rol_Actor" r ON r."id_rol_actor" = "RSU_Transicion_Estado"."id_rol_actor"`).
		Where(`e."codigo" = ? AND d."codigo" <> 'RECHAZADO'`, estadoCodigo).
		Order(`"RSU_Transicion_Estado"."id_transicion" ASC`).
		Limit(1).
		Scan(&codigo).Error
	if err == nil && codigo != "" {
		return codigo
	}
	return ""
}
func (s *ProyectoService) Historial(id uint) ([]domain.RSUFlujoAprobacion, error) {
	return s.flujoRepo.History(id)
}

func (s *ProyectoService) ResumenVw(page, limit int) ([]domain.VwProyectoResumen, int64, error) {
	return s.proyectoRepo.VwResumen(page, limit)
}

