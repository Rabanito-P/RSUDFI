package dto

import (
	"time"
)

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
