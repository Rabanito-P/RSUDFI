package dto

// ── Presupuesto ─────────────────────────────────────────────────
type CreateMovimientoReq struct {
	IDProyecto    uint    `json:"id_proyecto" binding:"required"`
	IDFacultad    uint    `json:"id_facultad" binding:"required"`
	Tipo          string  `json:"tipo" binding:"required,oneof=ASIGNACION EJECUCION TRANSFERENCIA DEVOLUCION"`
	Monto         float64 `json:"monto" binding:"required,gt=0"`
	Fecha         string  `json:"fecha" binding:"required"`
	Observaciones *string `json:"observaciones"`
}
