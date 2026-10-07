package handler

import (
	"net/http"
	"path/filepath"
	"strconv"

	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/internal/service"
	"undc-rsu/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ── Facultad Handler ─────────────────────────────────────────

type FacultadHandler struct {
	repo *repository.FacultadRepo
}

func NewFacultadHandler(db *gorm.DB) *FacultadHandler {
	return &FacultadHandler{repo: repository.NewFacultadRepo(db)}
}
func (h *FacultadHandler) Create(c *gin.Context) {
	var req dto.CreateFacultadReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error()); return
	}
	f := &domain.Facultad{Codigo: req.Codigo, Nombre: req.Nombre, DecanoID: req.DecanoID, Activo: true}
	if err := h.repo.Create(f); err != nil {
		utils.Fail(c, 400, "No se pudo crear facultad", err.Error()); return
	}
	utils.Created(c, f, "Facultad creada")
}
func (h *FacultadHandler) List(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	search := c.Query("search")
	items, total, err := h.repo.FindAll(page, limit, search)
	if err != nil { utils.Fail(c, 500, "Error listando facultades", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}
func (h *FacultadHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	f, err := h.repo.FindByID(uint(id))
	if err != nil { utils.Fail(c, 404, "Facultad no encontrada", nil); return }
	utils.Success(c, f, "OK")
}
func (h *FacultadHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	f, err := h.repo.FindByID(uint(id))
	if err != nil { utils.Fail(c, 404, "No encontrada", nil); return }
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	if v, ok := req["nombre"].(string); ok { f.Nombre = v }
	if v, ok := req["codigo"].(string); ok { f.Codigo = v }
	h.repo.Update(f)
	utils.Success(c, f, "Actualizada")
}
func (h *FacultadHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	h.repo.Delete(uint(id))
	utils.Success(c, nil, "Eliminada")
}

// ── Escuela Handler ──────────────────────────────────────────

type EscuelaHandler struct{ repo *repository.EscuelaRepo }
func NewEscuelaHandler(db *gorm.DB) *EscuelaHandler { return &EscuelaHandler{repo: repository.NewEscuelaRepo(db)} }
func (h *EscuelaHandler) Create(c *gin.Context) {
	var req dto.CreateEscuelaReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	e := &domain.Escuela{IDFacultad: req.IDFacultad, Codigo: req.Codigo, Nombre: req.Nombre, DirectorID: req.DirectorID, Activo: true}
	if err := h.repo.Create(e); err != nil { utils.Fail(c, 400, "Error crear escuela", err.Error()); return }
	utils.Created(c, e, "Escuela creada")
}
func (h *EscuelaHandler) List(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	var idFac *uint
	if v := c.Query("id_facultad"); v != "" {
		n, _ := strconv.Atoi(v); u := uint(n); idFac = &u
	}
	items, total, err := h.repo.FindAll(page, limit, idFac)
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}
func (h *EscuelaHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	e, err := h.repo.FindByID(uint(id))
	if err != nil { utils.Fail(c, 404, "No encontrada", nil); return }
	utils.Success(c, e, "OK")
}

// ── Ciclo Handler ────────────────────────────────────────────

type CicloHandler struct{ repo *repository.CicloRepo }
func NewCicloHandler(db *gorm.DB) *CicloHandler { return &CicloHandler{repo: repository.NewCicloRepo(db)} }
func (h *CicloHandler) Create(c *gin.Context) {
	var req dto.CicloReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	// parse dates
	fechaInicio, _ := utils.ParseDate(req.FechaInicio)
	fechaFin, _ := utils.ParseDate(req.FechaFin)
	cl := &domain.CicloAcademico{Nombre: req.Nombre, FechaInicio: fechaInicio, FechaFin: fechaFin, Activo: req.Activo}
	if err := h.repo.Create(cl); err != nil { utils.Fail(c, 400, "Error crear ciclo", err.Error()); return }
	utils.Created(c, cl, "Ciclo creado")
}
func (h *CicloHandler) List(c *gin.Context) {
	items, err := h.repo.FindAll()
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, items, "OK")
}

// ── Docente / Estudiante Handler ─────────────────────────────

type DocenteHandler struct{ repo *repository.DocenteRepo }
func NewDocenteHandler(db *gorm.DB) *DocenteHandler { return &DocenteHandler{repo: repository.NewDocenteRepo(db)} }
func (h *DocenteHandler) Create(c *gin.Context) {
	var req dto.CreateDocenteReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	d := &domain.Docente{
		CodigoDocente: req.CodigoDocente, DNI: req.DNI, Nombres: req.Nombres, Apellidos: req.Apellidos,
		Correo: req.Correo, IDEscuela: req.IDEscuela, IDDepartamento: req.IDDepartamento,
		TipoDocente: req.TipoDocente, Categoria: req.Categoria,
		CargaLectivaMax: req.CargaLectivaMax, CargaNoLectivaMax: req.CargaNoLectivaMax, Activo: true,
	}
	if err := h.repo.Create(d); err != nil { utils.Fail(c, 400, "Error crear docente", err.Error()); return }
	utils.Created(c, d, "Docente creado")
}
func (h *DocenteHandler) List(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	items, total, err := h.repo.FindAll(page, limit, c.Query("search"))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}
func (h *DocenteHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	d, err := h.repo.FindByID(uint(id))
	if err != nil { utils.Fail(c, 404, "No encontrado", nil); return }
	utils.Success(c, d, "OK")
}

type EstudianteHandler struct{ repo *repository.EstudianteRepo }
func NewEstudianteHandler(db *gorm.DB) *EstudianteHandler { return &EstudianteHandler{repo: repository.NewEstudianteRepo(db)} }
func (h *EstudianteHandler) Create(c *gin.Context) {
	var req dto.CreateEstudianteReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	e := &domain.Estudiante{Codigo: req.Codigo, DNI: req.DNI, Nombres: req.Nombres, Apellidos: req.Apellidos, Correo: req.Correo, IDEscuela: req.IDEscuela, Estado: "ACTIVO"}
	if err := h.repo.Create(e); err != nil { utils.Fail(c, 400, "Error crear estudiante", err.Error()); return }
	utils.Created(c, e, "Estudiante creado")
}
func (h *EstudianteHandler) List(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	items, total, err := h.repo.FindAll(page, limit, c.Query("search"))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}
func (h *EstudianteHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	e, err := h.repo.FindByID(uint(id))
	if err != nil { utils.Fail(c, 404, "No encontrado", nil); return }
	utils.Success(c, e, "OK")
}

// ── Proyecto Handler ─────────────────────────────────────────

type ProyectoHandler struct{ svc *service.ProyectoService }
func NewProyectoHandler(db *gorm.DB) *ProyectoHandler { return &ProyectoHandler{svc: service.NewProyectoService(db)} }
func (h *ProyectoHandler) Create(c *gin.Context) {
	var req dto.CreateProyectoReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	p, err := h.svc.Create(req)
	if err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Created(c, p, "Proyecto creado en estado BORRADOR")
}
func (h *ProyectoHandler) List(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	// docente: solo sus proyectos asesorados si pasa id_docente
	if v := c.Query("id_docente"); v != "" {
		idDoc, _ := strconv.Atoi(v)
		items, total, err := h.svc.ListByDocente(page, limit, uint(idDoc), c.Query("search"))
		if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
		utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
		return
	}
	// HU-045: estudiante ve solo sus proyectos (líder o equipo) si pasa id_estudiante o ?scope=mios
	if scope := c.Query("scope"); scope == "mios" {
		if v := c.Query("id_estudiante"); v != "" {
			idEst, _ := strconv.Atoi(v)
			items, total, err := h.svc.ListByEstudiante(page, limit, uint(idEst), c.Query("search"))
			if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
			utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
			return
		}
	}
	var estado, escuela *uint
	if v := c.Query("estado"); v != "" { n, _ := strconv.Atoi(v); u := uint(n); estado = &u }
	if v := c.Query("escuela"); v != "" { n, _ := strconv.Atoi(v); u := uint(n); escuela = &u }
	// soporte ?id_estudiante sin scope para filtro miembro (todos los estudiantes ven su proyecto sea o no líder)
	if v := c.Query("id_estudiante"); v != "" && estado == nil && escuela == nil && c.Query("search") == "" {
		// si solo piden por estudiante, usa join miembro
		idEst, _ := strconv.Atoi(v)
		items, total, err := h.svc.ListByEstudiante(page, limit, uint(idEst), c.Query("search"))
		if err == nil && total > 0 {
			utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
			return
		}
	}
	items, total, err := h.svc.List(page, limit, estado, escuela, c.Query("search"))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}
func (h *ProyectoHandler) ListByDocente(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	page, limit, _ := utils.GetPagination(c)
	items, total, err := h.svc.ListByDocente(page, limit, uint(id), c.Query("search"))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}
func (h *ProyectoHandler) ListByEstudiante(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	page, limit, _ := utils.GetPagination(c)
	items, total, err := h.svc.ListByEstudiante(page, limit, uint(id), c.Query("search"))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}
func (h *ProyectoHandler) CheckMembresia(c *gin.Context) {
	idProj, _ := strconv.Atoi(c.Param("id"))
	idEst, _ := strconv.Atoi(c.Param("estudianteId"))
	member := h.svc.IsMiembro(uint(idProj), uint(idEst))
	utils.Success(c, gin.H{"es_miembro": member, "id_proyecto": idProj, "id_estudiante": idEst}, "OK")
}
func (h *ProyectoHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	p, err := h.svc.Get(uint(id))
	if err != nil { utils.Fail(c, 404, "Proyecto no encontrado", nil); return }
	utils.Success(c, p, "OK")
}
func (h *ProyectoHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req dto.UpdateProyectoReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	p, err := h.svc.Update(uint(id), req)
	if err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Success(c, p, "Proyecto actualizado")
}
func (h *ProyectoHandler) Transicion(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req dto.TransicionReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	if err := h.svc.Transicion(uint(id), req); err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Success(c, nil, "Transición registrada")
}
func (h *ProyectoHandler) Historial(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.svc.Historial(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}
func (h *ProyectoHandler) ResumenVw(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	items, total, err := h.svc.ResumenVw(page, limit)
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}

// ── Beneficiario Handler ─────────────────────────────────────

type BeneficiarioHandler struct{ svc *service.BeneficiarioService }
func NewBeneficiarioHandler(db *gorm.DB) *BeneficiarioHandler { return &BeneficiarioHandler{svc: service.NewBeneficiarioService(db)} }
func (h *BeneficiarioHandler) Create(c *gin.Context) {
	var req dto.CreateBeneficiarioReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	b, err := h.svc.Create(req)
	if err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Created(c, b, "Beneficiario creado")
}
func (h *BeneficiarioHandler) List(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	items, total, err := h.svc.List(page, limit, c.Query("search"))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}
func (h *BeneficiarioHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	b, err := h.svc.Get(uint(id))
	if err != nil { utils.Fail(c, 404, "No encontrado", nil); return }
	utils.Success(c, b, "OK")
}
func (h *BeneficiarioHandler) Vincular(c *gin.Context) {
	var req dto.VincularBeneficiarioReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	if err := h.svc.Vincular(req); err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Success(c, nil, "Beneficiario vinculado")
}
func (h *BeneficiarioHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.svc.ListByProyecto(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}

// ── Asignacion Handler ───────────────────────────────────────

type AsignacionHandler struct{ svc *service.AsignacionService }
func NewAsignacionHandler(db *gorm.DB) *AsignacionHandler { return &AsignacionHandler{svc: service.NewAsignacionService(db)} }
func (h *AsignacionHandler) AsignarDocente(c *gin.Context) {
	var req dto.AsignarDocenteReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	a, err := h.svc.AsignarDocente(req)
	if err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Created(c, a, "Docente asignado (pendiente aprobación)")
}
func (h *AsignacionHandler) InscribirEstudiante(c *gin.Context) {
	var req dto.InscribirEstudianteReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	p, err := h.svc.InscribirEstudiante(req)
	if err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Created(c, p, "Estudiante inscrito")
}
func (h *AsignacionHandler) ListDocentes(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.svc.ListDocentes(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}
func (h *AsignacionHandler) ListEstudiantes(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.svc.ListEstudiantes(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}
func (h *AsignacionHandler) RetirarEstudiante(c *gin.Context) {
	idProj, _ := strconv.Atoi(c.Param("id"))
	idEst, _ := strconv.Atoi(c.Param("estudianteId"))
	if err := h.svc.RetirarEstudiante(uint(idProj), uint(idEst)); err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Success(c, nil, "Estudiante retirado — queda libre para otro proyecto")
}

// ── Actividad Handler ────────────────────────────────────────

type ActividadHandler struct{
	repo *repository.ActividadRepo
	fotoRepo *gorm.DB
}
func NewActividadHandler(db *gorm.DB) *ActividadHandler { return &ActividadHandler{repo: repository.NewActividadRepo(db), fotoRepo: db} }
func (h *ActividadHandler) Create(c *gin.Context) {
	var req dto.CreateActividadReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	var fechaProg *utils.TimePtr
	_ = fechaProg
	act := &domain.RSUActividadCampo{
		IDProyecto: req.IDProyecto, IDEntregable: req.IDEntregable,
		Nombre: req.Nombre, Descripcion: req.Descripcion, Lugar: req.Lugar, Estado: "PROGRAMADA",
	}
	if req.FechaProgramada != nil {
		t, _ := utils.ParseDate(*req.FechaProgramada); act.FechaProgramada = &t
	}
	if err := h.repo.Create(act); err != nil { utils.Fail(c, 400, "Error crear actividad", err.Error()); return }
	utils.Created(c, act, "Actividad creada")
}
func (h *ActividadHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.repo.FindByProyecto(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}
func (h *ActividadHandler) UpdateEstado(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct{ Estado string `json:"estado" binding:"required"`}
	if err := c.ShouldBindJSON(&body); err != nil { utils.ValidationFail(c, err.Error()); return }
	act, err := h.repo.FindByID(uint(id))
	if err != nil { utils.Fail(c, 404, "No encontrada", nil); return }
	act.Estado = body.Estado
	h.repo.Update(act)
	utils.Success(c, act, "Estado actualizado")
}

// ── Encuesta Handler ─────────────────────────────────────────

type EncuestaHandler struct{ svc *service.EncuestaService }
func NewEncuestaHandler(db *gorm.DB) *EncuestaHandler { return &EncuestaHandler{svc: service.NewEncuestaService(db)} }
func (h *EncuestaHandler) Create(c *gin.Context) {
	var req dto.CreateEncuestaBenefReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	enc, err := h.svc.CrearEncuestaBeneficiario(req)
	if err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Created(c, enc, "Encuesta registrada")
}
func (h *EncuestaHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.svc.ListByProyecto(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}

// ── Presupuesto Handler ──────────────────────────────────────

type PresupuestoHandler struct{
	repo *repository.PresupuestoRepo
}
func NewPresupuestoHandler(db *gorm.DB) *PresupuestoHandler { return &PresupuestoHandler{repo: repository.NewPresupuestoRepo(db)} }
func (h *PresupuestoHandler) CreateMov(c *gin.Context) {
	var req dto.CreateMovimientoReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	fecha, _ := utils.ParseDate(req.Fecha)
	m := &domain.RSUPresupuestoMovimiento{IDProyecto: req.IDProyecto, IDFacultad: req.IDFacultad, Tipo: req.Tipo, Monto: req.Monto, Fecha: fecha, Observaciones: req.Observaciones}
	if err := h.repo.CreateMov(m); err != nil { utils.Fail(c, 400, "Error", err.Error()); return }
	utils.Created(c, m, "Movimiento registrado")
}
func (h *PresupuestoHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.repo.FindByProyecto(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}

// ── Documento Handler (upload) — HU-033/034: cualquier miembro equipo (líder o no) puede subir docs/entregables ───────────────────────────────

type DocumentoHandler struct{ repo *repository.DocumentoRepo; db *gorm.DB }
func NewDocumentoHandler(db *gorm.DB) *DocumentoHandler { return &DocumentoHandler{repo: repository.NewDocumentoRepo(db), db: db} }
func (h *DocumentoHandler) Upload(c *gin.Context) {
	idProjStr := c.PostForm("id_proyecto")
	idTipoStr := c.PostForm("id_tipo_doc")
	idUserStr := c.PostForm("id_usuario_subida")
	if idProjStr == "" || idTipoStr == "" {
		utils.Fail(c, 400, "id_proyecto e id_tipo_doc requeridos", nil); return
	}
	idProj, _ := strconv.Atoi(idProjStr)
	idTipo, _ := strconv.Atoi(idTipoStr)
	idUser, _ := strconv.Atoi(idUserStr)
	// HU: permitir a cualquier estudiante miembro subir (no solo líder) — valida membresía si es estudiante
	if idUserStr != "" {
		var esEstudiante int64
		h.db.Model(&domain.Estudiante{}).Where("id_estudiante = ?", idUser).Count(&esEstudiante)
		if esEstudiante > 0 {
			var esMiembro int64
			h.db.Model(&domain.RSUProyecto{}).Where("id_proyecto = ? AND id_estudiante_lider = ?", idProj, idUser).Count(&esMiembro)
			if esMiembro == 0 {
				h.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO')", idProj, idUser).Count(&esMiembro)
				if esMiembro == 0 {
					utils.Fail(c, 403, "No eres miembro de este proyecto. Solo el equipo (líder o participantes) puede subir documentos.", nil); return
				}
			}
		}
	}
	file, err := c.FormFile("archivo")
	if err != nil { utils.Fail(c, 400, "archivo requerido", err.Error()); return }
	// save
	filename := filepath.Base(file.Filename)
	dst := filepath.Join("uploads", filename)
	if err := c.SaveUploadedFile(file, dst); err != nil { utils.Fail(c, 500, "No se pudo guardar", err.Error()); return }
	sz := int(file.Size)
	doc := &domain.RSUDocumento{
		IDProyecto: uint(idProj), IDTipoDoc: uint(idTipo),
		NombreArchivo: filename, URLArchivo: "/" + dst,
		TamanoBytes: &sz, Version: 1, IDUsuarioSubida: uint(idUser), Vigente: true,
	}
	if err := h.repo.Create(doc); err != nil { utils.Fail(c, 400, "Error registrar documento", err.Error()); return }
	utils.Created(c, doc, "Documento subido")
}
func (h *DocumentoHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.repo.FindByProyecto(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}

// ── Catalogo Handler ─────────────────────────────────────────

type CatalogoHandler struct{ repo *repository.CatalogoRepo }
func NewCatalogoHandler(db *gorm.DB) *CatalogoHandler { return &CatalogoHandler{repo: repository.NewCatalogoRepo(db)} }
func (h *CatalogoHandler) TiposProyecto(c *gin.Context) { l,_:= h.repo.TiposProyecto(); utils.Success(c,l,"OK") }
func (h *CatalogoHandler) LineasAccion(c *gin.Context) { l,_:= h.repo.LineasAccion(); utils.Success(c,l,"OK") }
func (h *CatalogoHandler) Estados(c *gin.Context) { l,_:= h.repo.Estados(); utils.Success(c,l,"OK") }
func (h *CatalogoHandler) RolesActor(c *gin.Context) { l,_:= h.repo.RolesActor(); utils.Success(c,l,"OK") }
func (h *CatalogoHandler) TiposDocumento(c *gin.Context) { l,_:= h.repo.TiposDocumento(); utils.Success(c,l,"OK") }
func (h *CatalogoHandler) Transiciones(c *gin.Context) { l,_:= h.repo.Transiciones(); utils.Success(c,l,"OK") }
func (h *CatalogoHandler) PreguntasEncuesta(c *gin.Context) { l,_:= h.repo.PreguntasEncuesta(); utils.Success(c,l,"OK") }

// ── Dashboard / Indicadores / Monitoreo ──────────────────────

type DashboardHandler struct{ svc *service.DashboardService }
func NewDashboardHandler(db *gorm.DB) *DashboardHandler { return &DashboardHandler{svc: service.NewDashboardService(db)} }
func (h *DashboardHandler) KPIs(c *gin.Context) {
	kpis, err := h.svc.KPIs()
	if err != nil { utils.Fail(c, 500, "Error KPIs", err.Error()); return }
	utils.Success(c, kpis, "OK")
}

type IndicadorHandler struct{ repo *repository.IndicadorRepo }
func NewIndicadorHandler(db *gorm.DB) *IndicadorHandler { return &IndicadorHandler{repo: repository.NewIndicadorRepo(db)} }
func (h *IndicadorHandler) Create(c *gin.Context) {
	var req dto.CreateIndicadorReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	var logro *float64
	if req.MetaPlanificada != nil && req.ValorAlcanzado != nil && *req.MetaPlanificada != 0 {
		v := (*req.ValorAlcanzado / *req.MetaPlanificada) * 100
		logro = &v
	}
	ind := &domain.RSUIndicadorImpacto{
		IDProyecto: req.IDProyecto, NombreIndicador: req.NombreIndicador,
		LineaBase: req.LineaBase, MetaPlanificada: req.MetaPlanificada,
		ValorAlcanzado: req.ValorAlcanzado, UnidadMedida: req.UnidadMedida, PorcentajeLogro: logro,
	}
	h.repo.Create(ind)
	utils.Created(c, ind, "Indicador creado")
}
func (h *IndicadorHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, _ := h.repo.FindByProyecto(uint(id))
	utils.Success(c, list, "OK")
}

type MonitoreoHandler struct{ repo *repository.MonitoreoRepo }
func NewMonitoreoHandler(db *gorm.DB) *MonitoreoHandler { return &MonitoreoHandler{repo: repository.NewMonitoreoRepo(db)} }
func (h *MonitoreoHandler) Create(c *gin.Context) {
	var body struct{
		IDProyecto uint `json:"id_proyecto" binding:"required"`
		IDMonitor uint `json:"id_monitor" binding:"required"`
		Fecha string `json:"fecha_monitoreo" binding:"required"`
		Porcentaje *float64 `json:"porcentaje_avance"`
		Resultado string `json:"resultado" binding:"required"`
		Observaciones *string `json:"observaciones"`
	}
	if err := c.ShouldBindJSON(&body); err != nil { utils.ValidationFail(c, err.Error()); return }
	fecha, _ := utils.ParseDate(body.Fecha)
	m := &domain.RSUMonitoreo{IDProyecto: body.IDProyecto, IDMonitor: body.IDMonitor, FechaMonitoreo: fecha, PorcentajeAvance: body.Porcentaje, Resultado: body.Resultado, Observaciones: body.Observaciones}
	h.repo.Create(m)
	utils.Created(c, m, "Monitoreo registrado")
}
func (h *MonitoreoHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, _ := h.repo.FindByProyecto(uint(id))
	utils.Success(c, list, "OK")
}

type EntregableHandler struct{ repo *repository.EntregableRepo }
func NewEntregableHandler(db *gorm.DB) *EntregableHandler { return &EntregableHandler{repo: repository.NewEntregableRepo(db)} }
func (h *EntregableHandler) Create(c *gin.Context) {
	var body struct{
		IDProyecto uint `json:"id_proyecto" binding:"required"`
		Nombre string `json:"nombre" binding:"required"`
		Orden int `json:"orden" binding:"required"`
		FechaLimite *string `json:"fecha_limite"`
	}
	if err := c.ShouldBindJSON(&body); err != nil { utils.ValidationFail(c, err.Error()); return }
	e := &domain.RSUEntregable{IDProyecto: body.IDProyecto, Nombre: body.Nombre, Orden: body.Orden, Estado: "PENDIENTE"}
	if body.FechaLimite != nil { t,_:= utils.ParseDate(*body.FechaLimite); e.FechaLimite = &t }
	h.repo.Create(e)
	utils.Created(c, e, "Entregable creado")
}
func (h *EntregableHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, _ := h.repo.FindByProyecto(uint(id))
	utils.Success(c, list, "OK")
}
func (h *EntregableHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	e, err := h.repo.FindByID(uint(id))
	if err != nil { utils.Fail(c, 404, "Entregable no encontrado", nil); return }
	var body struct{
		Horas *float64 `json:"horas_asignadas"`
		Estado *string `json:"estado"`
	}
	if err := c.ShouldBindJSON(&body); err != nil { utils.ValidationFail(c, err.Error()); return }
	if body.Horas != nil { e.HorasAsignadas = *body.Horas }
	if body.Estado != nil { e.Estado = *body.Estado }
	h.repo.Update(e)
	utils.Success(c, e, "Entregable actualizado")
}

// ── Auth mock ────────────────────────────────────────────────
// Mapeo completo RSU_Rol_Actor (12 roles) — demo sin passwords reales
// ESTUDIANTE_PROP (3), ESTUDIANTE_EJEC (4), DOCENTE_RESP (1), DOCENTE_COLAB (2), DIR_ESCUELA (5), COMITE_PS (6), DIR_RS_FACULTAD (7), CONSEJO_FACULTAD (8), DIR_DEPTO (9), DIR_CENTRAL_RS (10), UNIDAD_ABAST (11), COMITE_CALIDAD (12)

type AuthHandler struct{ db *gorm.DB }
func NewAuthHandler(db *gorm.DB) *AuthHandler { return &AuthHandler{db: db} }

var demoUsers = map[string]dto.LoginResp{
	"estudiante@undc.edu.pe":  {Rol: "ESTUDIANTE", RolActor: "ESTUDIANTE_PROP", RolActorID: 3, TipoActor: "ESTUDIANTE", Nombre: "Ana Quispe (Estudiante Proponente)", ID: 1, Correo: "estudiante@undc.edu.pe"},
	"ejecutor@undc.edu.pe":    {Rol: "ESTUDIANTE", RolActor: "ESTUDIANTE_EJEC", RolActorID: 4, TipoActor: "ESTUDIANTE", Nombre: "Carlos Ramos (Ejecutor)", ID: 2, Correo: "ejecutor@undc.edu.pe"},
	"docente@undc.edu.pe":     {Rol: "DOCENTE", RolActor: "DOCENTE_RESP", RolActorID: 1, TipoActor: "DOCENTE", Nombre: "Mg. Laura Torres (Responsable)", ID: 1, Correo: "docente@undc.edu.pe"},
	"colaborador@undc.edu.pe": {Rol: "DOCENTE", RolActor: "DOCENTE_COLAB", RolActorID: 2, TipoActor: "DOCENTE", Nombre: "Lic. Pedro Flores (Colaborador)", ID: 202, Correo: "colaborador@undc.edu.pe"},
	"escuela@undc.edu.pe":     {Rol: "DIRECTIVO", RolActor: "DIR_ESCUELA", RolActorID: 5, TipoActor: "AUTORIDAD", Nombre: "Dr. Director Escuela", ID: 301, Correo: "escuela@undc.edu.pe"},
	"comite@undc.edu.pe":      {Rol: "DIRECTIVO", RolActor: "COMITE_PS", RolActorID: 6, TipoActor: "COMITE", Nombre: "Comité Proyección Social", ID: 302, Correo: "comite@undc.edu.pe"},
	"rsfacultad@undc.edu.pe":  {Rol: "DIRECTIVO", RolActor: "DIR_RS_FACULTAD", RolActorID: 7, TipoActor: "AUTORIDAD", Nombre: "Dir. RS Facultad", ID: 303, Correo: "rsfacultad@undc.edu.pe"},
	"consejo@undc.edu.pe":     {Rol: "DIRECTIVO", RolActor: "CONSEJO_FACULTAD", RolActorID: 8, TipoActor: "AUTORIDAD", Nombre: "Consejo de Facultad", ID: 304, Correo: "consejo@undc.edu.pe"},
	"central@undc.edu.pe":     {Rol: "DIRECTIVO", RolActor: "DIR_CENTRAL_RS", RolActorID: 10, TipoActor: "AUTORIDAD", Nombre: "Dir. Central RS / VRA", ID: 305, Correo: "central@undc.edu.pe"},
	"abastecimiento@undc.edu.pe": {Rol: "DIRECTIVO", RolActor: "UNIDAD_ABAST", RolActorID: 11, TipoActor: "ADMINISTRATIVO", Nombre: "Unidad Abastecimiento", ID: 306, Correo: "abastecimiento@undc.edu.pe"},
	"calidad@undc.edu.pe":     {Rol: "DIRECTIVO", RolActor: "COMITE_CALIDAD", RolActorID: 12, TipoActor: "COMITE", Nombre: "Comité Calidad", ID: 307, Correo: "calidad@undc.edu.pe"},
	"admin@undc.edu.pe":       {Rol: "ADMIN", RolActor: "DIR_CENTRAL_RS", RolActorID: 10, TipoActor: "AUTORIDAD", Nombre: "Administrador RSU (SUPER)", ID: 1, Correo: "admin@undc.edu.pe"},
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	// 1) Demo map
	if u, ok := demoUsers[req.Correo]; ok {
		if req.Password != "123456" && req.Password != "undc2026" && req.Password != "admin" {
			utils.Fail(c, 401, "Credenciales inválidas (use 123456)", nil); return
		}
		u.Token = "mock-jwt-" + req.Correo
		utils.Success(c, u, "Login OK ("+u.RolActor+")")
		return
	}
	// 2) buscar por correo en Docente o Estudiante (BD real)
	var docente domain.Docente
	if err := h.db.Where("correo_institucional = ?", req.Correo).First(&docente).Error; err == nil {
		if req.Password != "123456" && req.Password != "undc2026" {
			utils.Fail(c, 401, "Credenciales inválidas", nil); return
		}
		utils.Success(c, dto.LoginResp{Token: "mock-jwt-" + req.Correo, Rol: "DOCENTE", RolActor: "DOCENTE_RESP", RolActorID: 1, TipoActor: "DOCENTE", Nombre: docente.Nombres + " " + docente.Apellidos, ID: docente.ID, Correo: req.Correo}, "Login OK (Docente)")
		return
	}
	var est domain.Estudiante
	if err := h.db.Where("correo_institucional = ?", req.Correo).First(&est).Error; err == nil {
		if req.Password != "123456" && req.Password != "undc2026" {
			utils.Fail(c, 401, "Credenciales inválidas", nil); return
		}
		utils.Success(c, dto.LoginResp{Token: "mock-jwt-" + req.Correo, Rol: "ESTUDIANTE", RolActor: "ESTUDIANTE_PROP", RolActorID: 3, TipoActor: "ESTUDIANTE", Nombre: est.Nombres + " " + est.Apellidos, ID: est.ID, Correo: req.Correo}, "Login OK (Estudiante)")
		return
	}
	utils.Fail(c, 401, "Usuario no encontrado. Prueba: estudiante@undc.edu.pe / docente@undc.edu.pe / escuela@undc.edu.pe / 123456", nil)
}
func (h *AuthHandler) Me(c *gin.Context) {
	// devuelve lista de roles demo para selector
	utils.Success(c, gin.H{"demo_users": demoUsers}, "OK")
}

// health
func Health(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status":"ok","service":"UNDC RSU API","version":"1.0.0"}) }
