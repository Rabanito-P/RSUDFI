package dto

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

// InscribirPorDatosReq permite sumar un compañero al equipo escribiendo su
// nombre y correo, sin conocer su id. Si la persona no existe, se crea.
type InscribirPorDatosReq struct {
	Nombres      string `json:"nombres" binding:"required"`
	Apellidos    string `json:"apellidos"`
	Correo       string `json:"correo" binding:"required,email"`
	// DNI es obligatorio solo si la persona aún no existe.
	DNI          string `json:"dni"`
	IDRolProyecto uint  `json:"id_rol_proyecto" binding:"required"`
}
