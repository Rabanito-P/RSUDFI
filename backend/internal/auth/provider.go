package auth

import (
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/config"
	"undc-rsu/backend/internal/domain"
)

type Principal struct {
	ID         uint
	Correo     string
	Nombre     string
	Rol        string
	RolActor   string
	RolActorID uint
	TipoActor  string
	PersonaID  uint
	Token      string
}

type Provider interface {
	Login(correo, password string) (*Principal, error)
}

func (p *DBProvider) Mode() string { return "bd" }

type DBProvider struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewDBProvider(db *gorm.DB, cfg *config.Config) *DBProvider {
	return &DBProvider{db: db, cfg: cfg}
}

func rolGlobal(rolActor, tipoUsuario string) string {
	switch {
	case rolActor == "ADMIN":
		return "ADMIN"
	case tipoUsuario == "ESTUDIANTE":
		return "ESTUDIANTE"
	case tipoUsuario == "DOCENTE":
		return "DOCENTE"
	default:
		return "DIRECTIVO"
	}
}

// hashDummy es un hash bcrypt válido (coste por defecto) generado una sola vez.
// Se usa para que un usuario inexistente siga pagando el coste de bcrypt y el
// tiempo de respuesta no revele si el correo existe o no (OWASP A07).
var hashDummy = func() string {
	h, err := bcrypt.GenerateFromPassword([]byte("comparacion-de-tiempo-constante"), bcrypt.DefaultCost)
	if err != nil {
		// En la práctica nunca ocurre: coste y entrada son válidos.
		return "$2a$10$" + "0000000000000000000000000000000000000000000000000000"
	}
	return string(h)
}()

func (p *DBProvider) Login(correo, password string) (*Principal, error) {
	var u domain.RSUUsuario
	// Se busca solo por correo: mezclar el estado en la consulta permitiría
	// distinguir "no existe" de "existe pero está inactivo" por el tiempo de
	// respuesta. El estado se comprueba después, con el mismo mensaje.
	err := p.db.Where("correo = ?", correo).First(&u).Error
	if err != nil {
		// Se compara contra un hash válido para mantener el tiempo constante.
		_ = bcrypt.CompareHashAndPassword([]byte(hashDummy), []byte(password))
		return nil, errors.New("credenciales inválidas")
	}
	if !u.Activo {
		_ = bcrypt.CompareHashAndPassword([]byte(hashDummy), []byte(password))
		return nil, errors.New("credenciales inválidas")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("credenciales inválidas")
	}
	pr := &Principal{
		ID:        u.ID,
		Correo:    u.Correo,
		Nombre:    p.resolveNombre(u),
		Rol:       rolGlobal(u.Rol, u.TipoUsuario),
		RolActor:  u.Rol,
		TipoActor: u.TipoUsuario,
	}
	var ra domain.RSURolActor
	if err := p.db.First(&ra, "codigo = ?", u.Rol).Error; err == nil {
		pr.RolActorID = ra.ID
	}
	pr.PersonaID = p.resolvePersonaID(u)
	p.db.Model(&u).Update("ultimo_login", time.Now())
	pr.Token = p.generateToken(pr)
	return pr, nil
}

// resolvePersonaID devuelve el id de la persona (Docente.id o Estudiante.id)
// asociada al usuario. Los endpoints /docentes/:id y /estudiantes/:id usan ese id,
// no el de RSU_Usuario.
func (p *DBProvider) resolvePersonaID(u domain.RSUUsuario) uint {
	if u.IDPersona != nil && *u.IDPersona != 0 {
		return *u.IDPersona
	}
	switch u.TipoUsuario {
	case "DOCENTE":
		var d domain.Docente
		if err := p.db.First(&d, "correo_institucional = ?", u.Correo).Error; err == nil {
			return d.ID
		}
	case "ESTUDIANTE":
		var e domain.Estudiante
		if err := p.db.First(&e, "correo_institucional = ?", u.Correo).Error; err == nil {
			return e.ID
		}
	}
	return 0
}

func (p *DBProvider) resolveNombre(u domain.RSUUsuario) string {
	if n := strings.TrimSpace(u.Nombre); n != "" {
		return n
	}
	if u.IDPersona != nil {
		if u.TipoUsuario == "DOCENTE" {
			var d domain.Docente
			if err := p.db.First(&d, "id_docente = ?", *u.IDPersona).Error; err == nil {
				return d.Nombres + " " + d.Apellidos
			}
		}
		if u.TipoUsuario == "ESTUDIANTE" {
			var e domain.Estudiante
			if err := p.db.First(&e, "id_estudiante = ?", *u.IDPersona).Error; err == nil {
				return e.Nombres + " " + e.Apellidos
			}
		}
	}
	var d domain.Docente
	if err := p.db.First(&d, "correo_institucional = ?", u.Correo).Error; err == nil {
		return d.Nombres + " " + d.Apellidos
	}
	var e domain.Estudiante
	if err := p.db.First(&e, "correo_institucional = ?", u.Correo).Error; err == nil {
		return e.Nombres + " " + e.Apellidos
	}
	return ""
}

func (p *DBProvider) generateToken(pr *Principal) string {
	ahora := time.Now()
	claims := jwt.MapClaims{
		"user_id":    pr.ID,
		"correo":     pr.Correo,
		"rol":        pr.Rol,
		"rol_actor":  pr.RolActor,
		"tipo_actor": pr.TipoActor,
		// Emisor y audiencia: el token solo vale para esta API (evita reuso).
		"iss": "undc-rsu",
		"aud": "undc-rsu-api",
		// Expira en 8 horas: una jornada laboral. El frontend renueva iniciando sesión.
		"exp": ahora.Add(8 * time.Hour).Unix(),
		"iat": ahora.Unix(),
		// No aceptar el token antes de su emisión (relojes desajustados).
		"nbf": ahora.Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	s, _ := token.SignedString([]byte(p.cfg.JWTSecret))
	return s
}
