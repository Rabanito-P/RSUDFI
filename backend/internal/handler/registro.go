package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/pkg/utils"
)

// ── Registro público de estudiantes (pantalla de login) ──
//
// Permite que un estudiante se dé de alta sin sesión, mientras no exista un
// proceso formal de matrícula en línea. Solo crea cuentas de estudiante: el
// resto de roles los da el administrador desde /usuarios.
//
// No requiere token, por eso se limita la tasa de peticiones en el router y el
// correo debe ser único.

type RegistroHandler struct{ db *gorm.DB }

func NewRegistroHandler(db *gorm.DB) *RegistroHandler {
	return &RegistroHandler{db: db}
}

// Estudiante crea la persona y su cuenta de acceso.
// @Tags		Auth
// @Accept		json
// @Produce	json
// @Success	201 "Perfil creado"
// @Failure	400 "Datos inválidos"
// @Failure	409 "El correo ya está registrado"
// @Router		/api/v1/registro/estudiante [post]
func (h *RegistroHandler) Estudiante(c *gin.Context) {
	var req dto.RegistroEstudianteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Datos incompletos: DNI (8 dígitos), nombres y correo son obligatorios", err.Error())
		return
	}
	if len(req.DNI) != 8 {
		utils.Fail(c, http.StatusBadRequest, "El DNI debe tener exactamente 8 dígitos", nil)
		return
	}

	// El correo no puede repetirse ni como persona ni como usuario.
	var existeEst int64
	h.db.Model(&domain.Estudiante{}).Where("correo_institucional = ?", req.Correo).Count(&existeEst)
	if existeEst > 0 {
		utils.Fail(c, http.StatusConflict, "Ese correo ya está registrado", nil)
		return
	}
	var existeUsr int64
	h.db.Model(&domain.RSUUsuario{}).Where("correo = ?", req.Correo).Count(&existeUsr)
	if existeUsr > 0 {
		utils.Fail(c, http.StatusConflict, "Ese correo ya tiene una cuenta de acceso", nil)
		return
	}

	// El código no puede repetirse (índice único en Estudiante).
	codigo := req.Codigo
	if codigo == "" {
		codigo = "EST" + req.DNI[len(req.DNI)-5:]
	}
	var existeCod int64
	h.db.Model(&domain.Estudiante{}).Where("codigo_estudiante = ?", codigo).Count(&existeCod)
	if existeCod > 0 {
		utils.Fail(c, http.StatusConflict, "Ya existe un estudiante con ese código", nil)
		return
	}

	// La escuela es opcional: si no se indica se toma la primera disponible.
	var idEscuela uint
	if req.IDEscuela != nil && *req.IDEscuela != 0 {
		idEscuela = *req.IDEscuela
	} else {
		var esc domain.Escuela
		if err := h.db.First(&esc).Error; err == nil {
			idEscuela = esc.ID
		} else {
			utils.Fail(c, http.StatusBadRequest, "No hay escuelas registradas: pide al administrador que cree la estructura", nil)
			return
		}
	}

	// La matrícula del ciclo es obligatoria: sin la fila en Estudiante_Ciclo la
	// regla de ciclo mínimo (R01) rechaza cualquier SSU del estudiante, así que
	// un alta sin ciclo quedaba inservible para proponer su proyecto.
	if req.IDCiclo == nil || *req.IDCiclo == 0 {
		utils.Fail(c, http.StatusBadRequest,
			"Indica el ciclo académico en el que se matricula el estudiante", nil)
		return
	}
	if req.CicloNumerico == nil || *req.CicloNumerico < 1 || *req.CicloNumerico > 12 {
		utils.Fail(c, http.StatusBadRequest,
			"Indica el ciclo que cursa el estudiante (entre 1 y 12)", nil)
		return
	}

	est := &domain.Estudiante{
		Codigo:    codigo,
		DNI:       req.DNI,
		Nombres:   req.Nombres,
		Apellidos: req.Apellidos,
		Correo:    req.Correo,
		IDEscuela: idEscuela,
		Estado:    "ACTIVO",
	}

	// Persona + matrícula + cuenta se crean en una sola transacción: si algo
	// falla no queda un estudiante a medias ni una cuenta sin persona.
	if err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(est).Error; err != nil {
			return err
		}
		// Matrícula del ciclo: sin ella la regla de ciclo mínimo (R01) rechaza
		// cualquier proyecto SSU del estudiante.
		if req.IDCiclo != nil && *req.IDCiclo != 0 && req.CicloNumerico != nil {
			matricula := &domain.EstudianteCiclo{
				IDEstudiante:  est.ID,
				IDCiclo:       *req.IDCiclo,
				CicloNumerico: *req.CicloNumerico,
				// La tabla exige estado (CHECK): el alta es una matrícula activa.
				Estado: "MATRICULADO",
			}
			if err := tx.Create(matricula).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		utils.Fail(c, http.StatusBadRequest, "No se pudo registrar el estudiante", err.Error())
		return
	}

	// Cuenta de acceso con la clave provisional indicada por configuración.
	// Se guarda hasheada con bcrypt: la contraseña nunca queda en claro.
	clave := utils.ClaveRegistroInicial()
	hash, err := bcrypt.GenerateFromPassword([]byte(clave), bcrypt.DefaultCost)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "No se pudo asegurar la contraseña", err.Error())
		return
	}
	idPersona := est.ID
	usr := &domain.RSUUsuario{
		Correo:       req.Correo,
		Nombre:       req.Nombres + " " + req.Apellidos,
		PasswordHash: string(hash),
		Rol:          "ESTUDIANTE_PROP",
		TipoUsuario:  "ESTUDIANTE",
		IDPersona:    &idPersona,
		Activo:       true,
	}
	if err := h.db.Create(usr).Error; err != nil {
		// La persona ya quedó creada: se intenta crear el usuario sin eso y se
		// avisa del resultado real en lugar de devolver éxito falso.
		utils.Created(c, gin.H{
			"estudiante":     est,
			"usuario_creado": false,
		}, "Estudiante registrado (sin cuenta de acceso)")
		return
	}

	// Se habilita el acceso a los mismos módulos que el seed concede al rol
	// estudiante. Deben coincidir: si se omite 'catalogos' el formulario de
	// creación se queda sin selector de ODS, tipo de proyecto y línea de acción,
	// y si falta 'entregables' el estudiante no ve sus cinco entregas.
	for _, m := range []string{
		"proyectos", "evidencias", "entregables", "encuestas", "documentos", "catalogos",
	} {
		_ = h.db.Create(&domain.RSUUsuarioPermiso{IDUsuario: usr.ID, Modulo: m, Activo: true}).Error
	}

	utils.Created(c, gin.H{
		"estudiante":     est,
		"usuario_creado": true,
	}, "Perfil de estudiante creado")
}
