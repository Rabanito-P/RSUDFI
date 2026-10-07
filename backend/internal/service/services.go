package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/repository"

	"gorm.io/gorm"
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

// mapa BPMN estado -> rol responsable (lane) — duplica utils/permissions.ts ESTADOS para notificaciones
var estadoActorMap = map[string]string{
	"BORRADOR":                   "ESTUDIANTE_PROP",
	"EN_REVISION_ESCUELA":        "DIR_ESCUELA",
	"CON_VB_ESCUELA":             "COMITE_PS",
	"EN_PRIORIZACION_FACULTAD":   "DIR_RS_FACULTAD",
	"EN_DICTAMEN_CONSEJO":        "CONSEJO_FACULTAD",
	"APROBADO_CON_RESOLUCION":    "CONSEJO_FACULTAD",
	"EN_ASIGNACION_CARGA":        "DIR_DEPTO",
	"REGISTRADO_OFICIAL":         "DIR_CENTRAL_RS",
	"EN_EJECUCION":               "DOCENTE_RESP",
	"EN_MONITOREO":               "DIR_RS_FACULTAD",
	"INFORME_FINAL_PRESENTADO":   "ESTUDIANTE_EJEC",
	"CON_CONFORMIDAD_ESCUELA":    "DIR_ESCUELA",
	"CERRADO":                    "CONSEJO_FACULTAD",
	"EN_EVALUACION_IMPACTO":      "COMITE_CALIDAD",
	"EVALUACION_VALIDADA":        "COMITE_CALIDAD",
	"REPORTADO_SUNEDU":           "DIR_CENTRAL_RS",
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
	if err != nil { return err }
	// validar transición permitida según RSU_Transicion_Estado
	ok, err := s.flujoRepo.ValidTransicion(proj.IDEstadoActual, req.EstadoDestino, req.IDRolActor)
	if err != nil { return err }
	if !ok {
		return errors.New("transición no permitida: revise flujo BPMN y rol actor")
	}
	// crear registro flujo
	flujo := &domain.RSUFlujoAprobacion{
		IDProyecto: idProyecto,
		IDEstadoOrigen: proj.IDEstadoActual,
		IDEstadoDestino: req.EstadoDestino,
		IDRolActor: req.IDRolActor,
		IDUsuario: req.IDUsuario,
		IDDocumentoSustento: req.IDDocumentoSustento,
		Comentarios: req.Comentarios,
		Resultado: req.Resultado,
		FechaTransicion: time.Now(),
	}
	if err := s.flujoRepo.Create(flujo); err != nil { return err }
	// actualizar estado actual solo si APROBADO
	if req.Resultado == "APROBADO" {
		if err := s.proyectoRepo.UpdateEstado(idProyecto, req.EstadoDestino); err != nil { return err }
	}
	// ── Notificaciones por transición (HU-052..055): avisa al lane destino
	var estadoDest domain.RSUEstadoProyecto
	if err := s.db.First(&estadoDest, "id_estado = ?", req.EstadoDestino).Error; err == nil {
		rolDestino := estadoActorMap[estadoDest.Codigo]
		// si no hay mapping directo, deduce del id_rol_actor de la transicion destino? fallback
		if rolDestino == "" {
			var ra domain.RSURolActor
			if err2 := s.db.First(&ra, "id_rol_actor = ?", req.IDRolActor).Error; err2 == nil {
				rolDestino = ra.Codigo
			}
		}
		// busca proyecto para título
		var titulo string
		if proj.Titulo != "" {
			titulo = proj.Titulo
		}
		cod := proj.CodigoProyecto
		msg := fmt.Sprintf("Proyecto %s «%s» → %s (%s). Resultado previo: %s. Revisa tu bandeja.", cod, titulo, estadoDest.Nombre, estadoDest.Codigo, req.Resultado)
		tituloNotif := fmt.Sprintf("Transición %s → %s — %s", proj.EstadoActual.Codigo, estadoDest.Codigo, cod)
		// notifica al lane destino (pendiente)
		s.pushNotificacion(rolDestino, "TRANSICION", tituloNotif, &msg, &idProyecto, &req.IDUsuario)
		// además si es aprobación que envió a siguiente lane, notifica al origen que fue aprobado
		if req.Resultado == "APROBADO" && rolDestino != "" {
			// notifica también a ESTUDIANTE_PROP / DOCENTE_RESP cuando su envío fue aprobado
			origen := ""
			if proj.IDEstadoActual == 1 { // BORRADOR → revisión
				origen = "ESTUDIANTE_PROP"
			}
			_ = origen // placeholder para futuro equipo
		}
		// notifica a todo el equipo que hubo avance (ESTUDIANTE_EJEC + DOCENTE_RESP)
		if req.Resultado == "APROBADO" {
			teamMsg := fmt.Sprintf("¡Avance! %s cambió a %s. Equipo: pueden seguir subiendo evidencias.", cod, estadoDest.Nombre)
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

// ── Beneficiario Service ─────────────────────────────────────

type BeneficiarioService struct {
	repo *repository.BeneficiarioRepo
}
func NewBeneficiarioService(db *gorm.DB) *BeneficiarioService {
	return &BeneficiarioService{repo: repository.NewBeneficiarioRepo(db)}
}
func (s *BeneficiarioService) Create(req dto.CreateBeneficiarioReq) (*domain.RSUBeneficiario, error) {
	if req.TipoBeneficiario == "PERSONA_NATURAL" && (req.DNI == nil || *req.DNI == "") {
		return nil, errors.New("DNI requerido para persona natural")
	}
	if req.TipoBeneficiario == "INSTITUCION" && (req.RUC == nil || *req.RUC == "") {
		return nil, errors.New("RUC requerido para institución")
	}
	b := &domain.RSUBeneficiario{
		TipoBeneficiario: req.TipoBeneficiario,
		DNI: req.DNI, Nombres: req.Nombres, Apellidos: req.Apellidos,
		RUC: req.RUC, RazonSocial: req.RazonSocial,
		Celular: req.Celular, CorreoElectronico: req.Correo,
		Direccion: req.Direccion, Distrito: req.Distrito,
		Sexo: req.Sexo, CondicionVulnerabilidad: req.Condicion,
		Activo: true, FechaRegistro: time.Now(),
	}
	if err := s.repo.Create(b); err != nil {
		low := strings.ToLower(err.Error())
		if strings.Contains(low, "duplicate") || strings.Contains(low, "unique") {
			return nil, errors.New("beneficiario con DNI/RUC ya existe")
		}
		return nil, err
	}
	return b, nil
}
func (s *BeneficiarioService) List(page, limit int, search string) ([]domain.RSUBeneficiario, int64, error) {
	return s.repo.FindAll(page, limit, search)
}
func (s *BeneficiarioService) Get(id uint) (*domain.RSUBeneficiario, error) { return s.repo.FindByID(id) }
func (s *BeneficiarioService) Vincular(req dto.VincularBeneficiarioReq) error {
	if s.repo.ExistsVinculo(req.IDProyecto, req.IDBeneficiario) {
		return errors.New("beneficiario ya vinculado al proyecto")
	}
	pb := &domain.RSUProyectoBeneficiario{
		IDProyecto: req.IDProyecto, IDBeneficiario: req.IDBeneficiario,
		FechaIncorporacion: time.Now(), RolEnProyecto: req.RolEnProyecto, Activo: true,
	}
	return s.repo.Vincular(pb)
}
func (s *BeneficiarioService) ListByProyecto(idProyecto uint) ([]domain.RSUProyectoBeneficiario, error) {
	return s.repo.ListByProyecto(idProyecto)
}

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
	horasYa, _ := s.docenteRepo.HorasAsignadas(req.IDDocente, req.IDCiclo)
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
	p := &domain.RSUParticipanteEstudiante{
		IDProyecto: req.IDProyecto, IDEstudiante: req.IDEstudiante, IDRolProyecto: req.IDRolProyecto,
		FechaInscripcion: time.Now(), EstadoParticipacion: "ACTIVO", ValidacionCiclo: true,
	}
	if err := s.repo.CreateEstudiante(p); err != nil { return nil, err }
	return p, nil
}
func (s *AsignacionService) RetirarEstudiante(idProyecto, idEstudiante uint) error {
	return s.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO')", idProyecto, idEstudiante).Update("estado_participacion", "RETIRADO").Error
}
func (s *AsignacionService) ListDocentes(idProyecto uint) ([]domain.RSUAsignacionDocente, error) {
	return s.repo.ListDocentesByProyecto(idProyecto)
}
func (s *AsignacionService) ListEstudiantes(idProyecto uint) ([]domain.RSUParticipanteEstudiante, error) {
	return s.repo.ListEstudiantesByProyecto(idProyecto)
}

// ── Encuesta Service ─────────────────────────────────────────

type EncuestaService struct {
	encuestaRepo *repository.EncuestaRepo
	pregRepo     *repository.CatalogoRepo
	db           *gorm.DB
}
func NewEncuestaService(db *gorm.DB) *EncuestaService {
	return &EncuestaService{encuestaRepo: repository.NewEncuestaRepo(db), pregRepo: repository.NewCatalogoRepo(db), db: db}
}
func cualitativo(v int) string {
	switch v {
	case 1: return "MUY_MALO"
	case 2: return "MALO"
	case 3: return "REGULAR"
	case 4: return "BUENO"
	case 5: return "MUY_BUENO"
	default: return "REGULAR"
	}
}
func escalaGlobal(avg float64) string {
	switch {
	case avg >= 4.5: return "MUY_BUENO"
	case avg >= 3.5: return "BUENO"
	case avg >= 2.5: return "REGULAR"
	case avg >= 1.5: return "MALO"
	default: return "MUY_MALO"
	}
}
func (s *EncuestaService) CrearEncuestaBeneficiario(req dto.CreateEncuestaBenefReq) (*domain.RSUEncuestaBeneficiario, error) {
	// Validar que beneficiario esté vinculado al proyecto
	var c int64
	s.db.Model(&domain.RSUProyectoBeneficiario{}).Where("id_proyecto = ? AND id_beneficiario = ?", req.IDProyecto, req.IDBeneficiario).Count(&c)
	if c == 0 {
		return nil, errors.New("beneficiario no está vinculado al proyecto")
	}
	// Validar duplicado (UNIQUE uk_encuesta_proyecto_benef)
	var existe int64
	s.db.Model(&domain.RSUEncuestaBeneficiario{}).Where("id_proyecto = ? AND id_beneficiario = ?", req.IDProyecto, req.IDBeneficiario).Count(&existe)
	if existe > 0 {
		return nil, errors.New("ya existe encuesta para este beneficiario en el proyecto")
	}
	fecha, _ := time.Parse("2006-01-02", req.FechaAplicacion)
	if fecha.IsZero() { fecha = time.Now() }

	// Calcular promedio
	sum := 0
	for _, r := range req.Respuestas { sum += r.ValorNumerico }
	avg := float64(sum) / float64(len(req.Respuestas))
	calif := escalaGlobal(avg)

	enc := &domain.RSUEncuestaBeneficiario{
		IDProyecto: req.IDProyecto, IDBeneficiario: req.IDBeneficiario,
		FechaAplicacion: fecha, Modalidad: req.Modalidad,
		PromedioGeneral: &avg, Calificacion: &calif,
		Comentario: req.Comentario, Sugerencia: req.Sugerencia,
		Estado: "REGISTRADA",
	}
	if err := s.encuestaRepo.CreateEncuesta(enc); err != nil {
		return nil, err
	}
	// Crear respuestas
	for _, r := range req.Respuestas {
		resp := &domain.RSURespuestaEncuesta{
			IDEncuestaBenef: enc.ID, IDPregunta: r.IDPregunta,
			ValorNumerico: r.ValorNumerico, ValorCualitativo: cualitativo(r.ValorNumerico),
		}
		if err := s.encuestaRepo.CreateRespuesta(resp); err != nil {
			return nil, err
		}
	}
	return enc, nil
}
func (s *EncuestaService) ListByProyecto(idProyecto uint) ([]domain.RSUEncuestaBeneficiario, error) {
	return s.encuestaRepo.FindByProyecto(idProyecto)
}

// ── Dashboard Service ────────────────────────────────────────

type DashboardService struct {
	repo *repository.DashboardRepo
	encRepo *repository.EncuestaRepo
	db *gorm.DB
}
func NewDashboardService(db *gorm.DB) *DashboardService {
	return &DashboardService{repo: repository.NewDashboardRepo(db), encRepo: repository.NewEncuestaRepo(db), db: db}
}
func (s *DashboardService) KPIs() (*dto.DashboardKPIs, error) {
	var totalBenef int64
	s.db.Model(&domain.RSUBeneficiario{}).Count(&totalBenef)
	var totalDoc int64
	s.db.Model(&domain.Docente{}).Count(&totalDoc)
	var totalEst int64
	s.db.Model(&domain.Estudiante{}).Count(&totalEst)
	var sumaAprobado *float64
	s.db.Model(&domain.RSUProyecto{}).Select("COALESCE(SUM(presupuesto_aprobado),0)").Scan(&sumaAprobado)
	var sumaEjecutado *float64
	s.db.Model(&domain.RSUProyecto{}).Select("COALESCE(SUM(monto_ejecutado),0)").Scan(&sumaEjecutado)
	var avgSat *float64
	s.db.Model(&domain.RSUEncuestaBeneficiario{}).Select("AVG(promedio_general)").Scan(&avgSat)
	porEstado, _ := s.repo.CountByEstado()
	porFacultad, _ := s.repo.CountByFacultad()
	var enEjec int64
	s.db.Model(&domain.RSUProyecto{}).Joins("JOIN \"RSU_Estado_Proyecto\" e ON \"RSU_Proyecto\".\"id_estado_actual\" = e.\"id_estado\"").Where("e.\"codigo\" = ?", "EN_EJECUCION").Count(&enEjec)

	kpis := &dto.DashboardKPIs{
		TotalProyectos: s.repo.CountProyectos(),
		ProyectosEnEjecucion: enEjec,
		TotalBeneficiarios: totalBenef,
		TotalDocentes: totalDoc,
		TotalEstudiantes: totalEst,
		PromedioSatisfaccion: avgSat,
		ProyectosPorEstado:   []dto.EstadoCount{},
		ProyectosPorFacultad: []dto.FacultadCount{},
	}
	if sumaAprobado != nil { kpis.PresupuestoAprobado = *sumaAprobado }
	if sumaEjecutado != nil { kpis.PresupuestoEjecutado = *sumaEjecutado }
	for _, e := range porEstado {
		kpis.ProyectosPorEstado = append(kpis.ProyectosPorEstado, dto.EstadoCount{Estado: e.Estado, Total: e.Total, Color: e.Color})
	}
	for _, f := range porFacultad {
		kpis.ProyectosPorFacultad = append(kpis.ProyectosPorFacultad, dto.FacultadCount{Facultad: f.Facultad, Total: f.Total})
	}
	// asegurar nunca null para JSON (evita crash frontend .map en estado vacío)
	if kpis.ProyectosPorEstado == nil { kpis.ProyectosPorEstado = []dto.EstadoCount{} }
	if kpis.ProyectosPorFacultad == nil { kpis.ProyectosPorFacultad = []dto.FacultadCount{} }
	return kpis, nil
}
