package domain

import (
	"time"
)

// ── MÓDULO 1: Estructura Organizacional ───────────────────────────

type Facultad struct {
	ID        uint      `gorm:"primaryKey;column:id_facultad" json:"id_facultad"`
	Codigo    string    `gorm:"column:codigo;unique;size:10" json:"codigo"`
	Nombre    string    `gorm:"column:nombre;size:200" json:"nombre"`
	DecanoID  *uint     `gorm:"column:decano_id" json:"decano_id"`
	Decano    *Docente  `gorm:"foreignKey:DecanoID" json:"decano,omitempty"`
	Activo    bool      `gorm:"column:activo;default:true" json:"activo"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}

func (Facultad) TableName() string { return "Facultad" }

type Escuela struct {
	ID         uint      `gorm:"primaryKey;column:id_escuela" json:"id_escuela"`
	IDFacultad uint      `gorm:"column:id_facultad" json:"id_facultad"`
	Facultad   *Facultad `gorm:"foreignKey:IDFacultad" json:"facultad,omitempty"`
	Codigo     string    `gorm:"column:codigo;unique;size:10" json:"codigo"`
	Nombre     string    `gorm:"column:nombre;size:200" json:"nombre"`
	DirectorID *uint     `gorm:"column:director_id" json:"director_id"`
	Director   *Docente  `gorm:"foreignKey:DirectorID" json:"director,omitempty"`
	Activo     bool      `gorm:"column:activo;default:true" json:"activo"`
}

func (Escuela) TableName() string { return "Escuela" }

type DepartamentoAcademico struct {
	ID         uint      `gorm:"primaryKey;column:id_departamento" json:"id_departamento"`
	IDFacultad uint      `gorm:"column:id_facultad" json:"id_facultad"`
	Nombre     string    `gorm:"column:nombre" json:"nombre"`
	DirectorID *uint     `gorm:"column:director_id" json:"director_id"`
}

func (DepartamentoAcademico) TableName() string { return "Departamento_Academico" }

type CicloAcademico struct {
	ID          uint      `gorm:"primaryKey;column:id_ciclo" json:"id_ciclo"`
	Nombre      string    `gorm:"column:nombre;unique;size:20" json:"nombre"`
	FechaInicio time.Time `gorm:"column:fecha_inicio" json:"fecha_inicio"`
	FechaFin    time.Time `gorm:"column:fecha_fin" json:"fecha_fin"`
	Activo      bool      `gorm:"column:activo" json:"activo"`
}

func (CicloAcademico) TableName() string { return "Ciclo_Academico" }

// ── MÓDULO 2: Personas ────────────────────────────────────────────

type Docente struct {
	ID                 uint       `gorm:"primaryKey;column:id_docente" json:"id_docente"`
	CodigoDocente      string     `gorm:"column:codigo_docente;unique;size:20" json:"codigo_docente"`
	DNI                string     `gorm:"column:dni;unique;size:8" json:"dni"`
	Nombres            string     `gorm:"column:nombres" json:"nombres"`
	Apellidos          string     `gorm:"column:apellidos" json:"apellidos"`
	Correo             string     `gorm:"column:correo_institucional" json:"correo_institucional"`
	IDEscuela          uint       `gorm:"column:id_escuela" json:"id_escuela"`
	Escuela            *Escuela   `gorm:"foreignKey:IDEscuela" json:"escuela,omitempty"`
	IDDepartamento     *uint      `gorm:"column:id_departamento" json:"id_departamento"`
	TipoDocente        string     `gorm:"column:tipo_docente" json:"tipo_docente"`
	Categoria          *string    `gorm:"column:categoria" json:"categoria"`
	CargaLectivaMax    float64    `gorm:"column:carga_lectiva_max" json:"carga_lectiva_max"`
	CargaNoLectivaMax  float64    `gorm:"column:carga_no_lectiva_max" json:"carga_no_lectiva_max"`
	Activo             bool       `gorm:"column:activo;default:true" json:"activo"`
	NombreCompleto     string     `gorm:"-" json:"nombre_completo"`
}

func (Docente) TableName() string { return "Docente" }

type Estudiante struct {
	ID            uint     `gorm:"primaryKey;column:id_estudiante" json:"id_estudiante"`
	Codigo        string   `gorm:"column:codigo_estudiante;unique" json:"codigo_estudiante"`
	DNI           string   `gorm:"column:dni;unique" json:"dni"`
	Nombres       string   `gorm:"column:nombres" json:"nombres"`
	Apellidos     string   `gorm:"column:apellidos" json:"apellidos"`
	Correo        string   `gorm:"column:correo_institucional" json:"correo_institucional"`
	IDEscuela     uint     `gorm:"column:id_escuela" json:"id_escuela"`
	Escuela       *Escuela `gorm:"foreignKey:IDEscuela" json:"escuela,omitempty"`
	Estado        string   `gorm:"column:estado" json:"estado"`
	FechaIngreso  *time.Time `gorm:"column:fecha_ingreso" json:"fecha_ingreso"`
}

func (Estudiante) TableName() string { return "Estudiante" }

type EstudianteCiclo struct {
	IDEstudiante         uint   `gorm:"primaryKey;column:id_estudiante" json:"id_estudiante"`
	IDCiclo              uint   `gorm:"primaryKey;column:id_ciclo" json:"id_ciclo"`
	CicloNumerico        int    `gorm:"column:ciclo_numerico" json:"ciclo_numerico"`
	CreditosMatriculados int    `gorm:"column:creditos_matriculados" json:"creditos_matriculados"`
	Estado               string `gorm:"column:estado" json:"estado"`
}

func (EstudianteCiclo) TableName() string { return "Estudiante_Ciclo" }

// ── MÓDULO 3: Config RSU ──────────────────────────────────────────

type RSUTipoProyecto struct {
	ID                  uint    `gorm:"primaryKey;column:id_tipo" json:"id_tipo"`
	Nombre              string  `gorm:"column:nombre" json:"nombre"`
	Descripcion         *string `gorm:"column:descripcion" json:"descripcion"`
	CicloMinimo         int     `gorm:"column:ciclo_minimo_estudiante" json:"ciclo_minimo_estudiante"`
	HorasDocenteMax     *float64 `gorm:"column:horas_docente_max" json:"horas_docente_max"`
	RequierePresupuesto bool    `gorm:"column:requiere_presupuesto" json:"requiere_presupuesto"`
	Activo              bool    `gorm:"column:activo" json:"activo"`
}

func (RSUTipoProyecto) TableName() string { return "RSU_Tipo_Proyecto" }

type RSULineaAccion struct {
	ID          uint    `gorm:"primaryKey;column:id_linea" json:"id_linea"`
	Nombre      string  `gorm:"column:nombre" json:"nombre"`
	Descripcion *string `gorm:"column:descripcion" json:"descripcion"`
	AlineacionODS *string `gorm:"column:alineacion_ods" json:"alineacion_ods"`
	Activo      bool    `gorm:"column:activo" json:"activo"`
}

func (RSULineaAccion) TableName() string { return "RSU_Linea_Accion" }

type RSURolProyecto struct {
	ID     uint   `gorm:"primaryKey;column:id_rol_proyecto" json:"id_rol_proyecto"`
	Nombre string `gorm:"column:nombre" json:"nombre"`
	AplicaA string `gorm:"column:aplica_a" json:"aplica_a"`
}

func (RSURolProyecto) TableName() string { return "RSU_Rol_Proyecto" }

type RSURolActor struct {
	ID     uint   `gorm:"primaryKey;column:id_rol_actor" json:"id_rol_actor"`
	Codigo string `gorm:"column:codigo;unique" json:"codigo"`
	Nombre string `gorm:"column:nombre" json:"nombre"`
	Tipo   string `gorm:"column:tipo" json:"tipo"`
}

func (RSURolActor) TableName() string { return "RSU_Rol_Actor" }

type RSUEstadoProyecto struct {
	ID        uint   `gorm:"primaryKey;column:id_estado" json:"id_estado"`
	Codigo    string `gorm:"column:codigo;unique" json:"codigo"`
	Nombre    string `gorm:"column:nombre" json:"nombre"`
	OrdenFlujo int   `gorm:"column:orden_flujo" json:"orden_flujo"`
	EsFinal   bool   `gorm:"column:es_final" json:"es_final"`
	ColorUI   *string `gorm:"column:color_ui" json:"color_ui"`
}

func (RSUEstadoProyecto) TableName() string { return "RSU_Estado_Proyecto" }

type RSUTipoDocumento struct {
	ID          uint   `gorm:"primaryKey;column:id_tipo_doc" json:"id_tipo_doc"`
	Nombre      string `gorm:"column:nombre" json:"nombre"`
	Etapa       string `gorm:"column:etapa" json:"etapa"`
	Obligatorio bool   `gorm:"column:obligatorio" json:"obligatorio"`
	Activo      bool   `gorm:"column:activo" json:"activo"`
}

func (RSUTipoDocumento) TableName() string { return "RSU_Tipo_Documento" }

type RSUTransicionEstado struct {
	ID               uint `gorm:"primaryKey;column:id_transicion" json:"id_transicion"`
	EstadoOrigen     uint `gorm:"column:estado_origen" json:"estado_origen"`
	EstadoDestino    uint `gorm:"column:estado_destino" json:"estado_destino"`
	IDRolActor       uint `gorm:"column:id_rol_actor" json:"id_rol_actor"`
	RequiereDocumento bool `gorm:"column:requiere_documento" json:"requiere_documento"`
	RolActor         *RSURolActor `gorm:"foreignKey:IDRolActor" json:"rol_actor,omitempty"`
}

func (RSUTransicionEstado) TableName() string { return "RSU_Transicion_Estado" }

// ── MÓDULO 4: Proyecto ────────────────────────────────────────────

type RSUProyecto struct {
	ID                    uint       `gorm:"primaryKey;column:id_proyecto" json:"id_proyecto"`
	CodigoProyecto        string     `gorm:"column:codigo_proyecto;unique" json:"codigo_proyecto"`
	Titulo                string     `gorm:"column:titulo" json:"titulo"`
	IDEscuela             uint       `gorm:"column:id_escuela" json:"id_escuela"`
	Escuela               *Escuela   `gorm:"foreignKey:IDEscuela" json:"escuela,omitempty"`
	IDTipo                uint       `gorm:"column:id_tipo" json:"id_tipo"`
	Tipo                  *RSUTipoProyecto `gorm:"foreignKey:IDTipo" json:"tipo,omitempty"`
	Modalidad             string     `gorm:"column:modalidad" json:"modalidad"` // SSU|PEP_FINANCIADO|PEP_AUTOFINANCIADO|VOLUNTARIADO|PUBLICACION_CIENTIFICA
	IDLineaAccion         *uint      `gorm:"column:id_linea_accion" json:"id_linea_accion"`
	LineaAccion           *RSULineaAccion `gorm:"foreignKey:IDLineaAccion" json:"linea_accion,omitempty"`
	IDEstadoActual        uint       `gorm:"column:id_estado_actual" json:"id_estado_actual"`
	EstadoActual          *RSUEstadoProyecto `gorm:"foreignKey:IDEstadoActual" json:"estado_actual,omitempty"`
	IDCicloCreacion       uint       `gorm:"column:id_ciclo_creacion" json:"id_ciclo_creacion"`
	CicloCreacion         *CicloAcademico `gorm:"foreignKey:IDCicloCreacion" json:"ciclo_creacion,omitempty"`
	IDEstudianteLider     *uint      `gorm:"column:id_estudiante_lider" json:"id_estudiante_lider"`
	EstudianteLider       *Estudiante `gorm:"foreignKey:IDEstudianteLider" json:"estudiante_lider,omitempty"`
	IDDocenteAsesor       *uint      `gorm:"column:id_docente_asesor" json:"id_docente_asesor"`
	DocenteAsesor         *Docente   `gorm:"foreignKey:IDDocenteAsesor" json:"docente_asesor,omitempty"`
	Descripcion           *string    `gorm:"column:descripcion" json:"descripcion"`
	ObjetivoGeneral       *string    `gorm:"column:objetivo_general" json:"objetivo_general"`
	ObjetivosEspecificos  *string    `gorm:"column:objetivos_especificos" json:"objetivos_especificos"`
	PoblacionBeneficiaria *string    `gorm:"column:poblacion_beneficiaria" json:"poblacion_beneficiaria"`
	SectorBeneficiario    *string    `gorm:"column:sector_beneficiario" json:"sector_beneficiario"`
	NumeroBeneficiarios   int        `gorm:"column:numero_beneficiarios" json:"numero_beneficiarios"`
	LugarIntervencion     *string    `gorm:"column:lugar_intervencion" json:"lugar_intervencion"`
	Semestre              *string    `gorm:"column:semestre" json:"semestre"`
	FechaInicioPlan       *time.Time `gorm:"column:fecha_inicio_plan" json:"fecha_inicio_plan"`
	FechaFinPlan          *time.Time `gorm:"column:fecha_fin_plan" json:"fecha_fin_plan"`
	PresupuestoSolicitado float64    `gorm:"column:presupuesto_solicitado" json:"presupuesto_solicitado"`
	PresupuestoAprobado   float64    `gorm:"column:presupuesto_aprobado" json:"presupuesto_aprobado"`
	MontoEjecutado        float64    `gorm:"column:monto_ejecutado" json:"monto_ejecutado"`
	PorcentajeAvance      float64    `gorm:"column:porcentaje_avance" json:"porcentaje_avance"`
	ArchivoProyectoURL    *string    `gorm:"column:archivo_proyecto_url" json:"archivo_proyecto_url"`
	ArchivoAprobacionURL  *string    `gorm:"column:archivo_aprobacion_url" json:"archivo_aprobacion_url"`
	IDResolucionAprobacion *uint     `gorm:"column:id_resolucion_aprobacion" json:"id_resolucion_aprobacion"`
	IDResolucionCierre    *uint      `gorm:"column:id_resolucion_cierre" json:"id_resolucion_cierre"`
	FechaAprobacion       *time.Time `gorm:"column:fecha_aprobacion" json:"fecha_aprobacion"`
	FechaCierre           *time.Time `gorm:"column:fecha_cierre" json:"fecha_cierre"`
	Activo                bool       `gorm:"column:activo" json:"activo"`
	CreatedAt             time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt             time.Time  `gorm:"column:updated_at" json:"updated_at"`
}

func (RSUProyecto) TableName() string { return "RSU_Proyecto" }

type RSUEntregable struct {
	ID              uint       `gorm:"primaryKey;column:id_entregable" json:"id_entregable"`
	IDProyecto      uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	Nombre          string     `gorm:"column:nombre" json:"nombre"`
	Orden           int        `gorm:"column:orden" json:"orden"`
	FechaLimite     *time.Time `gorm:"column:fecha_limite" json:"fecha_limite"`
	HorasAsignadas  float64    `gorm:"column:horas_asignadas" json:"horas_asignadas"`
	Estado          string     `gorm:"column:estado" json:"estado"`
	IDVerificador   *uint      `gorm:"column:id_verificador" json:"id_verificador"`
	Observaciones   *string    `gorm:"column:observaciones" json:"observaciones"`
}

func (RSUEntregable) TableName() string { return "RSU_Entregable" }

// ── MÓDULO 5: Asignación RRHH ─────────────────────────────────────

type RSUAsignacionDocente struct {
	ID              uint       `gorm:"primaryKey;column:id_asignacion" json:"id_asignacion"`
	IDProyecto      uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	Proyecto        *RSUProyecto `gorm:"foreignKey:IDProyecto" json:"proyecto,omitempty"`
	IDDocente       uint       `gorm:"column:id_docente" json:"id_docente"`
	Docente         *Docente   `gorm:"foreignKey:IDDocente" json:"docente,omitempty"`
	IDRolProyecto   uint       `gorm:"column:id_rol_proyecto" json:"id_rol_proyecto"`
	IDCiclo         uint       `gorm:"column:id_ciclo" json:"id_ciclo"`
	HorasAsignadas  float64    `gorm:"column:horas_asignadas" json:"horas_asignadas"`
	TipoHora        string     `gorm:"column:tipo_hora" json:"tipo_hora"`
	FechaAsignacion time.Time  `gorm:"column:fecha_asignacion" json:"fecha_asignacion"`
	EstadoAsignacion string    `gorm:"column:estado_asignacion" json:"estado_asignacion"`
	AprobadoPor     *uint      `gorm:"column:aprobado_por" json:"aprobado_por"`
}

func (RSUAsignacionDocente) TableName() string { return "RSU_Asignacion_Docente" }

type RSUParticipanteEstudiante struct {
	ID              uint       `gorm:"primaryKey;column:id_participante" json:"id_participante"`
	IDProyecto      uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDEstudiante    uint       `gorm:"column:id_estudiante" json:"id_estudiante"`
	Estudiante      *Estudiante `gorm:"foreignKey:IDEstudiante" json:"estudiante,omitempty"`
	IDRolProyecto   uint       `gorm:"column:id_rol_proyecto" json:"id_rol_proyecto"`
	HorasAcumuladas float64    `gorm:"column:horas_acumuladas" json:"horas_acumuladas"`
	CreditosOtorgados float64  `gorm:"column:creditos_otorgados" json:"creditos_otorgados"`
	FechaInscripcion time.Time `gorm:"column:fecha_inscripcion" json:"fecha_inscripcion"`
	EstadoParticipacion string `gorm:"column:estado_participacion" json:"estado_participacion"`
	ValidacionCiclo bool    `gorm:"column:validacion_ciclo" json:"validacion_ciclo"`
}

func (RSUParticipanteEstudiante) TableName() string { return "RSU_Participante_Estudiante" }

// ── MÓDULO 6: Documentos ──────────────────────────────────────────

type RSUDocumento struct {
	ID              uint       `gorm:"primaryKey;column:id_documento" json:"id_documento"`
	IDProyecto      uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDTipoDoc       uint       `gorm:"column:id_tipo_doc" json:"id_tipo_doc"`
	TipoDoc         *RSUTipoDocumento `gorm:"foreignKey:IDTipoDoc" json:"tipo_doc,omitempty"`
	NombreArchivo   string     `gorm:"column:nombre_archivo" json:"nombre_archivo"`
	URLArchivo      string     `gorm:"column:url_archivo" json:"url_archivo"`
	HashArchivo     *string    `gorm:"column:hash_archivo" json:"hash_archivo"`
	TamanoBytes     *int       `gorm:"column:tamaño_bytes" json:"tamano_bytes"`
	Version         int        `gorm:"column:version" json:"version"`
	IDUsuarioSubida uint       `gorm:"column:id_usuario_subida" json:"id_usuario_subida"`
	FechaSubida     time.Time  `gorm:"column:fecha_subida" json:"fecha_subida"`
	Vigente         bool       `gorm:"column:vigente" json:"vigente"`
	Observaciones   *string    `gorm:"column:observaciones" json:"observaciones"`
}

func (RSUDocumento) TableName() string { return "RSU_Documento" }

type RSUResolucion struct {
	ID              uint       `gorm:"primaryKey;column:id_resolucion" json:"id_resolucion"`
	IDProyecto      uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	TipoResolucion  string     `gorm:"column:tipo_resolucion" json:"tipo_resolucion"`
	NumeroResolucion string    `gorm:"column:numero_resolucion;unique" json:"numero_resolucion"`
	FechaResolucion time.Time  `gorm:"column:fecha_resolucion" json:"fecha_resolucion"`
	IDDocumento     *uint      `gorm:"column:id_documento" json:"id_documento"`
	IDOrgano        uint       `gorm:"column:id_organo" json:"id_organo"`
	Observaciones   *string    `gorm:"column:observaciones" json:"observaciones"`
}

func (RSUResolucion) TableName() string { return "RSU_Resolucion" }

// ── MÓDULO 7: Flujo ───────────────────────────────────────────────

type RSUFlujoAprobacion struct {
	ID                 uint       `gorm:"primaryKey;column:id_flujo" json:"id_flujo"`
	IDProyecto         uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDEstadoOrigen     uint       `gorm:"column:id_estado_origen" json:"id_estado_origen"`
	EstadoOrigen       *RSUEstadoProyecto `gorm:"foreignKey:IDEstadoOrigen" json:"estado_origen,omitempty"`
	IDEstadoDestino    uint       `gorm:"column:id_estado_destino" json:"id_estado_destino"`
	EstadoDestino      *RSUEstadoProyecto `gorm:"foreignKey:IDEstadoDestino" json:"estado_destino,omitempty"`
	IDRolActor         uint       `gorm:"column:id_rol_actor" json:"id_rol_actor"`
	RolActor           *RSURolActor `gorm:"foreignKey:IDRolActor" json:"rol_actor,omitempty"`
	IDUsuario          uint       `gorm:"column:id_usuario" json:"id_usuario"`
	IDDocumentoSustento *uint     `gorm:"column:id_documento_sustento" json:"id_documento_sustento"`
	IDResolucion       *uint      `gorm:"column:id_resolucion" json:"id_resolucion"`
	FechaTransicion    time.Time  `gorm:"column:fecha_transicion" json:"fecha_transicion"`
	Comentarios        *string    `gorm:"column:comentarios" json:"comentarios"`
	Resultado          string     `gorm:"column:resultado" json:"resultado"`
}

func (RSUFlujoAprobacion) TableName() string { return "RSU_Flujo_Aprobacion" }

type RSUVerificacion struct {
	ID              uint       `gorm:"primaryKey;column:id_verificacion" json:"id_verificacion"`
	IDProyecto      uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	TipoVerificacion string    `gorm:"column:tipo_verificacion" json:"tipo_verificacion"`
	IDVerificador   uint       `gorm:"column:id_verificador" json:"id_verificador"`
	IDRolVerificador uint     `gorm:"column:id_rol_verificador" json:"id_rol_verificador"`
	FechaVerificacion time.Time `gorm:"column:fecha_verificacion" json:"fecha_verificacion"`
	Resultado       string     `gorm:"column:resultado" json:"resultado"`
	Observaciones   *string    `gorm:"column:observaciones" json:"observaciones"`
	IDDocumento     *uint      `gorm:"column:id_documento" json:"id_documento"`
}

func (RSUVerificacion) TableName() string { return "RSU_Verificacion" }

// ── MÓDULO 8: Ejecución ───────────────────────────────────────────

type RSUActividadCampo struct {
	ID              uint       `gorm:"primaryKey;column:id_actividad" json:"id_actividad"`
	IDProyecto      uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDEntregable    *uint      `gorm:"column:id_entregable" json:"id_entregable"`
	Nombre          string     `gorm:"column:nombre" json:"nombre"`
	Descripcion     *string    `gorm:"column:descripcion" json:"descripcion"`
	FechaProgramada *time.Time `gorm:"column:fecha_programada" json:"fecha_programada"`
	FechaEjecucion  *time.Time `gorm:"column:fecha_ejecucion" json:"fecha_ejecucion"`
	HoraInicio      *string    `gorm:"column:hora_inicio" json:"hora_inicio"`
	HoraFin         *string    `gorm:"column:hora_fin" json:"hora_fin"`
	Minutos         int        `gorm:"column:minutos" json:"minutos"`
	Lugar           *string    `gorm:"column:lugar" json:"lugar"`
	Estado          string     `gorm:"column:estado" json:"estado"`
	NroBeneficiarios int       `gorm:"column:nro_beneficiarios" json:"nro_beneficiarios"`
	Fotos           []RSUActividadFoto `gorm:"foreignKey:IDActividad" json:"fotos,omitempty"`
}

func (RSUActividadCampo) TableName() string { return "RSU_Actividad_Campo" }

type RSUActividadFoto struct {
	ID         uint   `gorm:"primaryKey;column:id_foto" json:"id_foto"`
	IDActividad uint  `gorm:"column:id_actividad" json:"id_actividad"`
	URLFoto    string `gorm:"column:url_foto" json:"url_foto"`
	Descripcion *string `gorm:"column:descripcion" json:"descripcion"`
}

func (RSUActividadFoto) TableName() string { return "RSU_Actividad_Foto" }

type RSUMonitoreo struct {
	ID              uint       `gorm:"primaryKey;column:id_monitoreo" json:"id_monitoreo"`
	IDProyecto      uint       `gorm:"column:id_proyecto" json:"id_proyecto"`
	FechaMonitoreo  time.Time  `gorm:"column:fecha_monitoreo" json:"fecha_monitoreo"`
	IDMonitor       uint       `gorm:"column:id_monitor" json:"id_monitor"`
	PorcentajeAvance *float64  `gorm:"column:porcentaje_avance" json:"porcentaje_avance"`
	Resultado       string     `gorm:"column:resultado" json:"resultado"`
	Observaciones   *string    `gorm:"column:observaciones" json:"observaciones"`
}

func (RSUMonitoreo) TableName() string { return "RSU_Monitoreo" }

// ── MÓDULO 8B: Beneficiarios ──────────────────────────────────────

type RSUBeneficiario struct {
	ID                    uint       `gorm:"primaryKey;column:id_beneficiario" json:"id_beneficiario"`
	TipoBeneficiario      string     `gorm:"column:tipo_beneficiario" json:"tipo_beneficiario"`
	DNI                   *string    `gorm:"column:dni" json:"dni"`
	Nombres               *string    `gorm:"column:nombres" json:"nombres"`
	Apellidos             *string    `gorm:"column:apellidos" json:"apellidos"`
	RUC                   *string    `gorm:"column:ruc" json:"ruc"`
	RazonSocial           *string    `gorm:"column:razon_social" json:"razon_social"`
	Celular               *string    `gorm:"column:celular" json:"celular"`
	CorreoElectronico     *string    `gorm:"column:correo_electronico" json:"correo_electronico"`
	Direccion             *string    `gorm:"column:direccion" json:"direccion"`
	Distrito              *string    `gorm:"column:distrito" json:"distrito"`
	Provincia             *string    `gorm:"column:provincia" json:"provincia"`
	Departamento          *string    `gorm:"column:departamento" json:"departamento"`
	Sexo                  *string    `gorm:"column:sexo" json:"sexo"`
	CondicionVulnerabilidad *string  `gorm:"column:condicion_vulnerabilidad" json:"condicion_vulnerabilidad"`
	Activo                bool       `gorm:"column:activo" json:"activo"`
	FechaRegistro         time.Time  `gorm:"column:fecha_registro" json:"fecha_registro"`
}

func (RSUBeneficiario) TableName() string { return "RSU_Beneficiario" }

type RSUProyectoBeneficiario struct {
	ID              uint `gorm:"primaryKey;column:id_vinculacion" json:"id_vinculacion"`
	IDProyecto      uint `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDBeneficiario  uint `gorm:"column:id_beneficiario" json:"id_beneficiario"`
	Beneficiario    *RSUBeneficiario `gorm:"foreignKey:IDBeneficiario" json:"beneficiario,omitempty"`
	FechaIncorporacion time.Time `gorm:"column:fecha_incorporacion" json:"fecha_incorporacion"`
	RolEnProyecto   *string `gorm:"column:rol_en_proyecto" json:"rol_en_proyecto"`
	Activo          bool `gorm:"column:activo" json:"activo"`
}

func (RSUProyectoBeneficiario) TableName() string { return "RSU_Proyecto_Beneficiario" }

type RSUAsistenciaBeneficiario struct {
	ID            uint  `gorm:"primaryKey;column:id_asistencia" json:"id_asistencia"`
	IDActividad   uint  `gorm:"column:id_actividad" json:"id_actividad"`
	IDBeneficiario uint `gorm:"column:id_beneficiario" json:"id_beneficiario"`
	Beneficiario  *RSUBeneficiario `gorm:"foreignKey:IDBeneficiario" json:"beneficiario,omitempty"`
}

func (RSUAsistenciaBeneficiario) TableName() string { return "RSU_Asistencia_Beneficiario" }

// ── MÓDULO 9: Presupuesto ─────────────────────────────────────────

type RSUPresupuestoMovimiento struct {
	ID              uint      `gorm:"primaryKey;column:id_movimiento" json:"id_movimiento"`
	IDProyecto      uint      `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDFacultad      uint      `gorm:"column:id_facultad" json:"id_facultad"`
	Tipo            string    `gorm:"column:tipo" json:"tipo"`
	Monto           float64   `gorm:"column:monto" json:"monto"`
	Fecha           time.Time `gorm:"column:fecha" json:"fecha"`
	Observaciones   *string   `gorm:"column:observaciones" json:"observaciones"`
}

func (RSUPresupuestoMovimiento) TableName() string { return "RSU_Presupuesto_Movimiento" }

type RSUPagoVoucher struct {
	ID              uint      `gorm:"primaryKey;column:id_pago" json:"id_pago"`
	IDProyecto      uint      `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDFacultad      uint      `gorm:"column:id_facultad" json:"id_facultad"`
	Monto           float64   `gorm:"column:monto" json:"monto"`
	FechaPago       time.Time `gorm:"column:fecha_pago" json:"fecha_pago"`
	NumeroOperacion *string   `gorm:"column:numero_operacion" json:"numero_operacion"`
	Banco           *string   `gorm:"column:banco" json:"banco"`
	Estado          string    `gorm:"column:estado" json:"estado"`
}

func (RSUPagoVoucher) TableName() string { return "RSU_Pago_Voucher" }

// ── MÓDULO 10: Evaluación Impacto ─────────────────────────────────

type RSUPreguntaEncuesta struct {
	ID            uint   `gorm:"primaryKey;column:id_pregunta" json:"id_pregunta"`
	Codigo        string `gorm:"column:codigo;unique" json:"codigo"`
	TextoPregunta string `gorm:"column:texto_pregunta" json:"texto_pregunta"`
	Dimension     string `gorm:"column:dimension" json:"dimension"`
	Orden         int    `gorm:"column:orden" json:"orden"`
	Activa        bool   `gorm:"column:activa" json:"activa"`
}

func (RSUPreguntaEncuesta) TableName() string { return "RSU_Pregunta_Encuesta" }

type RSUEncuestaBeneficiario struct {
	ID                uint      `gorm:"primaryKey;column:id_encuesta_benef" json:"id_encuesta_benef"`
	IDProyecto        uint      `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDBeneficiario    uint      `gorm:"column:id_beneficiario" json:"id_beneficiario"`
	Beneficiario      *RSUBeneficiario `gorm:"foreignKey:IDBeneficiario" json:"beneficiario,omitempty"`
	FechaAplicacion   time.Time `gorm:"column:fecha_aplicacion" json:"fecha_aplicacion"`
	Modalidad         string    `gorm:"column:modalidad" json:"modalidad"`
	PromedioGeneral   *float64  `gorm:"column:promedio_general" json:"promedio_general"`
	Calificacion      *string   `gorm:"column:calificacion_cualitativa" json:"calificacion_cualitativa"`
	Comentario        *string   `gorm:"column:comentario_abierto" json:"comentario_abierto"`
	Sugerencia        *string   `gorm:"column:sugerencia_mejora" json:"sugerencia_mejora"`
	Estado            string    `gorm:"column:estado" json:"estado"`
}

func (RSUEncuestaBeneficiario) TableName() string { return "RSU_Encuesta_Beneficiario" }

type RSURespuestaEncuesta struct {
	ID              uint  `gorm:"primaryKey;column:id_respuesta" json:"id_respuesta"`
	IDEncuestaBenef uint `gorm:"column:id_encuesta_benef" json:"id_encuesta_benef"`
	IDPregunta      uint  `gorm:"column:id_pregunta" json:"id_pregunta"`
	Pregunta        *RSUPreguntaEncuesta `gorm:"foreignKey:IDPregunta" json:"pregunta,omitempty"`
	ValorNumerico   int   `gorm:"column:valor_numerico" json:"valor_numerico"`
	ValorCualitativo string `gorm:"column:valor_cualitativo" json:"valor_cualitativo"`
}

func (RSURespuestaEncuesta) TableName() string { return "RSU_Respuesta_Encuesta" }

type RSUIndicadorImpacto struct {
	ID              uint     `gorm:"primaryKey;column:id_indicador" json:"id_indicador"`
	IDProyecto      uint     `gorm:"column:id_proyecto" json:"id_proyecto"`
	NombreIndicador string   `gorm:"column:nombre_indicador" json:"nombre_indicador"`
	LineaBase       *float64 `gorm:"column:linea_base" json:"linea_base"`
	MetaPlanificada *float64 `gorm:"column:meta_planificada" json:"meta_planificada"`
	ValorAlcanzado  *float64 `gorm:"column:valor_alcanzado" json:"valor_alcanzado"`
	UnidadMedida    *string  `gorm:"column:unidad_medida" json:"unidad_medida"`
	PorcentajeLogro *float64 `gorm:"column:porcentaje_logro" json:"porcentaje_logro"`
}

func (RSUIndicadorImpacto) TableName() string { return "RSU_Indicador_Impacto" }

// ── Vistas ────────────────────────────────────────────────────────

type VwProyectoResumen struct {
	IDProyecto         uint     `gorm:"column:id_proyecto" json:"id_proyecto"`
	CodigoProyecto     string   `gorm:"column:codigo_proyecto" json:"codigo_proyecto"`
	Titulo             string   `gorm:"column:titulo" json:"titulo"`
	Facultad           string   `gorm:"column:facultad" json:"facultad"`
	Escuela            string   `gorm:"column:escuela" json:"escuela"`
	TipoProyecto       string   `gorm:"column:tipo_proyecto" json:"tipo_proyecto"`
	EstadoActual       string   `gorm:"column:estado_actual" json:"estado_actual"`
	Semestre           *string  `gorm:"column:semestre" json:"semestre"`
	PresupuestoAprobado float64 `gorm:"column:presupuesto_aprobado" json:"presupuesto_aprobado"`
	MontoEjecutado     float64  `gorm:"column:monto_ejecutado" json:"monto_ejecutado"`
	PorcentajeAvance   float64  `gorm:"column:porcentaje_avance" json:"porcentaje_avance"`
	EstudianteLider    *string  `gorm:"column:estudiante_lider" json:"estudiante_lider"`
	DocenteAsesor      *string  `gorm:"column:docente_asesor" json:"docente_asesor"`
	TotalBeneficiarios int      `gorm:"column:total_beneficiarios" json:"total_beneficiarios"`
	PromedioSatisfaccion *float64 `gorm:"column:promedio_satisfaccion" json:"promedio_satisfaccion"`
}

func (VwProyectoResumen) TableName() string { return "vw_rsu_proyectos_resumen" }

type RSUAuditoriaLog struct {
	ID                uint       `gorm:"primaryKey;column:id_log" json:"id_log"`
	IDUsuario         uint       `gorm:"column:id_usuario" json:"id_usuario"`
	IDProyecto        *uint      `gorm:"column:id_proyecto" json:"id_proyecto"`
	Accion            string     `gorm:"column:accion" json:"accion"`
	TablaAfectada     *string    `gorm:"column:tabla_afectada" json:"tabla_afectada"`
	IDRegistroAfectado *uint     `gorm:"column:id_registro_afectado" json:"id_registro_afectado"`
	ValorAnterior     *string    `gorm:"column:valor_anterior" json:"valor_anterior"`
	ValorNuevo        *string    `gorm:"column:valor_nuevo" json:"valor_nuevo"`
	IPOrigen          *string    `gorm:"column:ip_origen" json:"ip_origen"`
	FechaHora         time.Time  `gorm:"column:fecha_hora" json:"fecha_hora"`
}

func (RSUAuditoriaLog) TableName() string { return "RSU_Auditoria_Log" }

// ── Notificaciones por rol (12 lanes BPMN) ────────────────────────
type RSUNotificacion struct {
	ID              uint      `gorm:"primaryKey;column:id_notificacion" json:"id_notificacion"`
	IDUsuario       *uint     `gorm:"column:id_usuario" json:"id_usuario"`
	RolDestino      string    `gorm:"column:rol_destino;size:50" json:"rol_destino"`
	Tipo            string    `gorm:"column:tipo;size:30" json:"tipo"`
	Titulo          string    `gorm:"column:titulo;size:200" json:"titulo"`
	Mensaje         *string   `gorm:"column:mensaje" json:"mensaje"`
	IDProyecto      *uint     `gorm:"column:id_proyecto" json:"id_proyecto"`
	Proyecto        *RSUProyecto `gorm:"foreignKey:IDProyecto" json:"proyecto,omitempty"`
	Leido           bool      `gorm:"column:leido;default:false" json:"leido"`
	CreatedAt       time.Time `gorm:"column:created_at" json:"created_at"`
}

func (RSUNotificacion) TableName() string { return "RSU_Notificacion" }

// ── Roles dinámicos por proyecto (V1.1 §1) ──────────────
// Un usuario puede tener 1+ roles por proyecto (asignación dinámica).
type RSUProyectoRol struct {
	IDProyecto      uint      `gorm:"primaryKey;column:id_proyecto" json:"id_proyecto"`
	IDUsuario       uint      `gorm:"primaryKey;column:id_usuario" json:"id_usuario"`
	TipoUsuario     string    `gorm:"primaryKey;column:tipo_usuario" json:"tipo_usuario"` // DOCENTE|ESTUDIANTE|ADMINISTRATIVO
	RolActor        string    `gorm:"primaryKey;column:rol_actor;size:50" json:"rol_actor"`
	Proyecto        *RSUProyecto `gorm:"foreignKey:IDProyecto" json:"proyecto,omitempty"`
	RolActorRef     *RSURolActor `gorm:"foreignKey:RolActor;references:Codigo" json:"rol_actor_ref,omitempty"`
	FechaAsignacion time.Time `gorm:"column:fecha_asignacion" json:"fecha_asignacion"`
	AsignadoPor     *uint     `gorm:"column:asignado_por" json:"asignado_por"`
	Activo          bool      `gorm:"column:activo;default:true" json:"activo"`
}

func (RSUProyectoRol) TableName() string { return "RSU_Proyecto_Rol" }

// ── Comité RSU (M04) — designación por Decano, período 2 años ──
type RSUComiteRSU struct {
	ID                uint      `gorm:"primaryKey;column:id_comite" json:"id_comite"`
	IDEscuela         uint      `gorm:"column:id_escuela" json:"id_escuela"`
	Escuela           *Escuela  `gorm:"foreignKey:IDEscuela" json:"escuela,omitempty"`
	IDDocente         uint      `gorm:"column:id_docente" json:"id_docente"`
	Docente           *Docente  `gorm:"foreignKey:IDDocente" json:"docente,omitempty"`
	EsPresidente      bool      `gorm:"column:es_presidente" json:"es_presidente"`
	PeriodoInicio     string    `gorm:"column:periodo_inicio" json:"periodo_inicio"`
	PeriodoFin        string    `gorm:"column:periodo_fin" json:"periodo_fin"`
	IDResolucionDesignacion *uint `gorm:"column:id_resolucion_designacion" json:"id_resolucion_designacion"`
	Estado            string    `gorm:"column:estado" json:"estado"` // ACTIVO|INACTIVO
	FechaDesignacion  time.Time `gorm:"column:fecha_designacion" json:"fecha_designacion"`
	DesignadoPor      *uint     `gorm:"column:designado_por" json:"designado_por"`
}

func (RSUComiteRSU) TableName() string { return "RSU_Comite_RSU" }

// ── Configuración (M11) — parámetros configurables (V1.1 §5.1) ──
type RSUConfiguracion struct {
	ID             uint      `gorm:"primaryKey;column:id_config" json:"id_config"`
	Clave          string    `gorm:"column:clave;unique" json:"clave"`
	Valor          string    `gorm:"column:valor" json:"valor"`
	Descripcion    *string   `gorm:"column:descripcion" json:"descripcion"`
	Tipo           string    `gorm:"column:tipo" json:"tipo"`           // STRING|INT|FLOAT|BOOL|LIST|JSON
	Ambito         string    `gorm:"column:ambito" json:"ambito"`       // GLOBAL|FACULTAD|ESCUELA
	IDFacultad     *uint     `gorm:"column:id_facultad" json:"id_facultad"`
	ActualizadoPor *uint     `gorm:"column:actualizado_por" json:"actualizado_por"`
	UpdatedAt      time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (RSUConfiguracion) TableName() string { return "RSU_Configuracion" }
