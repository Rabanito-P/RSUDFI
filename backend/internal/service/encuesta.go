package service

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/repository"
)

// ── Encuesta Service ─────────────────────────────────────────

type EncuestaService struct {
	encuestaRepo *repository.EncuestaRepo
	pregRepo     *repository.CatalogoRepo
	db           *gorm.DB
}
func NewEncuestaService(db *gorm.DB) *EncuestaService {
	return &EncuestaService{encuestaRepo: repository.NewEncuestaRepo(db), pregRepo: repository.NewCatalogoRepo(db), db: db}
}
func cualitativo(v int) string {
	switch v {
	case 1: return "MUY_MALO"
	case 2: return "MALO"
	case 3: return "REGULAR"
	case 4: return "BUENO"
	case 5: return "MUY_BUENO"
	default: return "REGULAR"
	}
}
func escalaGlobal(avg float64) string {
	switch {
	case avg >= 4.5: return "MUY_BUENO"
	case avg >= 3.5: return "BUENO"
	case avg >= 2.5: return "REGULAR"
	case avg >= 1.5: return "MALO"
	default: return "MUY_MALO"
	}
}
func (s *EncuestaService) CrearEncuestaBeneficiario(req dto.CreateEncuestaBenefReq) (*domain.RSUEncuestaBeneficiario, error) {
	// Validar que beneficiario esté vinculado al proyecto
	var c int64
	s.db.Model(&domain.RSUProyectoBeneficiario{}).Where("id_proyecto = ? AND id_beneficiario = ?", req.IDProyecto, req.IDBeneficiario).Count(&c)
	if c == 0 {
		return nil, errors.New("beneficiario no está vinculado al proyecto")
	}
	// Validar duplicado (UNIQUE uk_encuesta_proyecto_benef) - pre-check
	var existe int64
	s.db.Model(&domain.RSUEncuestaBeneficiario{}).Where("id_proyecto = ? AND id_beneficiario = ?", req.IDProyecto, req.IDBeneficiario).Count(&existe)
	if existe > 0 {
		return nil, errors.New("ya existe encuesta para este beneficiario en el proyecto")
	}
	fecha, _ := time.Parse("2006-01-02", req.FechaAplicacion)
	if fecha.IsZero() { fecha = time.Now() }

	if len(req.Respuestas) == 0 {
		return nil, errors.New("la encuesta debe tener al menos una respuesta")
	}
	// Calcular promedio
	sum := 0
	for _, r := range req.Respuestas { sum += r.ValorNumerico }
	avg := float64(sum) / float64(len(req.Respuestas))
	calif := escalaGlobal(avg)

	enc := &domain.RSUEncuestaBeneficiario{
		IDProyecto: req.IDProyecto, IDBeneficiario: req.IDBeneficiario,
		FechaAplicacion: fecha, Modalidad: req.Modalidad,
		PromedioGeneral: &avg, Calificacion: &calif,
		Comentario: req.Comentario, Sugerencia: req.Sugerencia,
		Estado: "REGISTRADA",
	}
	if err := s.encuestaRepo.CreateEncuesta(enc); err != nil {
		// Capturar violación de UNIQUE (race condition: duplicado concurrente)
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "uk_encuesta_proyecto_benef") || strings.Contains(err.Error(), "unique constraint") {
			return nil, errors.New("ya existe encuesta para este beneficiario en el proyecto (409)")
		}
		return nil, err
	}
	// Crear respuestas - validar UNIQUE (id_encuesta_benef, id_pregunta)
	for _, r := range req.Respuestas {
		resp := &domain.RSURespuestaEncuesta{
			IDEncuestaBenef: enc.ID, IDPregunta: r.IDPregunta,
			ValorNumerico: r.ValorNumerico, ValorCualitativo: cualitativo(r.ValorNumerico),
		}
		if err := s.encuestaRepo.CreateRespuesta(resp); err != nil {
			if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
				_ = s.db.Delete(enc) // rollback encuesta si falla respuesta
				return nil, errors.New("respuesta duplicada para la misma pregunta (409)")
			}
			_ = s.db.Delete(enc)
			return nil, err
		}
	}
	return enc, nil
}
func (s *EncuestaService) ListByProyecto(idProyecto uint) ([]domain.RSUEncuestaBeneficiario, error) {
	return s.encuestaRepo.FindByProyecto(idProyecto)
}

