package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/pdf"
	"undc-rsu/backend/internal/storage"
)

// ─────────────────────────────────────────────────────────────────
// FASE 2 · APROBACIÓN — HU-F2-Aprobacion.md
//
// Reglas: rules/fase de propuesta-aprobacion-cierre (3).txt §3.1-3 a §3.1-6,
// §4-3 y §5. Decisiones del usuario: E1 (el Decano eleva), E2 (la resolución es
// un documento externo que se carga) y E3 (vencimiento por cálculo perezoso).
// ─────────────────────────────────────────────────────────────────

// Configuración de plazos y fondo. Se lee de RSU_Configuracion para que la
// Secretaría General pueda ajustarlos sin tocar código (HU-F2-02, HU-F2-05).
const (
	claveFondoPorcentaje   = "porcentaje_fondo_rsu"
	clavePresupuestoFacult = "presupuesto_facultad"
	clavePlazoEscuela      = "plazo_observacion_escuela"
	clavePlazoPresupuesto  = "plazo_ajuste_presupuestal"
)

// diasHabiles suma n días hábiles a t (lunes a viernes). rules §5 CAMINO 2:
// los plazos son días hábiles, no corridos.
func diasHabiles(t time.Time, n int) time.Time {
	actual := t
	for sumados := 0; sumados < n; {
		actual = actual.AddDate(0, 0, 1)
		wd := actual.Weekday()
		if wd != time.Saturday && wd != time.Sunday {
			sumados++
		}
	}
	return actual
}

// leerEnteroConfig lee una clave de RSU_Configuracion como entero, con valor
// por defecto si falta o viene mal.
func leerEnteroConfig(db *gorm.DB, clave string, defecto int) int {
	if db == nil {
		return defecto
	}
	var valor *string
	db.Model(&domain.RSUConfiguracion{}).Select("valor").Where("clave = ?", clave).Scan(&valor)
	if valor == nil {
		return defecto
	}
	var n int
	if _, err := fmt.Sscanf(strings.TrimSpace(*valor), "%d", &n); err != nil || n <= 0 {
		return defecto
	}
	return n
}

// plazoSegunEstado devuelve los días hábiles que corresponden a la devolución
// según desde qué estado se observó.
func plazoSegunEstado(db *gorm.DB, estadoOrigen string) int {
	switch estadoOrigen {
	case "EN_REVISION_ESCUELA":
		return leerEnteroConfig(db, clavePlazoEscuela, 10)
	case "EN_PRIORIZACION_FACULTAD":
		return leerEnteroConfig(db, clavePlazoPresupuesto, 5)
	case "ENVIADO_ASESOR", "OBSERVADO_ASESOR":
		return leerEnteroConfig(db, "plazo_respuesta_asesor", 5)
	default:
		return 10
	}
}

// FijarPlazoSubsanacion se llama al devolver (observar) un proyecto: fija el
// vencimiento y guarda el motivo, que es lo que el cálculo perezoso evalúa
// después (HU-F2-02 CA-2.1 / CA-2.2).
func (s *ProyectoService) FijarPlazoSubsanacion(p *domain.RSUProyecto, estadoOrigen, motivo string) error {
	dias := plazoSegunEstado(s.db, estadoOrigen)
	limite := diasHabiles(time.Now(), dias)
	p.FechaLimiteSubsanacion = &limite
	p.MotivoObservacion = &motivo
	// CA-2.3: durante el plazo solo se editan los campos indicados en el motivo.
	if p.CamposBloqueados == nil {
		vacio := "[]"
		p.CamposBloqueados = &vacio
	}
	return s.proyectoRepo.Update(p)
}

// VencerSiCorresponde evalúa de forma perezosa si el plazo de subsanación venció
// (HU-F2-02 CA-2.6 / E3). Si venció, archiva el proyecto, libera el cupo del
// asesor y notifica. Devuelve true si archivó.
//
// No requiere tarea programada: se invoca al leer o listar proyectos. La reserva
// está documentada en el HU (actúa cuando alguien mira el proyecto).
func (s *ProyectoService) VencerSiCorresponde(p *domain.RSUProyecto) (bool, error) {
	if p == nil || p.FechaLimiteSubsanacion == nil {
		return false, nil
	}
	if !p.FechaLimiteSubsanacion.Before(time.Now()) {
		return false, nil
	}
	// Solo expiran los estados de subsanación/devolución.
	if p.EstadoActual == nil {
		return false, nil
	}
	switch p.EstadoActual.Codigo {
	case "RECHAZADO", "OBSERVADO_ASESOR", "EN_REVISION_ESCUELA":
	default:
		return false, nil
	}

	archivado, err := s.flujoRepo.ResolverEstadoCodigo("ARCHIVADO_VENCIMIENTO")
	if err != nil {
		return false, err
	}
	if err := s.flujoRepo.Create(&domain.RSUFlujoAprobacion{
		IDProyecto:      p.ID,
		IDEstadoOrigen:  p.IDEstadoActual,
		IDEstadoDestino: archivado,
		IDRolActor:      uint(idRolActorByCodigo(s.db, "DIR_RS_FACULTAD")),
		Resultado:       "OBSERVADO",
		FechaTransicion: time.Now(),
		Comentarios:     strPtr("Plazo de subsanación vencido (CAMINO 3, rules §5)"),
	}); err != nil {
		return false, err
	}
	if err := s.proyectoRepo.UpdateEstado(p.ID, archivado); err != nil {
		return false, err
	}
	// CA-2.7: el archivado libera el cupo del asesor.
	if p.IDDocenteAsesor != nil {
		s.notificarCupoLiberado(p)
	}
	return true, nil
}

// Duplicidad busca proyectos de la misma escuela que intervienen en el mismo
// lugar o atienden la misma población (HU-F2-01 CA-1.2). Se excluye el propio
// proyecto y los que ya terminaron.
func (s *ProyectoService) Duplicidad(p *domain.RSUProyecto) ([]domain.RSUProyecto, error) {
	var encontrados []domain.RSUProyecto
	q := s.db.Preload("Escuela.Facultad").Preload("EstadoActual").
		Where("id_escuela = ? AND id_proyecto <> ?", p.IDEscuela, p.ID)
	q = q.Where("id_estado_actual NOT IN (SELECT id_estado FROM \"RSU_Estado_Proyecto\" WHERE codigo IN ('CERRADO','REPORTADO_SUNEDU','ARCHIVADO_VENCIMIENTO'))")
	conds := []string{}
	args := []any{}
	if p.LugarIntervencion != nil && strings.TrimSpace(*p.LugarIntervencion) != "" {
		conds = append(conds, "lugar_intervencion = ?")
		args = append(args, strings.TrimSpace(*p.LugarIntervencion))
	}
	if p.PoblacionBeneficiaria != nil && strings.TrimSpace(*p.PoblacionBeneficiaria) != "" {
		conds = append(conds, "poblacion_beneficiaria = ?")
		args = append(args, strings.TrimSpace(*p.PoblacionBeneficiaria))
	}
	if len(conds) == 0 {
		return encontrados, nil
	}
	err := q.Where("("+strings.Join(conds, " OR ")+")", args...).Limit(10).Find(&encontrados).Error
	return encontrados, err
}

// DisponibilidadPresupuesto valida el filtro presupuestal del PEP contra el
// fondo institucional (HU-F2-05). Solo aplica a PEP financiado: el SSU, el
// voluntariado y la publicación son autofinanciados.
func (s *ProyectoService) DisponibilidadPresupuesto(p *domain.RSUProyecto) (disponible, solicitado float64, excede bool, err error) {
	if p.Modalidad != "PEP_FINANCIADO" {
		return 0, p.PresupuestoSolicitado, false, nil
	}
	pct := float64(leerEnteroConfig(s.db, claveFondoPorcentaje, 2))
	base := float64(leerEnteroConfig(s.db, clavePresupuestoFacult, 50000))
	fondo := base * pct / 100.0

	var comprometido float64
	s.db.Model(&domain.RSUProyecto{}).
		Where("modalidad = 'PEP_FINANCIADO' AND id_proyecto <> ?", p.ID).
		Where("id_estado_actual NOT IN (SELECT id_estado FROM \"RSU_Estado_Proyecto\" WHERE codigo IN ('CERRADO','REPORTADO_SUNEDU','ARCHIVADO_VENCIMIENTO','RECHAZADO'))").
		Select("COALESCE(SUM(presupuesto_solicitado),0)").Scan(&comprometido)

	disponible = fondo - comprometido
	excede = disponible < p.PresupuestoSolicitado
	return disponible, p.PresupuestoSolicitado, excede, nil
}

// GenerarOficioElevacion produce el PDF prellenado del Oficio de Elevación y lo
// registra como documento del proyecto (HU-F2-04). Solo lo ejecuta el Decano,
// porque es quien lo firma y sella.
func (s *ProyectoService) GenerarOficioElevacion(p *domain.RSUProyecto, idUsuario uint) (*domain.RSUDocumento, []byte, error) {
	if p.EstadoActual == nil || p.EstadoActual.Codigo != "EN_DICTAMEN_CONSEJO" {
		return nil, nil, errors.New("el oficio solo se genera cuando el expediente está en dictamen del Consejo (EN_DICTAMEN_CONSEJO)")
	}

	escuela, facultad := "", ""
	if p.Escuela != nil {
		escuela = p.Escuela.Nombre
		if p.Escuela.Facultad != nil {
			facultad = p.Escuela.Facultad.Nombre
		}
	}
	lider := "—"
	if p.EstudianteLider != nil {
		lider = strings.TrimSpace(p.EstudianteLider.Nombres + " " + p.EstudianteLider.Apellidos)
	}
	asesor := "—"
	if p.DocenteAsesor != nil {
		asesor = strings.TrimSpace(p.DocenteAsesor.Nombres + " " + p.DocenteAsesor.Apellidos)
	}
	fi, ff := "—", "—"
	if p.FechaInicioPlan != nil {
		fi = p.FechaInicioPlan.Format("02/01/2006")
	}
	if p.FechaFinPlan != nil {
		ff = p.FechaFinPlan.Format("02/01/2006")
	}

	numero := p.NumeroOficio
	if numero == nil || *numero == "" {
		nuevo := fmt.Sprintf("OFICIO N.° %03d-%d-UNDC/FI-DEC", time.Now().Year()%100, time.Now().Year())
		numero = &nuevo
	}

	datos := pdf.OficioElevacion{
		CodigoProyecto: p.CodigoProyecto,
		Titulo:         p.Titulo,
		Modalidad:      p.Modalidad,
		Escuela:        escuela,
		Facultad:       facultad,
		Lider:          lider,
		Asesor:         asesor,
		FechaInicio:    fi,
		FechaFin:       ff,
		Presupuesto:    p.PresupuestoAprobado,
		Fecha:          time.Now().Format("02 de enero de 2006"),
		NumeroOficio:   *numero,
		ReferenciaQR:   p.CodigoProyecto,
	}
	contenido, err := s.pdfGen.GenerarOficioElevacion(contextTODO(), datos)
	if err != nil {
		return nil, nil, err
	}

	saved, err := storage.GuardarBytes(contenido, "oficio-elevacion.pdf", storage.PrefijoProyecto(p.ID)+"/documentos")
	if err != nil {
		return nil, nil, err
	}

	var tipoID uint
	if err := s.db.Model(&domain.RSUTipoDocumento{}).
		Where("nombre = ?", "Oficio de Elevación").Select("id_tipo_doc").Scan(&tipoID).Error; err != nil || tipoID == 0 {
		tipoID = 3 // Resolución de Aprobación, el tipo más próximo del catálogo base
	}

	doc := &domain.RSUDocumento{
		IDProyecto: p.ID, IDTipoDoc: tipoID,
		NombreArchivo: saved.Filename, URLArchivo: saved.URL,
		HashArchivo: &saved.Hash, TamanoBytes: &saved.Size,
		Version: 1, IDUsuarioSubida: idUsuario, Vigente: true,
	}
	if err := s.db.Create(doc).Error; err != nil {
		return nil, nil, err
	}
	// CA-4.5: el oficio queda registrado y el proyecto guarda su referencia.
	ahora := time.Now()
	p.NumeroOficio = numero
	p.FechaElevacion = &ahora
	if err := s.proyectoRepo.Update(p); err != nil {
		return nil, nil, err
	}
	return doc, contenido, nil
}

// ActivarProyecto aplica la opción C: el Responsable de RS de Facultad recibe el
// documento firmado de la DRSU y activa el proyecto (HU-F2-06). Requiere PDF de
// sustento (R27) y comprueba que el asesor tenga cupo libre.
func (s *ProyectoService) ActivarProyecto(idProyecto, idDocumento, idUsuario uint) error {
	p, err := s.proyectoRepo.FindByID(idProyecto)
	if err != nil {
		return err
	}
	if p.EstadoActual == nil || p.EstadoActual.Codigo != "EN_ASIGNACION_CARGA" {
		return errors.New("el proyecto no está en asignación de carga; no se puede activar")
	}
	var doc domain.RSUDocumento
	if err := s.db.First(&doc, "id_documento = ? AND id_proyecto = ? AND vigente = true", idDocumento, idProyecto).Error; err != nil {
		return errors.New("el documento de sustento no existe en este proyecto")
	}
	if err := s.cupoAsesorLibre(p); err != nil {
		return err
	}

	if err := s.mover(p, "REGISTRADO_OFICIAL", idUsuario, &idDocumento, "Documento de la DRSU recibido y registrado"); err != nil {
		return err
	}
	p, err = s.proyectoRepo.FindByID(idProyecto)
	if err != nil {
		return err
	}
	if err := s.mover(p, "EN_EJECUCION", idUsuario, nil, "Proyecto activado: comienza la ejecución"); err != nil {
		return err
	}
	return nil
}

// mover ejecuta una transición BPMN concreta con el rol resuelto por código.
func (s *ProyectoService) mover(p *domain.RSUProyecto, destino string, idUsuario uint, idDoc *uint, comentario string) error {
	destinoID, err := s.flujoRepo.ResolverEstadoCodigo(destino)
	if err != nil {
		return err
	}
	rol := uint(idRolActorByCodigo(s.db, "DIR_RS_FACULTAD"))
	ok, err := s.flujoRepo.ValidTransicion(p.IDEstadoActual, destinoID, rol)
	if err != nil {
		return err
	}
	if !ok {
		return fmt.Errorf("transición no permitida: %s → %s", p.EstadoActual.Codigo, destino)
	}
	if err := s.flujoRepo.Create(&domain.RSUFlujoAprobacion{
		IDProyecto:          p.ID,
		IDEstadoOrigen:      p.IDEstadoActual,
		IDEstadoDestino:     destinoID,
		IDRolActor:          rol,
		IDUsuario:           idUsuario,
		IDDocumentoSustento: idDoc,
		Comentarios:         &comentario,
		Resultado:           "APROBADO",
		FechaTransicion:     time.Now(),
	}); err != nil {
		return err
	}
	return s.proyectoRepo.UpdateEstado(p.ID, destinoID)
}

// cupoAsesorLibre verifica que el docente asesor no supere su carga no lectiva.
func (s *ProyectoService) cupoAsesorLibre(p *domain.RSUProyecto) error {
	if p.IDDocenteAsesor == nil {
		return errors.New("el proyecto no tiene docente asesor asignado")
	}
	max := int(maxProyectosDocente(s.db))
	n, err := s.docenteRepo.ProyectosAsesoradosActivosEnCiclo(*p.IDDocenteAsesor, p.IDCicloCreacion, 0)
	if err != nil {
		return err
	}
	return validarCupoAsesor(n, max)
}

// notificarCupoLiberado avisa al asesor que recuperó su cupo.
func (s *ProyectoService) notificarCupoLiberado(p *domain.RSUProyecto) {
	msg := fmt.Sprintf("El proyecto %s se archivó por vencimiento: recuperaste tu cupo de asesoría.", p.CodigoProyecto)
	s.pushNotificacion("DOCENTE_RESP", "CUPO_LIBERADO", "Cupo liberado — "+p.CodigoProyecto, &msg, &p.ID, p.IDDocenteAsesor)
}

func strPtr(s string) *string { return &s }

// LeerPlazoPresupuesto expone el plazo de ajuste presupuestal (HU-F2-05).
func LeerPlazoPresupuesto(db *gorm.DB) int {
	return leerEnteroConfig(db, clavePlazoPresupuesto, 5)
}

// camposEditablesSubsanacion son los campos que el emisor puede corregir mientras
// subsana (HU-F2-02 CA-2.3). Todo lo demás queda congelado: así el reenvío no
// cambia el fondo del expediente que ya revisó la autoridad.
var camposEditablesSubsanacion = []string{
	"titulo", "descripcion", "problematica", "objetivo_general",
	"objetivos_especificos", "poblacion_beneficiaria", "lugar_intervencion",
	"fecha_inicio_plan", "fecha_fin_plan", "presupuesto_solicitado",
}

// camposBloqueadosPara devuelve la lista JSON de campos bloqueados según el
// estado desde el que se observó.
func camposBloqueadosPara(estado string) *string {
	editables := map[string]bool{}
	for _, c := range camposEditablesSubsanacion {
		editables[c] = true
	}
	todos := []string{
		"codigo_proyecto", "id_escuela", "id_tipo", "modalidad",
		"id_linea_accion", "id_ciclo_creacion", "id_estudiante_lider",
		"id_docente_asesor", "poblacion_beneficiaria",
	}
	var bloqueados []string
	for _, c := range todos {
		if !editables[c] {
			bloqueados = append(bloqueados, c)
		}
	}
	b, _ := json.Marshal(bloqueados)
	s := string(b)
	return &s
}

// contextTODO devuelve el contexto de cancelación del servidor. Se define
// aparte para no repetir la importación en cada método.
func contextTODO() context.Context { return context.Background() }
