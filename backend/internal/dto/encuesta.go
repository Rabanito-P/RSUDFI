package dto

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
