package dto

// ── Dashboard KPIs ──────────────────────────────────────────────
type DashboardKPIs struct {
	TotalProyectos       int64           `json:"total_proyectos"`
	ProyectosEnEjecucion int64           `json:"proyectos_en_ejecucion"`
	TotalBeneficiarios   int64           `json:"total_beneficiarios"`
	TotalDocentes        int64           `json:"total_docentes"`
	TotalEstudiantes     int64           `json:"total_estudiantes"`
	PresupuestoAprobado  float64         `json:"presupuesto_aprobado"`
	PresupuestoEjecutado float64         `json:"presupuesto_ejecutado"`
	PromedioSatisfaccion *float64        `json:"promedio_satisfaccion"`
	ProyectosPorEstado   []EstadoCount   `json:"proyectos_por_estado"`
	ProyectosPorFacultad []FacultadCount `json:"proyectos_por_facultad"`
}
type EstadoCount struct {
	Estado string  `json:"estado"`
	Total  int64   `json:"total"`
	Color  *string `json:"color"`
}
type FacultadCount struct {
	Facultad string `json:"facultad"`
	Total    int64  `json:"total"`
}
