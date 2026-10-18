package dto

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
