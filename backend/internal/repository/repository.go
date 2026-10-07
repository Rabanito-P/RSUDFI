package repository

import (
	"undc-rsu/backend/internal/domain"

	"gorm.io/gorm"
)

// ── Generic CRUD helpers ─────────────────────────────────────

type BaseRepo[T any] struct {
	db *gorm.DB
}

func NewBaseRepo[T any](db *gorm.DB) *BaseRepo[T] {
	return &BaseRepo[T]{db: db}
}

func (r *BaseRepo[T]) DB() *gorm.DB { return r.db }

// ── Facultad ─────────────────────────────────────────────────

type FacultadRepo struct{ db *gorm.DB }
func NewFacultadRepo(db *gorm.DB) *FacultadRepo { return &FacultadRepo{db} }
func (r *FacultadRepo) Create(f *domain.Facultad) error { return r.db.Create(f).Error }
func (r *FacultadRepo) FindAll(page, limit int, search string) ([]domain.Facultad, int64, error) {
	var items []domain.Facultad
	var total int64
	q := r.db.Model(&domain.Facultad{})
	if search != "" {
		q = q.Where("nombre LIKE ? OR codigo LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	q.Count(&total)
	err := q.Preload("Decano").Offset((page-1)*limit).Limit(limit).Order("nombre ASC").Find(&items).Error
	return items, total, err
}
func (r *FacultadRepo) FindByID(id uint) (*domain.Facultad, error) {
	var f domain.Facultad
	err := r.db.Preload("Decano").First(&f, "id_facultad = ?", id).Error
	return &f, err
}
func (r *FacultadRepo) Update(f *domain.Facultad) error { return r.db.Save(f).Error }
func (r *FacultadRepo) Delete(id uint) error { return r.db.Delete(&domain.Facultad{}, "id_facultad = ?", id).Error }

// ── Escuela ──────────────────────────────────────────────────

type EscuelaRepo struct{ db *gorm.DB }
func NewEscuelaRepo(db *gorm.DB) *EscuelaRepo { return &EscuelaRepo{db} }
func (r *EscuelaRepo) Create(e *domain.Escuela) error { return r.db.Create(e).Error }
func (r *EscuelaRepo) FindAll(page, limit int, idFacultad *uint) ([]domain.Escuela, int64, error) {
	var items []domain.Escuela
	var total int64
	q := r.db.Model(&domain.Escuela{})
	if idFacultad != nil {
		q = q.Where("id_facultad = ?", *idFacultad)
	}
	q.Count(&total)
	err := q.Preload("Facultad").Preload("Director").Offset((page-1)*limit).Limit(limit).Order("nombre ASC").Find(&items).Error
	return items, total, err
}
func (r *EscuelaRepo) FindByID(id uint) (*domain.Escuela, error) {
	var e domain.Escuela
	err := r.db.Preload("Facultad").Preload("Director").First(&e, "id_escuela = ?", id).Error
	return &e, err
}
func (r *EscuelaRepo) Update(e *domain.Escuela) error { return r.db.Save(e).Error }
func (r *EscuelaRepo) Delete(id uint) error { return r.db.Delete(&domain.Escuela{}, "id_escuela = ?", id).Error }

// ── Docente / Estudiante ─────────────────────────────────────

type DocenteRepo struct{ db *gorm.DB }
func NewDocenteRepo(db *gorm.DB) *DocenteRepo { return &DocenteRepo{db} }
func (r *DocenteRepo) Create(d *domain.Docente) error { return r.db.Create(d).Error }
func (r *DocenteRepo) FindAll(page, limit int, search string) ([]domain.Docente, int64, error) {
	var items []domain.Docente
	var total int64
	q := r.db.Model(&domain.Docente{})
	if search != "" {
		q = q.Where("nombres LIKE ? OR apellidos LIKE ? OR dni LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	q.Count(&total)
	err := q.Preload("Escuela").Offset((page-1)*limit).Limit(limit).Order("apellidos ASC").Find(&items).Error
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

type EstudianteRepo struct{ db *gorm.DB }
func NewEstudianteRepo(db *gorm.DB) *EstudianteRepo { return &EstudianteRepo{db} }
func (r *EstudianteRepo) Create(e *domain.Estudiante) error { return r.db.Create(e).Error }
func (r *EstudianteRepo) FindAll(page, limit int, search string) ([]domain.Estudiante, int64, error) {
	var items []domain.Estudiante
	var total int64
	q := r.db.Model(&domain.Estudiante{})
	if search != "" {
		q = q.Where("nombres LIKE ? OR apellidos LIKE ? OR dni LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	q.Count(&total)
	err := q.Preload("Escuela").Offset((page-1)*limit).Limit(limit).Order("apellidos ASC").Find(&items).Error
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

// ── Ciclo ────────────────────────────────────────────────────

type CicloRepo struct{ db *gorm.DB }
func NewCicloRepo(db *gorm.DB) *CicloRepo { return &CicloRepo{db} }
func (r *CicloRepo) Create(c *domain.CicloAcademico) error { return r.db.Create(c).Error }
func (r *CicloRepo) FindAll() ([]domain.CicloAcademico, error) {
	var list []domain.CicloAcademico
	err := r.db.Order("fecha_inicio DESC").Find(&list).Error
	return list, err
}
func (r *CicloRepo) FindByID(id uint) (*domain.CicloAcademico, error) {
	var c domain.CicloAcademico
	err := r.db.First(&c, "id_ciclo = ?", id).Error
	return &c, err
}
func (r *CicloRepo) Active() (*domain.CicloAcademico, error) {
	var c domain.CicloAcademico
	err := r.db.First(&c, "activo = TRUE").Error
	return &c, err
}

// ── Proyecto ─────────────────────────────────────────────────

type ProyectoRepo struct{ db *gorm.DB }
func NewProyectoRepo(db *gorm.DB) *ProyectoRepo { return &ProyectoRepo{db} }

func (r *ProyectoRepo) Create(p *domain.RSUProyecto) error { return r.db.Create(p).Error }
func (r *ProyectoRepo) FindAll(page, limit int, estado *uint, escuela *uint, search string) ([]domain.RSUProyecto, int64, error) {
	var items []domain.RSUProyecto
	var total int64
	q := r.db.Model(&domain.RSUProyecto{})
	if estado != nil {
		q = q.Where("id_estado_actual = ?", *estado)
	}
	if escuela != nil {
		q = q.Where("id_escuela = ?", *escuela)
	}
	if search != "" {
		q = q.Where("titulo LIKE ? OR codigo_proyecto LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	q.Count(&total)
	err := q.Preload("Escuela.Facultad").Preload("Tipo").Preload("EstadoActual").Preload("EstudianteLider").Preload("DocenteAsesor").
		Offset((page-1)*limit).Limit(limit).Order("created_at DESC").Find(&items).Error
	return items, total, err
}
func (r *ProyectoRepo) FindAllByDocente(page, limit int, idDocente uint, search string) ([]domain.RSUProyecto, int64, error) {
	var items []domain.RSUProyecto
	var total int64
	q := r.db.Model(&domain.RSUProyecto{}).Where("id_docente_asesor = ?", idDocente)
	if search != "" {
		q = q.Where("titulo LIKE ? OR codigo_proyecto LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	q.Count(&total)
	err := q.Preload("Escuela.Facultad").Preload("Tipo").Preload("EstadoActual").Preload("EstudianteLider").Preload("DocenteAsesor").
		Offset((page-1)*limit).Limit(limit).Order("created_at DESC").Find(&items).Error
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
func (r *ProyectoRepo) VwResumen(page, limit int) ([]domain.VwProyectoResumen, int64, error) {
	var items []domain.VwProyectoResumen
	var total int64
	r.db.Model(&domain.VwProyectoResumen{}).Count(&total)
	err := r.db.Offset((page-1)*limit).Limit(limit).Order("id_proyecto DESC").Find(&items).Error
	return items, total, err
}
func (r *ProyectoRepo) FindAllByEstudiante(page, limit int, idEstudiante uint, search string) ([]domain.RSUProyecto, int64, error) {
	var items []domain.RSUProyecto
	var total int64
	q := r.db.Model(&domain.RSUProyecto{}).
		Joins("LEFT JOIN \"RSU_Participante_Estudiante\" pe ON pe.\"id_proyecto\" = \"RSU_Proyecto\".\"id_proyecto\" AND pe.\"estado_participacion\" IN ('INSCRITO','ACTIVO','FINALIZADO')").
		Where("\"RSU_Proyecto\".\"id_estudiante_lider\" = ? OR pe.\"id_estudiante\" = ?", idEstudiante, idEstudiante)
	if search != "" {
		q = q.Where("\"RSU_Proyecto\".\"titulo\" LIKE ? OR \"RSU_Proyecto\".\"codigo_proyecto\" LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	// count distinct sin ORDER BY para PG 18
	q2 := q.Session(&gorm.Session{})
	q2.Distinct("\"RSU_Proyecto\".\"id_proyecto\"").Count(&total)
	err := q.Group("\"RSU_Proyecto\".\"id_proyecto\"").Preload("Escuela.Facultad").Preload("Tipo").Preload("EstadoActual").
		Offset((page-1)*limit).Limit(limit).Order("MAX(\"RSU_Proyecto\".\"created_at\") DESC").Find(&items).Error
	return items, total, err
}
func (r *ProyectoRepo) IsEstudianteMiembro(idProyecto, idEstudiante uint) bool {
	var c int64
	r.db.Model(&domain.RSUProyecto{}).Where("id_proyecto = ? AND id_estudiante_lider = ?", idProyecto, idEstudiante).Count(&c)
	if c > 0 { return true }
	r.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO')", idProyecto, idEstudiante).Count(&c)
	return c > 0
}

// ── Catalogos ────────────────────────────────────────────────

type CatalogoRepo struct{ db *gorm.DB }
func NewCatalogoRepo(db *gorm.DB) *CatalogoRepo { return &CatalogoRepo{db} }
func (r *CatalogoRepo) TiposProyecto() ([]domain.RSUTipoProyecto, error) {
	var l []domain.RSUTipoProyecto; err := r.db.Find(&l).Error; return l, err
}
func (r *CatalogoRepo) LineasAccion() ([]domain.RSULineaAccion, error) {
	var l []domain.RSULineaAccion; err := r.db.Find(&l).Error; return l, err
}
func (r *CatalogoRepo) Estados() ([]domain.RSUEstadoProyecto, error) {
	var l []domain.RSUEstadoProyecto; err := r.db.Order("orden_flujo ASC").Find(&l).Error; return l, err
}
func (r *CatalogoRepo) RolesActor() ([]domain.RSURolActor, error) {
	var l []domain.RSURolActor; err := r.db.Find(&l).Error; return l, err
}
func (r *CatalogoRepo) TiposDocumento() ([]domain.RSUTipoDocumento, error) {
	var l []domain.RSUTipoDocumento; err := r.db.Find(&l).Error; return l, err
}
func (r *CatalogoRepo) Transiciones() ([]domain.RSUTransicionEstado, error) {
	var l []domain.RSUTransicionEstado; err := r.db.Preload("RolActor").Find(&l).Error; return l, err
}
func (r *CatalogoRepo) PreguntasEncuesta() ([]domain.RSUPreguntaEncuesta, error) {
	var l []domain.RSUPreguntaEncuesta; err := r.db.Order("orden ASC").Find(&l).Error; return l, err
}

// ── Beneficiario ─────────────────────────────────────────────

type BeneficiarioRepo struct{ db *gorm.DB }
func NewBeneficiarioRepo(db *gorm.DB) *BeneficiarioRepo { return &BeneficiarioRepo{db} }
func (r *BeneficiarioRepo) Create(b *domain.RSUBeneficiario) error { return r.db.Create(b).Error }
func (r *BeneficiarioRepo) FindAll(page, limit int, search string) ([]domain.RSUBeneficiario, int64, error) {
	var items []domain.RSUBeneficiario
	var total int64
	q := r.db.Model(&domain.RSUBeneficiario{})
	if search != "" {
		q = q.Where("nombres LIKE ? OR apellidos LIKE ? OR dni LIKE ? OR razon_social LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	q.Count(&total)
	err := q.Offset((page-1)*limit).Limit(limit).Order("fecha_registro DESC").Find(&items).Error
	return items, total, err
}
func (r *BeneficiarioRepo) FindByID(id uint) (*domain.RSUBeneficiario, error) {
	var b domain.RSUBeneficiario
	err := r.db.First(&b, "id_beneficiario = ?", id).Error
	return &b, err
}
func (r *BeneficiarioRepo) Update(b *domain.RSUBeneficiario) error { return r.db.Save(b).Error }
func (r *BeneficiarioRepo) Vincular(pb *domain.RSUProyectoBeneficiario) error { return r.db.Create(pb).Error }
func (r *BeneficiarioRepo) ListByProyecto(idProyecto uint) ([]domain.RSUProyectoBeneficiario, error) {
	var list []domain.RSUProyectoBeneficiario
	err := r.db.Preload("Beneficiario").Where("id_proyecto = ? AND activo = TRUE", idProyecto).Find(&list).Error
	return list, err
}
func (r *BeneficiarioRepo) ExistsVinculo(idProyecto, idBeneficiario uint) bool {
	var c int64
	r.db.Model(&domain.RSUProyectoBeneficiario{}).Where("id_proyecto = ? AND id_beneficiario = ?", idProyecto, idBeneficiario).Count(&c)
	return c > 0
}

// ── Actividad / Monitoreo / Entregables ──────────────────────

type ActividadRepo struct{ db *gorm.DB }
func NewActividadRepo(db *gorm.DB) *ActividadRepo { return &ActividadRepo{db} }
func (r *ActividadRepo) Create(a *domain.RSUActividadCampo) error { return r.db.Create(a).Error }
func (r *ActividadRepo) FindByProyecto(idProyecto uint) ([]domain.RSUActividadCampo, error) {
	var list []domain.RSUActividadCampo
	err := r.db.Preload("Fotos").Where("id_proyecto = ?", idProyecto).Order("fecha_programada ASC").Find(&list).Error
	return list, err
}
func (r *ActividadRepo) FindByID(id uint) (*domain.RSUActividadCampo, error) {
	var a domain.RSUActividadCampo
	err := r.db.Preload("Fotos").First(&a, "id_actividad = ?", id).Error
	return &a, err
}
func (r *ActividadRepo) Update(a *domain.RSUActividadCampo) error { return r.db.Save(a).Error }

type MonitoreoRepo struct{ db *gorm.DB }
func NewMonitoreoRepo(db *gorm.DB) *MonitoreoRepo { return &MonitoreoRepo{db} }
func (r *MonitoreoRepo) Create(m *domain.RSUMonitoreo) error { return r.db.Create(m).Error }
func (r *MonitoreoRepo) FindByProyecto(idProyecto uint) ([]domain.RSUMonitoreo, error) {
	var list []domain.RSUMonitoreo
	err := r.db.Where("id_proyecto = ?", idProyecto).Order("fecha_monitoreo DESC").Find(&list).Error
	return list, err
}

type EntregableRepo struct{ db *gorm.DB }
func NewEntregableRepo(db *gorm.DB) *EntregableRepo { return &EntregableRepo{db} }
func (r *EntregableRepo) Create(e *domain.RSUEntregable) error { return r.db.Create(e).Error }
func (r *EntregableRepo) FindByProyecto(idProyecto uint) ([]domain.RSUEntregable, error) {
	var list []domain.RSUEntregable
	err := r.db.Where("id_proyecto = ?", idProyecto).Order("orden ASC").Find(&list).Error
	return list, err
}
func (r *EntregableRepo) FindByID(id uint) (*domain.RSUEntregable, error) {
	var e domain.RSUEntregable
	err := r.db.First(&e, "id_entregable = ?", id).Error
	return &e, err
}
func (r *EntregableRepo) Update(e *domain.RSUEntregable) error { return r.db.Save(e).Error }

// ── Asignaciones ─────────────────────────────────────────────

type AsignacionRepo struct{ db *gorm.DB }
func NewAsignacionRepo(db *gorm.DB) *AsignacionRepo { return &AsignacionRepo{db} }
func (r *AsignacionRepo) CreateDocente(a *domain.RSUAsignacionDocente) error { return r.db.Create(a).Error }
func (r *AsignacionRepo) ListDocentesByProyecto(idProyecto uint) ([]domain.RSUAsignacionDocente, error) {
	var list []domain.RSUAsignacionDocente
	err := r.db.Preload("Docente").Where("id_proyecto = ?", idProyecto).Find(&list).Error
	return list, err
}
func (r *AsignacionRepo) CreateEstudiante(p *domain.RSUParticipanteEstudiante) error { return r.db.Create(p).Error }
func (r *AsignacionRepo) ListEstudiantesByProyecto(idProyecto uint) ([]domain.RSUParticipanteEstudiante, error) {
	var list []domain.RSUParticipanteEstudiante
	err := r.db.Preload("Estudiante").Where("id_proyecto = ?", idProyecto).Find(&list).Error
	return list, err
}
func (r *AsignacionRepo) IsMiembro(idProyecto, idEstudiante uint) bool {
	var c int64
	r.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO')", idProyecto, idEstudiante).Count(&c)
	return c > 0
}
func (r *AsignacionRepo) CountActivosByProyecto(idProyecto uint) (int64, error) {
	var c int64
	err := r.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND estado_participacion != 'RETIRADO'", idProyecto).Count(&c).Error
	return c, err
}

// ── Documento / Resolucion ───────────────────────────────────

type DocumentoRepo struct{ db *gorm.DB }
func NewDocumentoRepo(db *gorm.DB) *DocumentoRepo { return &DocumentoRepo{db} }
func (r *DocumentoRepo) Create(d *domain.RSUDocumento) error { return r.db.Create(d).Error }
func (r *DocumentoRepo) FindByProyecto(idProyecto uint) ([]domain.RSUDocumento, error) {
	var list []domain.RSUDocumento
	err := r.db.Preload("TipoDoc").Where("id_proyecto = ?", idProyecto).Order("fecha_subida DESC").Find(&list).Error
	return list, err
}
func (r *DocumentoRepo) FindByID(id uint) (*domain.RSUDocumento, error) {
	var d domain.RSUDocumento
	err := r.db.First(&d, "id_documento = ?", id).Error
	return &d, err
}

// ── Flujo ────────────────────────────────────────────────────

type FlujoRepo struct{ db *gorm.DB }
func NewFlujoRepo(db *gorm.DB) *FlujoRepo { return &FlujoRepo{db} }
func (r *FlujoRepo) Create(f *domain.RSUFlujoAprobacion) error { return r.db.Create(f).Error }
func (r *FlujoRepo) History(idProyecto uint) ([]domain.RSUFlujoAprobacion, error) {
	var list []domain.RSUFlujoAprobacion
	err := r.db.Preload("EstadoOrigen").Preload("EstadoDestino").Preload("RolActor").
		Where("id_proyecto = ?", idProyecto).Order("fecha_transicion ASC").Find(&list).Error
	return list, err
}
func (r *FlujoRepo) ValidTransicion(origen, destino, rolActor uint) (bool, error) {
	var c int64
	err := r.db.Model(&domain.RSUTransicionEstado{}).
		Where("estado_origen = ? AND estado_destino = ? AND id_rol_actor = ?", origen, destino, rolActor).Count(&c).Error
	return c > 0, err
}

// ── Encuestas / Indicadores ──────────────────────────────────

type EncuestaRepo struct{ db *gorm.DB }
func NewEncuestaRepo(db *gorm.DB) *EncuestaRepo { return &EncuestaRepo{db} }
func (r *EncuestaRepo) CreateEncuesta(e *domain.RSUEncuestaBeneficiario) error { return r.db.Create(e).Error }
func (r *EncuestaRepo) CreateRespuesta(resp *domain.RSURespuestaEncuesta) error { return r.db.Create(resp).Error }
func (r *EncuestaRepo) FindByProyecto(idProyecto uint) ([]domain.RSUEncuestaBeneficiario, error) {
	var list []domain.RSUEncuestaBeneficiario
	err := r.db.Preload("Beneficiario").Where("id_proyecto = ?", idProyecto).Order("fecha_aplicacion DESC").Find(&list).Error
	return list, err
}
func (r *EncuestaRepo) FindRespuestas(idEncuesta uint) ([]domain.RSURespuestaEncuesta, error) {
	var list []domain.RSURespuestaEncuesta
	err := r.db.Preload("Pregunta").Where("id_encuesta_benef = ?", idEncuesta).Find(&list).Error
	return list, err
}
func (r *EncuestaRepo) PromedioProyecto(idProyecto uint) (*float64, error) {
	var avg *float64
	err := r.db.Model(&domain.RSUEncuestaBeneficiario{}).Select("AVG(promedio_general)").Where("id_proyecto = ?", idProyecto).Scan(&avg).Error
	return avg, err
}

type IndicadorRepo struct{ db *gorm.DB }
func NewIndicadorRepo(db *gorm.DB) *IndicadorRepo { return &IndicadorRepo{db} }
func (r *IndicadorRepo) Create(i *domain.RSUIndicadorImpacto) error { return r.db.Create(i).Error }
func (r *IndicadorRepo) FindByProyecto(idProyecto uint) ([]domain.RSUIndicadorImpacto, error) {
	var list []domain.RSUIndicadorImpacto
	err := r.db.Where("id_proyecto = ?", idProyecto).Find(&list).Error
	return list, err
}
func (r *IndicadorRepo) Update(i *domain.RSUIndicadorImpacto) error { return r.db.Save(i).Error }

// ── Presupuesto ──────────────────────────────────────────────

type PresupuestoRepo struct{ db *gorm.DB }
func NewPresupuestoRepo(db *gorm.DB) *PresupuestoRepo { return &PresupuestoRepo{db} }
func (r *PresupuestoRepo) CreateMov(m *domain.RSUPresupuestoMovimiento) error { return r.db.Create(m).Error }
func (r *PresupuestoRepo) FindByProyecto(idProyecto uint) ([]domain.RSUPresupuestoMovimiento, error) {
	var list []domain.RSUPresupuestoMovimiento
	err := r.db.Where("id_proyecto = ?", idProyecto).Order("fecha DESC").Find(&list).Error
	return list, err
}
func (r *PresupuestoRepo) CreateVoucher(v *domain.RSUPagoVoucher) error { return r.db.Create(v).Error }
func (r *PresupuestoRepo) FindVouchers(idProyecto uint) ([]domain.RSUPagoVoucher, error) {
	var list []domain.RSUPagoVoucher
	err := r.db.Where("id_proyecto = ?", idProyecto).Order("fecha_pago DESC").Find(&list).Error
	return list, err
}

// ── Dashboard / Audit ────────────────────────────────────────

type DashboardRepo struct{ db *gorm.DB }
func NewDashboardRepo(db *gorm.DB) *DashboardRepo { return &DashboardRepo{db} }

func (r *DashboardRepo) CountProyectos() int64 { var c int64; r.db.Model(&domain.RSUProyecto{}).Count(&c); return c }
func (r *DashboardRepo) CountByEstado() ([]struct{ Estado string; Total int64; Color *string }, error) {
	type row struct{ Estado string; Total int64; Color *string }
	var rows []row
	// Postgres 18 con tablas quoted "RSU_Proyecto" / "RSU_Estado_Proyecto"
	err := r.db.Table("\"RSU_Proyecto\" p").
		Select("e.\"nombre\" as estado, COUNT(*) as total, e.\"color_ui\" as color").
		Joins("JOIN \"RSU_Estado_Proyecto\" e ON p.\"id_estado_actual\" = e.\"id_estado\"").
		Group("e.\"nombre\", e.\"color_ui\", e.\"orden_flujo\"").Order("e.\"orden_flujo\"").
		Scan(&rows).Error
	var out []struct{ Estado string; Total int64; Color *string }
	for _, x := range rows { out = append(out, struct{Estado string; Total int64; Color *string}{Estado: x.Estado, Total: x.Total, Color: x.Color}) }
	return out, err
}
func (r *DashboardRepo) CountByFacultad() ([]struct{ Facultad string; Total int64 }, error) {
	type row struct{ Facultad string; Total int64 }
	var rows []row
	err := r.db.Table("\"RSU_Proyecto\" p").
		Select("f.\"nombre\" as facultad, COUNT(*) as total").
		Joins("JOIN \"Escuela\" e ON p.\"id_escuela\" = e.\"id_escuela\"").
		Joins("JOIN \"Facultad\" f ON e.\"id_facultad\" = f.\"id_facultad\"").
		Group("f.\"nombre\"").Scan(&rows).Error
	var out []struct{ Facultad string; Total int64 }
	for _, x := range rows { out = append(out, struct{Facultad string; Total int64}{Facultad: x.Facultad, Total: x.Total}) }
	return out, err
}

// ── Roles dinámicos por proyecto (V1.1 §1) ──────────────

type ProyectoRolRepo struct{ db *gorm.DB }
func NewProyectoRolRepo(db *gorm.DB) *ProyectoRolRepo { return &ProyectoRolRepo{db} }

func (r *ProyectoRolRepo) Create(pr *domain.RSUProyectoRol) error { return r.db.Create(pr).Error }
func (r *ProyectoRolRepo) FindByProyecto(idProyecto uint) ([]domain.RSUProyectoRol, error) {
	var list []domain.RSUProyectoRol
	err := r.db.Where("id_proyecto = ? AND activo = TRUE", idProyecto).Find(&list).Error
	return list, err
}
func (r *ProyectoRolRepo) FindByUsuario(tipoUsuario string, idUsuario uint) ([]domain.RSUProyectoRol, error) {
	var list []domain.RSUProyectoRol
	err := r.db.Where("tipo_usuario = ? AND id_usuario = ? AND activo = TRUE", tipoUsuario, idUsuario).Find(&list).Error
	return list, err
}
func (r *ProyectoRolRepo) RolDeUsuarioEnProyecto(idProyecto uint, tipoUsuario string, idUsuario uint) ([]string, error) {
	var roles []string
	err := r.db.Model(&domain.RSUProyectoRol{}).
		Where("id_proyecto = ? AND tipo_usuario = ? AND id_usuario = ? AND activo = TRUE", idProyecto, tipoUsuario, idUsuario).
		Pluck("rol_actor", &roles).Error
	return roles, err
}
func (r *ProyectoRolRepo) Delete(idProyecto uint, tipoUsuario string, idUsuario uint, rolActor string) error {
	return r.db.Where("id_proyecto = ? AND tipo_usuario = ? AND id_usuario = ? AND rol_actor = ?", idProyecto, tipoUsuario, idUsuario, rolActor).
		Delete(&domain.RSUProyectoRol{}).Error
}
func (r *ProyectoRolRepo) Existe(idProyecto uint, tipoUsuario string, idUsuario uint, rolActor string) bool {
	var c int64
	r.db.Model(&domain.RSUProyectoRol{}).
		Where("id_proyecto = ? AND tipo_usuario = ? AND id_usuario = ? AND rol_actor = ? AND activo = TRUE", idProyecto, tipoUsuario, idUsuario, rolActor).
		Count(&c)
	return c > 0
}

// ── Comité RSU (M04) ────────────────────────────────────

type ComiteRSURepo struct{ db *gorm.DB }
func NewComiteRSURepo(db *gorm.DB) *ComiteRSURepo { return &ComiteRSURepo{db} }

func (r *ComiteRSURepo) Create(c *domain.RSUComiteRSU) error { return r.db.Create(c).Error }
func (r *ComiteRSURepo) FindByEscuela(idEscuela uint) ([]domain.RSUComiteRSU, error) {
	var list []domain.RSUComiteRSU
	err := r.db.Preload("Docente").Preload("Escuela").Where("id_escuela = ? AND estado = 'ACTIVO'", idEscuela).Order("fecha_designacion DESC").Find(&list).Error
	return list, err
}
func (r *ComiteRSURepo) PresidenteDeEscuela(idEscuela uint) (*domain.RSUComiteRSU, error) {
	var c domain.RSUComiteRSU
	err := r.db.Preload("Docente").Where("id_escuela = ? AND es_presidente = TRUE AND estado = 'ACTIVO'", idEscuela).
		Order("fecha_designacion DESC").First(&c).Error
	return &c, err
}
func (r *ComiteRSURepo) Delete(id uint) error { return r.db.Delete(&domain.RSUComiteRSU{}, "id_comite = ?", id).Error }

// ── Configuración (M11) ─────────────────────────────────

type ConfiguracionRepo struct{ db *gorm.DB }
func NewConfiguracionRepo(db *gorm.DB) *ConfiguracionRepo { return &ConfiguracionRepo{db} }

func (r *ConfiguracionRepo) FindAll(ambito string, idFacultad *uint) ([]domain.RSUConfiguracion, error) {
	var list []domain.RSUConfiguracion
	q := r.db.Model(&domain.RSUConfiguracion{})
	if ambito != "" {
		q = q.Where("ambito = ?", ambito)
	}
	if idFacultad != nil {
		q = q.Where("id_facultad = ? OR ambito = 'GLOBAL'", *idFacultad)
	}
	err := q.Order("clave ASC").Find(&list).Error
	return list, err
}
func (r *ConfiguracionRepo) GetByClave(clave string) (*domain.RSUConfiguracion, error) {
	var c domain.RSUConfiguracion
	err := r.db.Where("clave = ? AND ambito = 'GLOBAL'", clave).First(&c).Error
	return &c, err
}
func (r *ConfiguracionRepo) Valor(clave string) (string, error) {
	var v string
	err := r.db.Model(&domain.RSUConfiguracion{}).Where("clave = ? AND ambito = 'GLOBAL'", clave).Pluck("valor", &v).Error
	return v, err
}
func (r *ConfiguracionRepo) Upsert(c *domain.RSUConfiguracion) error {
	// upsert por clave+ambito+id_facultad
	var existing domain.RSUConfiguracion
	err := r.db.Where("clave = ? AND ambito = ? AND (id_facultad = ? OR (id_facultad IS NULL AND ? IS NULL))",
		c.Clave, c.Ambito, c.IDFacultad, c.IDFacultad).First(&existing).Error
	if err == nil {
		c.ID = existing.ID
		return r.db.Save(c).Error
	}
	return r.db.Create(c).Error
}
func (r *ConfiguracionRepo) Delete(id uint) error { return r.db.Delete(&domain.RSUConfiguracion{}, "id_config = ?", id).Error }

// ── Auditoría (M09) ─────────────────────────────────────

type AuditoriaRepo struct{ db *gorm.DB }
func NewAuditoriaRepo(db *gorm.DB) *AuditoriaRepo { return &AuditoriaRepo{db} }

func (r *AuditoriaRepo) FindAll(page, limit int, idProyecto *uint, accion *string) ([]domain.RSUAuditoriaLog, int64, error) {
	var list []domain.RSUAuditoriaLog
	var total int64
	q := r.db.Model(&domain.RSUAuditoriaLog{})
	if idProyecto != nil {
		q = q.Where("id_proyecto = ?", *idProyecto)
	}
	if accion != nil {
		q = q.Where("accion = ?", *accion)
	}
	q.Count(&total)
	err := q.Order("fecha_hora DESC").Offset((page-1)*limit).Limit(limit).Find(&list).Error
	return list, total, err
}

// ── Notificaciones (M08) ────────────────────────────────

type NotificacionRepo struct{ db *gorm.DB }
func NewNotificacionRepo(db *gorm.DB) *NotificacionRepo { return &NotificacionRepo{db} }

func (r *NotificacionRepo) Create(n *domain.RSUNotificacion) error { return r.db.Create(n).Error }
func (r *NotificacionRepo) FindByRol(rolDestino string, page, limit int) ([]domain.RSUNotificacion, int64, error) {
	var list []domain.RSUNotificacion
	var total int64
	q := r.db.Model(&domain.RSUNotificacion{}).Where("rol_destino = ?", rolDestino)
	q.Count(&total)
	err := q.Preload("Proyecto").Order("created_at DESC").Offset((page-1)*limit).Limit(limit).Find(&list).Error
	return list, total, err
}
func (r *NotificacionRepo) CountUnread(rolDestino string) (int64, error) {
	var c int64
	err := r.db.Model(&domain.RSUNotificacion{}).Where("rol_destino = ? AND leido = FALSE", rolDestino).Count(&c).Error
	return c, err
}
func (r *NotificacionRepo) MarkRead(id uint) error {
	return r.db.Model(&domain.RSUNotificacion{}).Where("id_notificacion = ?", id).Update("leido", true).Error
}
func (r *NotificacionRepo) MarkAllRead(rolDestino string) error {
	return r.db.Model(&domain.RSUNotificacion{}).Where("rol_destino = ?", rolDestino).Update("leido", true).Error
}
