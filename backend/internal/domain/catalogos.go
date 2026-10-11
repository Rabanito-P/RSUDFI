package domain

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
