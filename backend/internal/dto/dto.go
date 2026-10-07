package dto

import "time"

// ── Facultad / Escuela ──────────────────────────────────────────
type CreateFacultadReq struct {
	Codigo   string `json:"codigo" binding:"required,max=10"`
	Nombre   string `json:"nombre" binding:"required,max=200"`
	DecanoID *uint  `json:"decano_id"`
}
type CreateEscuelaReq struct {
	IDFacultad uint   `json:"id_facultad" binding:"required"`
	Codigo     string `json:"codigo" binding:"required,max=10"`
	Nombre     string `json:"nombre" binding:"required,max=200"`
	DirectorID *uint  `json:"director_id"`
}
type CreateDocenteReq struct {
	CodigoDocente     string  `json:"codigo_docente" binding:"required"`
	DNI               string  `json:"dni" binding:"required,len=8"`
	Nombres           string  `json:"nombres" binding:"required"`
	Apellidos         string  `json:"apellidos" binding:"required"`
	Correo            string  `json:"correo_institucional" binding:"required,email"`
	IDEscuela         uint    `json:"id_escuela" binding:"required"`
	IDDepartamento    *uint   `json:"id_departamento"`
	TipoDocente       string  `json:"tipo_docente" binding:"required,oneof=ORDINARIO_TC ORDINARIO_DE CONTRATADO"`
	Categoria         *string `json:"categoria"`
	CargaLectivaMax   float64 `json:"carga_lectiva_max"`
	CargaNoLectivaMax float64 `json:"carga_no_lectiva_max"`
}
type CreateEstudianteReq struct {
	Codigo       string  `json:"codigo_estudiante" binding:"required"`
	DNI          string  `json:"dni" binding:"required,len=8"`
	Nombres      string  `json:"nombres" binding:"required"`
	Apellidos    string  `json:"apellidos" binding:"required"`
	Correo       string  `json:"correo_institucional" binding:"required,email"`
	IDEscuela    uint    `json:"id_escuela" binding:"required"`
	FechaIngreso *string `json:"fecha_ingreso"`
}

// ── Proyecto RSU ────────────────────────────────────────────────
type CreateProyectoReq struct {
	CodigoProyecto       string   `json:"codigo_proyecto" binding:"required,max=30"`
	Titulo               string   `json:"titulo" binding:"required,max=300"`
	IDEscuela            uint     `json:"id_escuela" binding:"required"`
	IDTipo               uint     `json:"id_tipo" binding:"required"`
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
type TransicionReq struct {
	EstadoDestino       uint   `json:"estado_destino" binding:"required"`
	IDRolActor          uint   `json:"id_rol_actor" binding:"required"`
	IDUsuario           uint   `json:"id_usuario" binding:"required"`
	IDDocumentoSustento *uint  `json:"id_documento_sustento"`
	Comentarios         *string `json:"comentarios"`
	Resultado           string `json:"resultado" binding:"required,oneof=APROBADO OBSERVADO RECHAZADO DEVUELTO"`
}

// ── Asignaciones ────────────────────────────────────────────────
type AsignarDocenteReq struct {
	IDProyecto     uint    `json:"id_proyecto" binding:"required"`
	IDDocente      uint    `json:"id_docente" binding:"required"`
	IDRolProyecto  uint    `json:"id_rol_proyecto" binding:"required"`
	HorasAsignadas float64 `json:"horas_asignadas" binding:"required,gt=0,lte=20"`
	TipoHora       string  `json:"tipo_hora" binding:"required,oneof=LECTIVA NO_LECTIVA"`
	IDCiclo        uint    `json:"id_ciclo" binding:"required"`
}
type InscribirEstudianteReq struct {
	IDProyecto    uint   `json:"id_proyecto" binding:"required"`
	IDEstudiante  uint   `json:"id_estudiante" binding:"required"`
	IDRolProyecto uint   `json:"id_rol_proyecto" binding:"required"`
}

// ── Beneficiario ────────────────────────────────────────────────
type CreateBeneficiarioReq struct {
	TipoBeneficiario string  `json:"tipo_beneficiario" binding:"required,oneof=PERSONA_NATURAL INSTITUCION COMUNIDAD"`
	DNI              *string `json:"dni"`
	Nombres          *string `json:"nombres"`
	Apellidos        *string `json:"apellidos"`
	RUC              *string `json:"ruc"`
	RazonSocial      *string `json:"razon_social"`
	Celular          *string `json:"celular"`
	Correo           *string `json:"correo_electronico"`
	Direccion        *string `json:"direccion"`
	Distrito         *string `json:"distrito"`
	Sexo             *string `json:"sexo"`
	Condicion        *string `json:"condicion_vulnerabilidad"`
}
type VincularBeneficiarioReq struct {
	IDProyecto     uint    `json:"id_proyecto" binding:"required"`
	IDBeneficiario uint    `json:"id_beneficiario" binding:"required"`
	RolEnProyecto  *string `json:"rol_en_proyecto"`
}

// ── Actividad ───────────────────────────────────────────────────
type CreateActividadReq struct {
	IDProyecto      uint    `json:"id_proyecto" binding:"required"`
	IDEntregable    *uint   `json:"id_entregable"`
	Nombre          string  `json:"nombre" binding:"required,max=200"`
	Descripcion     *string `json:"descripcion"`
	FechaProgramada *string `json:"fecha_programada"`
	Lugar           *string `json:"lugar"`
}

// ── Presupuesto ─────────────────────────────────────────────────
type CreateMovimientoReq struct {
	IDProyecto    uint    `json:"id_proyecto" binding:"required"`
	IDFacultad    uint    `json:"id_facultad" binding:"required"`
	Tipo          string  `json:"tipo" binding:"required,oneof=ASIGNACION EJECUCION TRANSFERENCIA DEVOLUCION"`
	Monto         float64 `json:"monto" binding:"required,gt=0"`
	Fecha         string  `json:"fecha" binding:"required"`
	Observaciones *string `json:"observaciones"`
}

// ── Encuesta ────────────────────────────────────────────────────
type CreateEncuestaBenefReq struct {
	IDProyecto      uint   `json:"id_proyecto" binding:"required"`
	IDBeneficiario  uint   `json:"id_beneficiario" binding:"required"`
	FechaAplicacion string `json:"fecha_aplicacion" binding:"required"`
	Modalidad       string `json:"modalidad" binding:"required,oneof=PRESENCIAL TELEFONICA VIRTUAL WHATSAPP"`
	Comentario      *string `json:"comentario_abierto"`
	Sugerencia      *string `json:"sugerencia_mejora"`
	Respuestas      []RespuestaReq `json:"respuestas" binding:"required,min=1"`
}
type RespuestaReq struct {
	IDPregunta    uint `json:"id_pregunta" binding:"required"`
	ValorNumerico int  `json:"valor_numerico" binding:"required,min=1,max=5"`
}
type CreateIndicadorReq struct {
	IDProyecto      uint    `json:"id_proyecto" binding:"required"`
	NombreIndicador string  `json:"nombre_indicador" binding:"required"`
	LineaBase       *float64 `json:"linea_base"`
	MetaPlanificada *float64 `json:"meta_planificada"`
	ValorAlcanzado  *float64 `json:"valor_alcanzado"`
	UnidadMedida    *string  `json:"unidad_medida"`
}

// ── Dashboard KPIs ──────────────────────────────────────────────
type DashboardKPIs struct {
	TotalProyectos       int64   `json:"total_proyectos"`
	ProyectosEnEjecucion int64   `json:"proyectos_en_ejecucion"`
	TotalBeneficiarios   int64   `json:"total_beneficiarios"`
	TotalDocentes        int64   `json:"total_docentes"`
	TotalEstudiantes     int64   `json:"total_estudiantes"`
	PresupuestoAprobado  float64 `json:"presupuesto_aprobado"`
	PresupuestoEjecutado float64 `json:"presupuesto_ejecutado"`
	PromedioSatisfaccion *float64 `json:"promedio_satisfaccion"`
	ProyectosPorEstado   []EstadoCount `json:"proyectos_por_estado"`
	ProyectosPorFacultad []FacultadCount `json:"proyectos_por_facultad"`
}
type EstadoCount struct {
	Estado string `json:"estado"`
	Total  int64  `json:"total"`
	Color  *string `json:"color"`
}
type FacultadCount struct {
	Facultad string `json:"facultad"`
	Total    int64  `json:"total"`
}

// ── Login mock ──────────────────────────────────────────────────
type LoginReq struct {
	Correo string `json:"correo" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}
type LoginResp struct {
	Token        string `json:"token"`
	Rol          string `json:"rol"` // ESTUDIANTE | DOCENTE | DIRECTIVO | ADMIN
	RolActor     string `json:"rol_actor"` // e.g. ESTUDIANTE_PROP
	RolActorID   uint   `json:"rol_actor_id"`
	TipoActor    string `json:"tipo_actor"` // DOCENTE/ESTUDIANTE/AUTORIDAD/COMITE/ADMINISTRATIVO
	Nombre       string `json:"nombre"`
	ID           uint   `json:"id"`
	Correo       string `json:"correo"`
	Escuela      *string `json:"escuela,omitempty"`
	Facultad     *string `json:"facultad,omitempty"`
}

// ── Generic ─────────────────────────────────────────────────────
type IDParam struct {
	ID uint `uri:"id" binding:"required"`
}
type CicloReq struct {
	Nombre      string `json:"nombre" binding:"required"`
	FechaInicio string `json:"fecha_inicio" binding:"required"`
	FechaFin    string `json:"fecha_fin" binding:"required"`
	Activo      bool   `json:"activo"`
}

var _ = time.Now
