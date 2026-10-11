package handler

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/internal/service"
	"undc-rsu/backend/internal/storage"
	"undc-rsu/backend/pkg/utils"
)

// ── Dashboard / Indicadores / Monitoreo ──────────────────────

type DashboardHandler struct{ svc *service.DashboardService }

func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
	return &DashboardHandler{svc: service.NewDashboardService(db)}
}

// KPIs SUNEDU/SINEACE del dashboard
// @Tags		Seguimiento
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/dashboard/kpis [get]
func (h *DashboardHandler) KPIs(c *gin.Context) {
	kpis, err := h.svc.KPIs()
	if err != nil {
		utils.Fail(c, 500, "Error KPIs", err.Error())
		return
	}
	utils.Success(c, kpis, "OK")
}

// Trazabilidad de aprobaciones (vista vw_rsu_trazabilidad_aprobacion).
// Alimenta el panel de supervisión con el historial real de transiciones:
// origen, destino, rol responsable, resultado y documento de sustento.
// @Tags		Seguimiento
// @Accept		json
// @Produce	json
// @Param		limit query int false "Máximo de registros (por defecto 10)"
// @Success	200 {object} map[string]any "OK"
// @Failure	401 {object} map[string]any "No autorizado"
// @Failure	500 {object} map[string]any "Error de servidor"
// @Router		/api/v1/dashboard/trazabilidad [get]
func (h *DashboardHandler) Trazabilidad(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	rows, err := h.svc.Trazabilidad(limit)
	if err != nil {
		utils.Fail(c, 500, "No se pudo leer la trazabilidad", err.Error())
		return
	}
	utils.Success(c, rows, "OK")
}

// FlujoResumen devuelve únicamente conteos del catálogo BPMN para la pantalla de
// login (pública). No expone nombres de proyectos, personas ni datos sensibles.
// @Tags		Seguimiento
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	500 {object} map[string]any "Error de servidor"
// @Router		/api/v1/public/flujo-resumen [get]
func (h *DashboardHandler) FlujoResumen(c *gin.Context) {
	var estados, transiciones, roles int64
	svc := h.svc

	estados, e1 := svc.ContarEstados()
	transiciones, e2 := svc.ContarTransiciones()
	roles, e3 := svc.ContarRoles()

	if e1 != nil || e2 != nil || e3 != nil {
		utils.Fail(c, 500, "No se pudo leer el catálogo", "error al contar el flujo")
		return
	}
	utils.Success(c, map[string]any{
		"estados":      estados,
		"transiciones": transiciones,
		"roles":        roles,
	}, "OK")
}

type IndicadorHandler struct{ repo *repository.IndicadorRepo }

func NewIndicadorHandler(db *gorm.DB) *IndicadorHandler {
	return &IndicadorHandler{repo: repository.NewIndicadorRepo(db)}
}

// Crear indicador de impacto (calcula % logro)
// @Tags		Seguimiento
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/indicadores [post]
func (h *IndicadorHandler) Create(c *gin.Context) {
	var req dto.CreateIndicadorReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
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
	if err := h.repo.Create(ind); err != nil {
		utils.Fail(c, 500, "Error creando indicador", err.Error())
		return
	}
	utils.Created(c, ind, "Indicador creado")
}

// Indicadores de impacto del proyecto
// @Tags		Seguimiento
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/indicadores [get]
func (h *IndicadorHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.repo.FindByProyecto(uint(id))
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, list, "OK")
}

type MonitoreoHandler struct{ repo *repository.MonitoreoRepo }

func NewMonitoreoHandler(db *gorm.DB) *MonitoreoHandler {
	return &MonitoreoHandler{repo: repository.NewMonitoreoRepo(db)}
}

// Registrar monitoreo in situ (% avance 0-100)
// @Tags		Seguimiento
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/monitoreos [post]
func (h *MonitoreoHandler) Create(c *gin.Context) {
	var body struct {
		IDProyecto    uint     `json:"id_proyecto" binding:"required"`
		IDMonitor     uint     `json:"id_monitor" binding:"required"`
		Fecha         string   `json:"fecha_monitoreo" binding:"required"`
		Porcentaje    *float64 `json:"porcentaje_avance"`
		Resultado     string   `json:"resultado" binding:"required"`
		Observaciones *string  `json:"observaciones"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	fecha, err := utils.ParseDate(body.Fecha)
	if err != nil {
		utils.Fail(c, 400, "fecha_monitoreo inválida", err.Error())
		return
	}
	m := &domain.RSUMonitoreo{IDProyecto: body.IDProyecto, IDMonitor: body.IDMonitor, FechaMonitoreo: fecha, PorcentajeAvance: body.Porcentaje, Resultado: body.Resultado, Observaciones: body.Observaciones}
	if err := h.repo.Create(m); err != nil {
		utils.Fail(c, 500, "Error creando monitoreo", err.Error())
		return
	}
	utils.Created(c, m, "Monitoreo registrado")
}

// Monitoreos del proyecto
// @Tags		Seguimiento
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/monitoreos [get]
func (h *MonitoreoHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.repo.FindByProyecto(uint(id))
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, list, "OK")
}

// Estados canónicos del entregable (equipo ↔ verificadores):
// POR_ENVIAR (bandeja estudiante, botón Registrar activo) → ENVIADO (bloqueado,
// PDF descargable) → APROBADO=correcto (terminal, bloqueado) | OBSERVADO (botón
// Actualizar activo, re-envía a ENVIADO). Legados: PENDIENTE≡POR_ENVIAR,
// REGISTRADO/SUBIDO≡ENVIADO (se normalizan al leer y al escribir).
const (
	EstEntPorEnviar = "POR_ENVIAR"
	EstEntEnviado   = "ENVIADO"
	EstEntObservado = "OBSERVADO"
	EstEntAprobado  = "APROBADO"
)

func normEstEnt(e string) string {
	switch e {
	case "PENDIENTE":
		return EstEntPorEnviar
	case "REGISTRADO", "SUBIDO":
		return EstEntEnviado
	case "CORRECTO":
		return EstEntAprobado
	default:
		return e
	}
}

// equipoTotal cuenta estudiantes distintos del equipo: el líder del proyecto
// más los participantes registrados (INSCRITO/ACTIVO/FINALIZADO), sin duplicar
// cuando el líder también aparece como participante.
func equipoTotal(db *gorm.DB, idProj int) int64 {
	var ids []uint
	db.Model(&domain.RSUProyecto{}).
		Where("id_proyecto = ? AND id_estudiante_lider IS NOT NULL", idProj).
		Pluck("id_estudiante_lider", &ids)
	var partes []uint
	db.Model(&domain.RSUParticipanteEstudiante{}).
		Where("id_proyecto = ? AND estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO')", idProj).
		Pluck("id_estudiante", &partes)
	seen := map[uint]bool{}
	for _, id := range append(ids, partes...) {
		if id != 0 {
			seen[id] = true
		}
	}
	return int64(len(seen))
}

type EntregableHandler struct {
	repo    *repository.EntregableRepo
	docRepo *repository.DocumentoRepo
	db      *gorm.DB
}

func NewEntregableHandler(db *gorm.DB) *EntregableHandler {
	return &EntregableHandler{repo: repository.NewEntregableRepo(db), docRepo: repository.NewDocumentoRepo(db), db: db}
}

// Crear entregable del proyecto
// @Tags		Seguimiento
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/entregables [post]
func (h *EntregableHandler) Create(c *gin.Context) {
	var body struct {
		IDProyecto  uint    `json:"id_proyecto" binding:"required"`
		Nombre      string  `json:"nombre" binding:"required"`
		Orden       int     `json:"orden" binding:"required"`
		FechaLimite *string `json:"fecha_limite"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	e := &domain.RSUEntregable{IDProyecto: body.IDProyecto, Nombre: body.Nombre, Orden: body.Orden, Estado: EstEntPorEnviar}
	if body.FechaLimite != nil {
		t, err := utils.ParseDate(*body.FechaLimite)
		if err != nil {
			utils.Fail(c, 400, "fecha_limite inválida", err.Error())
			return
		}
		e.FechaLimite = &t
	}
	if err := h.repo.Create(e); err != nil {
		utils.Fail(c, 500, "Error creando entregable", err.Error())
		return
	}
	utils.Created(c, e, "Entregable creado (POR_ENVIAR)")
}

// Entregables del proyecto
// @Tags		Seguimiento
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/entregables [get]
func (h *EntregableHandler) ByProyecto(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.repo.FindByProyecto(uint(id))
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	for i := range list {
		list[i].Estado = normEstEnt(list[i].Estado)
		if list[i].Documento != nil && list[i].Documento.URLArchivo == "" {
			list[i].Documento = nil
		}
	}
	utils.Success(c, list, "OK")
}

// Bandeja de verificación (docente asesor + oficina RSU facultad): lista lo ENVIADO.
// GET /api/v1/entregables/por-verificar?estado=ENVIADO&id_escuela=&search=
func (h *EntregableHandler) PorVerificar(c *gin.Context) {
	estado := normEstEnt(c.DefaultQuery("estado", EstEntEnviado))
	idEscuela := c.Query("id_escuela")
	search := c.Query("search")
	estados := []string{estado}
	if estado == EstEntEnviado {
		estados = append(estados, "REGISTRADO", "SUBIDO")
	} else if estado == EstEntPorEnviar {
		estados = append(estados, "PENDIENTE")
	}
	q := h.db.Table(`"RSU_Entregable" e`).
		Select(`e.*, p."titulo" AS proyecto_titulo, p."codigo_proyecto", p."id_escuela"`).
		Joins(`JOIN "RSU_Proyecto" p ON p."id_proyecto" = e."id_proyecto"`).
		Where(`e."estado" IN ?`, estados).
		Order(`e."id_proyecto" ASC, e."orden" ASC`).Limit(200)
	if idEscuela != "" {
		q = q.Where(`p."id_escuela" = ?`, idEscuela)
	}
	if search != "" {
		like := "%" + strings.ReplaceAll(strings.ReplaceAll(search, "%", "\\%"), "_", "\\_") + "%"
		q = q.Where(`p."titulo" ILIKE ? OR p."codigo_proyecto" ILIKE ? OR e."nombre" ILIKE ?`, like, like, like)
	}
	type row struct {
		domain.RSUEntregable
		ProyectoTitulo string `json:"proyecto_titulo"`
		CodigoProyecto string `json:"codigo_proyecto"`
		IDEscuela      uint   `json:"id_escuela" gorm:"column:id_escuela"`
	}
	var rows []row
	if err := q.Find(&rows).Error; err != nil {
		utils.Fail(c, 500, "Error listando entregables", err.Error())
		return
	}
	// Preload manual del documento de cada fila (evita N+1 con Preload en join)
	for i := range rows {
		rows[i].Estado = normEstEnt(rows[i].Estado)
		if rows[i].IDDocumento != nil {
			var d domain.RSUDocumento
			if err := h.db.First(&d, "id_documento = ?", *rows[i].IDDocumento).Error; err == nil {
				rows[i].Documento = &d
			}
		}
	}
	utils.Success(c, rows, "OK")
}

// Actualizar entregable (horas + estado)
// @Tags		Seguimiento
// @Accept		json
// @Produce	json
// @Param		id path int true "ID entregable"
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/entregables/{id} [patch]
// Registrar entregable con PDF (multipart: orden, horas_asignadas, archivo, id_tipo_doc, id_usuario_subida).
// Upsert por (proyecto, orden): si ya está REGISTRADO/APROBADO responde 409 — no se registra 2 veces.
// @Tags		Seguimiento
// @Accept		mpfd
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Failure	403 {object} map[string]any "Proyecto cerrado o no miembro"
// @Failure	409 {object} map[string]any "Entregable ya registrado"
// @Router		/api/v1/proyectos/{id}/entregables/registrar [post]
func (h *EntregableHandler) Registrar(c *gin.Context) {
	idProj, _ := strconv.Atoi(c.Param("id"))
	// Proyecto debe existir y no estar CERRADO
	var proj domain.RSUProyecto
	if err := h.db.First(&proj, "id_proyecto = ?", idProj).Error; err != nil {
		utils.Fail(c, 404, "Proyecto no encontrado", nil)
		return
	}
	var estadoCerrado int64
	h.db.Model(&domain.RSUEstadoProyecto{}).
		Where("id_estado = ? AND codigo = 'CERRADO'", proj.IDEstadoActual).Count(&estadoCerrado)
	if estadoCerrado > 0 {
		utils.Fail(c, 403, "Proyecto CERRADO: solo lectura, no se admiten registros", nil)
		return
	}
	ordenStr := c.PostForm("orden")
	horasStr := c.PostForm("horas_asignadas")
	idTipoStr := c.PostForm("id_tipo_doc")
	orden, _ := strconv.Atoi(ordenStr)
	horas, _ := strconv.ParseFloat(horasStr, 64)
	idTipo, _ := strconv.Atoi(idTipoStr)
	// El usuario sale del token (via RSU_Usuario.id_persona): nunca del form,
	// así un cliente no puede suplantar a otro miembro ni saltar la validación.
	idUser := personaIDFromToken(h.db, c)
	idUserStr := strconv.Itoa(idUser)
	if orden < 1 || orden > 5 {
		utils.Fail(c, 400, "orden debe ser 1..5 (1-3 entregables, 4 encuesta, 5 informe final)", nil)
		return
	}
	if horas <= 0 {
		utils.Fail(c, 400, "horas_asignadas debe ser mayor a 0", nil)
		return
	}
	if idTipoStr == "" || idUserStr == "" || idUser <= 0 {
		utils.Fail(c, 400, "id_tipo_doc requerido y usuario autenticado", nil)
		return
	}
	// Solo el equipo (líder o participante) puede registrar
	if idUser > 0 {
		var esEstudiante int64
		h.db.Model(&domain.Estudiante{}).Where("id_estudiante = ?", idUser).Count(&esEstudiante)
		if esEstudiante > 0 {
			var esMiembro int64
			h.db.Model(&domain.RSUProyecto{}).Where("id_proyecto = ? AND id_estudiante_lider = ?", idProj, idUser).Count(&esMiembro)
			if esMiembro == 0 {
				h.db.Model(&domain.RSUParticipanteEstudiante{}).Where("id_proyecto = ? AND id_estudiante = ? AND estado_participacion IN ('INSCRITO','ACTIVO','FINALIZADO')", idProj, idUser).Count(&esMiembro)
				if esMiembro == 0 {
					utils.Fail(c, 403, "No eres miembro de este proyecto", nil)
					return
				}
			}
		}
	}
	// Equipo mínimo 2 estudiantes (líder + participantes activos): sin equipo no hay envío
	if equipoTotal(h.db, idProj) < 2 {
		utils.Fail(c, 400, "el proyecto necesita mínimo 2 estudiantes en el equipo para enviar entregables", nil)
		return
	}
	// Anti doble envío: ENVIADO/APROBADO no se vuelven a registrar (409).
	// OBSERVADO sí puede re-enviarse (corrección del equipo → vuelve a ENVIADO).
	if exist, err := h.repo.FindByProyectoOrden(uint(idProj), orden); err == nil {
		switch normEstEnt(exist.Estado) {
		case EstEntEnviado:
			utils.Fail(c, 409, "Entregable ya ENVIADO (descarga el PDF o espera verificación)", nil)
			return
		case EstEntAprobado:
			utils.Fail(c, 409, "Entregable CORRECTO/APROBADO: ya no admite cambios", nil)
			return
		}
	}
	file, err := c.FormFile("archivo")
	if err != nil {
		utils.Fail(c, 400, "archivo PDF requerido", err.Error())
		return
	}
	if file.Size > 32<<20 {
		utils.Fail(c, 400, "archivo excede 32MB", nil)
		return
	}
	// Solo PDF: valida extensión y content-type (excepción: rechaza JPG/PNG/DOCX/etc.)
	name := strings.ToLower(file.Filename)
	ct := file.Header.Get("Content-Type")
	if !strings.HasSuffix(name, ".pdf") || (ct != "" && ct != "application/pdf" && ct != "application/octet-stream") {
		utils.Fail(c, 400, "solo se admite archivo PDF (.pdf)", nil)
		return
	}
	// Guarda archivo (storage local activo / cloud cuando se habilite)
	st := storage.New()
	saved, err := st.Save(file, "")
	if err != nil {
		if st.Driver() == "cloud" {
			utils.Fail(c, 501, "Almacenamiento cloud no habilitado en este MVP", err.Error())
			return
		}
		utils.Fail(c, 500, "No se pudo guardar el archivo", err.Error())
		return
	}
	sz := saved.Size
	hash := saved.Hash
	doc := &domain.RSUDocumento{
		IDProyecto: uint(idProj), IDTipoDoc: uint(idTipo),
		NombreArchivo: saved.Filename, URLArchivo: saved.URL,
		HashArchivo: &hash, TamanoBytes: &sz, Version: 1, IDUsuarioSubida: uint(idUser), Vigente: true,
	}
	if err := h.docRepo.Create(doc); err != nil {
		utils.Fail(c, 400, "Error registrando documento", err.Error())
		return
	}
	// Upsert entregable por (proyecto, orden)
	e, err := h.repo.FindByProyectoOrden(uint(idProj), orden)
	if err != nil {
		e = &domain.RSUEntregable{IDProyecto: uint(idProj), Nombre: fmt.Sprintf("Entregable %d", orden), Orden: orden, Estado: EstEntPorEnviar}
		if err := h.repo.Create(e); err != nil {
			utils.Fail(c, 400, "Error creando entregable", err.Error())
			return
		}
	}
	// Segunda verificación anti doble envío (cierra carrera: doble clic / 2 pestañas).
	// Si estaba OBSERVADO se permite: la corrección vuelve a ENVIADO.
	if fresh, err := h.repo.FindByProyectoOrden(uint(idProj), orden); err == nil {
		switch normEstEnt(fresh.Estado) {
		case EstEntEnviado:
			utils.Fail(c, 409, "Entregable ya ENVIADO (descarga el PDF o espera verificación)", nil)
			return
		case EstEntAprobado:
			utils.Fail(c, 409, "Entregable CORRECTO/APROBADO: ya no admite cambios", nil)
			return
		}
		e = fresh
	}
	e.HorasAsignadas = horas
	e.Estado = EstEntEnviado
	e.Observaciones = nil // al re-enviar desde OBSERVADO se limpia la observación previa
	e.IDDocumento = &doc.ID
	if err := h.repo.Update(e); err != nil {
		utils.Fail(c, 400, "Error actualizando entregable", err.Error())
		return
	}
	e.Documento = doc
	utils.Created(c, e, "Entregable ENVIADO (horas + PDF)")
}
func (h *EntregableHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	e, err := h.repo.FindByID(uint(id))
	if err != nil {
		utils.Fail(c, 404, "Entregable no encontrado", nil)
		return
	}
	var body struct {
		Horas         *float64 `json:"horas_asignadas"`
		Estado        *string  `json:"estado"`
		IDVerificador *uint    `json:"id_verificador"`
		Observaciones *string  `json:"observaciones"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	actual := normEstEnt(e.Estado)
	if body.Horas != nil {
		e.HorasAsignadas = *body.Horas
	}
	if body.Estado != nil {
		next := normEstEnt(*body.Estado)
		// Máquina de estados: POR_ENVIAR→ENVIADO (solo vía Registrar con PDF);
		// ENVIADO→APROBADO|OBSERVADO (verificador: docente u oficina RSU facultad);
		// OBSERVADO→ENVIADO (re-envío del equipo vía Registrar); APROBADO terminal.
		validos := map[string]bool{EstEntPorEnviar: true, EstEntEnviado: true, EstEntObservado: true, EstEntAprobado: true}
		if !validos[next] {
			utils.Fail(c, 400, "estado inválido: use POR_ENVIAR, ENVIADO, OBSERVADO o APROBADO", nil)
			return
		}
		if actual == EstEntAprobado {
			utils.Fail(c, 409, "Entregable CORRECTO/APROBADO: ya no admite cambios", nil)
			return
		}
		switch {
		case actual == EstEntPorEnviar && next == EstEntEnviado:
			utils.Fail(c, 400, "use el botón Registrar con PDF para pasar a ENVIADO", nil)
			return
		case actual == EstEntPorEnviar && (next == EstEntObservado || next == EstEntAprobado):
			utils.Fail(c, 400, "no se puede verificar un entregable POR_ENVIAR (aún sin PDF)", nil)
			return
		case actual == EstEntEnviado && next == EstEntPorEnviar:
			utils.Fail(c, 400, "un ENVIADO solo puede pasar a OBSERVADO o APROBADO", nil)
			return
		case actual == EstEntObservado && next == EstEntAprobado:
			utils.Fail(c, 400, "un OBSERVADO debe ser corregido y re-enviado por el equipo antes de aprobar", nil)
			return
		case actual == EstEntObservado && next == EstEntObservado:
			// se permite actualizar la observación
		case actual == next:
			// idempotente: no-op
		}
		if next == EstEntObservado && (body.Observaciones == nil || *body.Observaciones == "") && e.Observaciones == nil {
			utils.Fail(c, 400, "observar requiere indicar el motivo (observaciones)", nil)
			return
		}
		e.Estado = next
	}
	if body.IDVerificador != nil {
		e.IDVerificador = body.IDVerificador
	}
	if body.Observaciones != nil {
		e.Observaciones = body.Observaciones
	}
	if err := h.repo.Update(e); err != nil {
		utils.Fail(c, 500, "Error actualizando entregable", err.Error())
		return
	}
	utils.Success(c, e, "Entregable actualizado")
}
