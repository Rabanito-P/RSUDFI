package service

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/repository"
)

// ── Dashboard Service ────────────────────────────────────────

type DashboardService struct {
	repo    *repository.DashboardRepo
	encRepo *repository.EncuestaRepo
	db      *gorm.DB
}

func NewDashboardService(db *gorm.DB) *DashboardService {
	return &DashboardService{repo: repository.NewDashboardRepo(db), encRepo: repository.NewEncuestaRepo(db), db: db}
}

// Conteos del catálogo BPMN. Se usan en la pantalla pública de login, donde aún
// no hay token: por eso solo devuelven cantidades, nunca contenido.
func (s *DashboardService) ContarEstados() (int64, error) {
	var n int64
	err := s.db.Raw(`SELECT COUNT(*) FROM "RSU_Estado_Proyecto"`).Scan(&n).Error
	return n, err
}

func (s *DashboardService) ContarTransiciones() (int64, error) {
	var n int64
	err := s.db.Raw(`SELECT COUNT(*) FROM "RSU_Transicion_Estado"`).Scan(&n).Error
	return n, err
}

func (s *DashboardService) ContarRoles() (int64, error) {
	var n int64
	err := s.db.Raw(`SELECT COUNT(*) FROM "RSU_Rol_Actor"`).Scan(&n).Error
	return n, err
}

// Trazabilidad de aprobaciones desde la vista vw_rsu_trazabilidad_aprobacion.
// Cada fila es una transición real con origen, destino, rol responsable,
// resultado, comentarios, documento de sustento y número de resolución.
func (s *DashboardService) Trazabilidad(limit int) ([]map[string]any, error) {
	if limit <= 0 || limit > 200 {
		limit = 10
	}
	var rows []map[string]any
	err := s.db.Raw(`
		SELECT "id_flujo", "codigo_proyecto", "titulo", "estado_origen", "estado_destino",
		       "rol_actor", "id_usuario_ejecutor", "fecha_transicion", "resultado",
		       "comentarios", "documento_sustento", "numero_resolucion"
		FROM vw_rsu_trazabilidad_aprobacion
		ORDER BY "fecha_transicion" DESC
		LIMIT ?`, limit).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	if rows == nil {
		rows = []map[string]any{}
	}
	return rows, nil
}
func (s *DashboardService) KPIs() (*dto.DashboardKPIs, error) {
	var totalBenef int64
	s.db.Model(&domain.RSUBeneficiario{}).Count(&totalBenef)
	var totalDoc int64
	s.db.Model(&domain.Docente{}).Count(&totalDoc)
	var totalEst int64
	s.db.Model(&domain.Estudiante{}).Count(&totalEst)
	var sumaAprobado *float64
	s.db.Model(&domain.RSUProyecto{}).Select("COALESCE(SUM(presupuesto_aprobado),0)").Scan(&sumaAprobado)
	var sumaEjecutado *float64
	s.db.Model(&domain.RSUProyecto{}).Select("COALESCE(SUM(monto_ejecutado),0)").Scan(&sumaEjecutado)
	var avgSat *float64
	s.db.Model(&domain.RSUEncuestaBeneficiario{}).Select("AVG(promedio_general)").Scan(&avgSat)
	porEstado, _ := s.repo.CountByEstado()
	porFacultad, _ := s.repo.CountByFacultad()
	var enEjec int64
	s.db.Model(&domain.RSUProyecto{}).Joins("JOIN \"RSU_Estado_Proyecto\" e ON \"RSU_Proyecto\".\"id_estado_actual\" = e.\"id_estado\"").Where("e.\"codigo\" = ?", "EN_EJECUCION").Count(&enEjec)

	kpis := &dto.DashboardKPIs{
		TotalProyectos:       s.repo.CountProyectos(),
		ProyectosEnEjecucion: enEjec,
		TotalBeneficiarios:   totalBenef,
		TotalDocentes:        totalDoc,
		TotalEstudiantes:     totalEst,
		PromedioSatisfaccion: avgSat,
		ProyectosPorEstado:   []dto.EstadoCount{},
		ProyectosPorFacultad: []dto.FacultadCount{},
	}
	if sumaAprobado != nil {
		kpis.PresupuestoAprobado = *sumaAprobado
	}
	if sumaEjecutado != nil {
		kpis.PresupuestoEjecutado = *sumaEjecutado
	}
	for _, e := range porEstado {
		kpis.ProyectosPorEstado = append(kpis.ProyectosPorEstado, dto.EstadoCount{Estado: e.Estado, Total: e.Total, Color: e.Color})
	}
	for _, f := range porFacultad {
		kpis.ProyectosPorFacultad = append(kpis.ProyectosPorFacultad, dto.FacultadCount{Facultad: f.Facultad, Total: f.Total})
	}
	// asegurar nunca null para JSON (evita crash frontend .map en estado vacío)
	if kpis.ProyectosPorEstado == nil {
		kpis.ProyectosPorEstado = []dto.EstadoCount{}
	}
	if kpis.ProyectosPorFacultad == nil {
		kpis.ProyectosPorFacultad = []dto.FacultadCount{}
	}
	return kpis, nil
}
