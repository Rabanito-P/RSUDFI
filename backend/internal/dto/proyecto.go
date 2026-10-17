package dto

// ── Proyecto RSU ────────────────────────────────────────────────
type CreateProyectoReq struct {
	CodigoProyecto       string   `json:"codigo_proyecto" binding:"required,max=30"`
	Titulo               string   `json:"titulo" binding:"required,max=300"`
	IDEscuela            uint     `json:"id_escuela" binding:"required"`
	IDTipo               uint     `json:"id_tipo" binding:"required"`
	// Modalidad HU-069: SSU|PEP_FINANCIADO|PEP_AUTOFINANCIADO|VOLUNTARIADO|PUBLICACION_CIENTIFICA.
	// Vacío = SSU (default DB). Estudiante solo SSU/VOLUNTARIADO; PEP lo crea docente/responsable.
	Modalidad            string   `json:"modalidad"`
	IDLineaAccion        *uint    `json:"id_linea_accion"`
	IDCicloCreacion      uint     `json:"id_ciclo_creacion" binding:"required"`
	IDEstudianteLider    *uint    `json:"id_estudiante_lider"`
	IDDocenteAsesor      *uint    `json:"id_docente_asesor"`
	Descripcion          *string  `json:"descripcion"`
	ObjetivoGeneral      *string  `json:"objetivo_general"`
	ObjetivosEspecificos *string  `json:"objetivos_especificos"`
	PoblacionBeneficiaria *string `json:"poblacion_beneficiaria"`
	SectorBeneficiario   *string  `json:"sector_beneficiario"`
	LugarIntervencion    *string  `json:"lugar_intervencion"`
	FechaInicioPlan      *string  `json:"fecha_inicio_plan"`
	FechaFinPlan         *string  `json:"fecha_fin_plan"`
	PresupuestoSolicitado float64 `json:"presupuesto_solicitado"`
	// CelularLider: celular del líder (9 dígitos, empieza con 9). Opcional en
	// la creación pero obligatorio para estudiantes líderes — se guarda en
	// Estudiante.celular para que el equipo y RSU facultad puedan contactarlo.
	CelularLider         string   `json:"celular_lider"`
}
type UpdateProyectoReq struct {
	Titulo               *string  `json:"titulo"`
	Descripcion          *string  `json:"descripcion"`
	ObjetivoGeneral      *string  `json:"objetivo_general"`
	PorcentajeAvance     *float64 `json:"porcentaje_avance"`
	PresupuestoSolicitado *float64 `json:"presupuesto_solicitado"`
	PresupuestoAprobado  *float64 `json:"presupuesto_aprobado"`
	MontoEjecutado       *float64 `json:"monto_ejecutado"`
	LugarIntervencion    *string  `json:"lugar_intervencion"`
}
// TransicionReq: el destino se envía por CÓDIGO de estado (no id numérico).
// Si EstadoDestino viene vacío, el servicio resuelve la única transición
// válida para (estado_actual, rol_actor) según RSU_Transicion_Estado.
type TransicionReq struct {
	EstadoDestino       string  `json:"estado_destino"`
	IDRolActor          uint    `json:"id_rol_actor" binding:"required"`
	IDUsuario           uint    `json:"id_usuario"`
	IDDocumentoSustento *uint   `json:"id_documento_sustento"`
	Comentarios         *string `json:"comentarios"`
	Resultado           string  `json:"resultado" binding:"required,oneof=APROBADO OBSERVADO RECHAZADO DEVUELTO"`
}

// CambioLiderReq transfiere el liderazgo a otro miembro del equipo (HU-060):
// lo decide el líder actual o la Dirección de RSU de Facultad. Se notifica
// por panel y correo al líder saliente y al entrante con el motivo.
type CambioLiderReq struct {
	IDNuevoLider uint   `json:"id_nuevo_lider" binding:"required"`
	Motivo       string `json:"motivo" binding:"required,max=500"`
}
