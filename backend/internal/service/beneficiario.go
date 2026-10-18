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

// ── Beneficiario Service ─────────────────────────────────────

type BeneficiarioService struct {
	repo *repository.BeneficiarioRepo
}

func NewBeneficiarioService(db *gorm.DB) *BeneficiarioService {
	return &BeneficiarioService{repo: repository.NewBeneficiarioRepo(db)}
}
func (s *BeneficiarioService) Create(req dto.CreateBeneficiarioReq) (*domain.RSUBeneficiario, error) {
	if req.TipoBeneficiario == "PERSONA_NATURAL" && (req.DNI == nil || *req.DNI == "") {
		return nil, errors.New("DNI requerido para persona natural")
	}
	if req.TipoBeneficiario == "INSTITUCION" && (req.RUC == nil || *req.RUC == "") {
		return nil, errors.New("RUC requerido para institución")
	}
	b := &domain.RSUBeneficiario{
		TipoBeneficiario: req.TipoBeneficiario,
		DNI:              req.DNI, Nombres: req.Nombres, Apellidos: req.Apellidos,
		RUC: req.RUC, RazonSocial: req.RazonSocial,
		Celular: req.Celular, CorreoElectronico: req.Correo,
		Direccion: req.Direccion, Distrito: req.Distrito,
		Sexo: req.Sexo, CondicionVulnerabilidad: req.Condicion,
		Activo: true, FechaRegistro: time.Now(),
	}
	if err := s.repo.Create(b); err != nil {
		low := strings.ToLower(err.Error())
		if strings.Contains(low, "duplicate") || strings.Contains(low, "unique") {
			return nil, errors.New("beneficiario con DNI/RUC ya existe")
		}
		return nil, err
	}
	return b, nil
}
func (s *BeneficiarioService) List(page, limit int, search string) ([]domain.RSUBeneficiario, int64, error) {
	return s.repo.FindAll(page, limit, search)
}
func (s *BeneficiarioService) Get(id uint) (*domain.RSUBeneficiario, error) {
	return s.repo.FindByID(id)
}
func (s *BeneficiarioService) Vincular(req dto.VincularBeneficiarioReq) error {
	if s.repo.ExistsVinculo(req.IDProyecto, req.IDBeneficiario) {
		return errors.New("beneficiario ya vinculado al proyecto")
	}
	pb := &domain.RSUProyectoBeneficiario{
		IDProyecto: req.IDProyecto, IDBeneficiario: req.IDBeneficiario,
		FechaIncorporacion: time.Now(), RolEnProyecto: req.RolEnProyecto, Activo: true,
	}
	return s.repo.Vincular(pb)
}
func (s *BeneficiarioService) ListByProyecto(idProyecto uint) ([]domain.RSUProyectoBeneficiario, error) {
	return s.repo.ListByProyecto(idProyecto)
}
