package domain

import (
	"time"
)

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
	ID             uint             `gorm:"primaryKey;column:id_encuesta_benef" json:"id_encuesta_benef"`
	IDProyecto     uint             `gorm:"column:id_proyecto" json:"id_proyecto"`
	IDBeneficiario uint             `gorm:"column:id_beneficiario" json:"id_beneficiario"`
	Beneficiario   *RSUBeneficiario `gorm:"foreignKey:IDBeneficiario" json:"beneficiario,omitempty"`
	// Respuestas individuales (P01..P06): permiten calcular el promedio por
	// pregunta y por dimensión en el panel de resultados.
	Respuestas      []RSURespuestaEncuesta `gorm:"foreignKey:IDEncuestaBenef" json:"respuestas,omitempty"`
	FechaAplicacion time.Time              `gorm:"column:fecha_aplicacion" json:"fecha_aplicacion"`
	Modalidad       string                 `gorm:"column:modalidad" json:"modalidad"`
	PromedioGeneral *float64               `gorm:"column:promedio_general" json:"promedio_general"`
	Calificacion    *string                `gorm:"column:calificacion_cualitativa" json:"calificacion_cualitativa"`
	Comentario      *string                `gorm:"column:comentario_abierto" json:"comentario_abierto"`
	Sugerencia      *string                `gorm:"column:sugerencia_mejora" json:"sugerencia_mejora"`
	Estado          string                 `gorm:"column:estado" json:"estado"`
}

func (RSUEncuestaBeneficiario) TableName() string { return "RSU_Encuesta_Beneficiario" }

type RSURespuestaEncuesta struct {
	ID               uint                 `gorm:"primaryKey;column:id_respuesta" json:"id_respuesta"`
	IDEncuestaBenef  uint                 `gorm:"column:id_encuesta_benef" json:"id_encuesta_benef"`
	IDPregunta       uint                 `gorm:"column:id_pregunta" json:"id_pregunta"`
	Pregunta         *RSUPreguntaEncuesta `gorm:"foreignKey:IDPregunta" json:"pregunta,omitempty"`
	ValorNumerico    int                  `gorm:"column:valor_numerico" json:"valor_numerico"`
	ValorCualitativo string               `gorm:"column:valor_cualitativo" json:"valor_cualitativo"`
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
