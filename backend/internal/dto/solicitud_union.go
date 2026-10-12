package dto

// ── Solicitudes de unión a PEP (HU-063..HU-068) ─────────────────
type CrearSolicitudUnionReq struct {
	IDEstudiante uint   `json:"id_estudiante" binding:"required"`
	Mensaje      string `json:"mensaje" binding:"max=500"`
}
type RechazarSolicitudReq struct {
	MotivoRapido  string `json:"motivo_rapido" binding:"required"`
	MotivoRechazo string `json:"motivo_rechazo" binding:"max=500"`
}
