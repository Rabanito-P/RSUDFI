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

func (s *ProyectoService) Create(req dto.CreateProyectoReq) (*domain.RSUProyecto, error) {
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
			s.pushNotificacion("ESTUDIANTE_PROP", "PROYECTO_CREADO", "Proyecto creado en BORRADOR — "+cod, &msg, &projCreado.ID, req.IDEstudianteLider)
			s.pushNotificacion("ESTUDIANTE_EJEC", "PROYECTO_CREADO", "Nuevo proyecto en tu equipo — "+cod, &msg, &projCreado.ID, req.IDEstudianteLider)
		}
		if req.IDDocenteAsesor != nil {
			msg2 := fmt.Sprintf("Has sido asignado como asesor en %s «%s». Valida ciclo mínimo y carga no lectiva.", cod, tit)
			s.pushNotificacion("DOCENTE_RESP", "ASIGNACION", "Asignación como asesor — "+cod, &msg2, &projCreado.ID, req.IDDocenteAsesor)
		}
	}
	return projCreado, nil
}

func (s *ProyectoService) getTipo(id uint) (*domain.RSUTipoProyecto, error) {
	var t domain.RSUTipoProyecto
	err := s.db.First(&t, "id_tipo = ?", id).Error
	return &t, err
}

func (s *ProyectoService) List(page, limit int, estado, escuela *uint, search string) ([]domain.RSUProyecto, int64, error) {
	return s.proyectoRepo.FindAll(page, limit, estado, escuela, search)
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
	// actualizar estado actual solo si APROBADO
	if req.Resultado == "APROBADO" {
		if err := s.proyectoRepo.UpdateEstado(idProyecto, destinoID); err != nil {
			return err
		}
	}
	// Notificaciones por transicion (HU-052..055): avisa al lane destino
	var estadoDest domain.RSUEstadoProyecto
	if err := s.db.First(&estadoDest, "id_estado = ?", destinoID).Error; err == nil {
		rolDestino := s.rolDestinoPorEstado(estadoDest.Codigo)
		titulo := proj.Titulo
		cod := proj.CodigoProyecto
		msg := fmt.Sprintf("Proyecto %s (%s) -> %s [%s]. Resultado: %s. Revisa tu bandeja.", cod, titulo, estadoDest.Nombre, estadoDest.Codigo, req.Resultado)
		tituloNotif := fmt.Sprintf("Transicion %s -> %s - %s", proj.EstadoActual.Codigo, estadoDest.Codigo, cod)
		s.pushNotificacion(rolDestino, "TRANSICION", tituloNotif, &msg, &idProyecto, &req.IDUsuario)
		if req.Resultado == "APROBADO" {
			teamMsg := fmt.Sprintf("Avance! %s cambio a %s. Equipo: pueden seguir subiendo evidencias.", cod, estadoDest.Nombre)
			s.pushNotificacion("ESTUDIANTE_EJEC", "AVANCE_EQUIPO", teamMsg, &teamMsg, &idProyecto, nil)
			s.pushNotificacion("DOCENTE_RESP", "AVANCE_EQUIPO", teamMsg, &teamMsg, &idProyecto, proj.IDDocenteAsesor)
		}
	}
	return nil
}

func (s *ProyectoService) Historial(id uint) ([]domain.RSUFlujoAprobacion, error) {
	return s.flujoRepo.History(id)
}

func (s *ProyectoService) ResumenVw(page, limit int) ([]domain.VwProyectoResumen, int64, error) {
	return s.proyectoRepo.VwResumen(page, limit)
}

