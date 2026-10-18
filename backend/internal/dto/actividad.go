package dto

// ── Actividad ───────────────────────────────────────────────────
type CreateActividadReq struct {
	IDProyecto      uint    `json:"id_proyecto" binding:"required"`
	IDEntregable    *uint   `json:"id_entregable"`
	Nombre          string  `json:"nombre" binding:"required,max=200"`
	Descripcion     *string `json:"descripcion"`
	FechaProgramada *string `json:"fecha_programada"`
	Lugar           *string `json:"lugar"`
	HoraInicio      *string `json:"hora_inicio"`
	HoraFin         *string `json:"hora_fin"`
	Minutos         int     `json:"minutos"`
	Estado          string  `json:"estado"`
}
