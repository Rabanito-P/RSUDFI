package handler

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/service"
	"undc-rsu/backend/pkg/utils"
)

// ── Asignacion Handler ───────────────────────────────────────

type AsignacionHandler struct {
	svc *service.AsignacionService
	db  *gorm.DB
}

func NewAsignacionHandler(db *gorm.DB) *AsignacionHandler {
	return &AsignacionHandler{svc: service.NewAsignacionService(db), db: db}
}
// Asignar docente (valida carga no lectiva Art.86)
// @Tags		Asignaciones
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/asignaciones/docente [post]
func (h *AsignacionHandler) AsignarDocente(c *gin.Context) {
	var req dto.AsignarDocenteReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	a, err := h.svc.AsignarDocente(req)
	if err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Created(c, a, "Docente asignado (pendiente aprobación)")
}
// Inscribir estudiante (valida ciclo mínimo + no duplicado)
// @Tags		Asignaciones
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/asignaciones/estudiante [post]
func (h *AsignacionHandler) InscribirEstudiante(c *gin.Context) {
	var req dto.InscribirEstudianteReq
	if err := c.ShouldBindJSON(&req); err != nil { utils.ValidationFail(c, err.Error()); return }
	p, err := h.svc.InscribirEstudiante(req)
	if err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Created(c, p, "Estudiante inscrito")
}
// InscribirPorDatos inscribe a un compañero indicando directamente su nombre y
// correo, sin conocer su id. Si no existe como persona se crea (con su cuenta
// de acceso) y se vincula al proyecto. Pensado para el momento de crear el
// proyecto, donde el líder arma su equipo escribiendo los datos.
// @Tags		Asignaciones
// @Accept		json
// @Produce	json
// @Success	201 "Participante inscrito"
// @Router		/api/v1/proyectos/:id/participantes [post]
func (h *AsignacionHandler) InscribirPorDatos(c *gin.Context) {
	idProj, _ := strconv.Atoi(c.Param("id"))
	if idProj == 0 {
		utils.Fail(c, 400, "id_proyecto requerido", nil)
		return
	}
	var req dto.InscribirPorDatosReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	if req.Nombres == "" || req.Correo == "" {
		utils.Fail(c, 400, "nombres y correo son obligatorios", nil)
		return
	}

	// ¿Ya existe la persona con ese correo?
	var est domain.Estudiante
	err := h.db.Where("correo_institucional = ?", req.Correo).First(&est).Error
	if err != nil {
		correo := strings.ToLower(strings.TrimSpace(req.Correo))
		if !strings.HasSuffix(correo, "@undc.edu.pe") {
			utils.Fail(c, 400, "El correo debe ser institucional (@undc.edu.pe)", nil)
			return
		}
		// Se busca la escuela del proyecto para asignarla al nuevo integrante.
		var proy domain.RSUProyecto
		if err := h.db.First(&proy, idProj).Error; err != nil {
			utils.Fail(c, 404, "Proyecto no encontrado", nil)
			return
		}
		codigo := "EST" + strings.NewReplacer("@", "", ".", "").Replace(correo)
		if len(codigo) > 12 {
			codigo = codigo[:12]
		}
		apellidos := req.Apellidos
		if apellidos == "" {
			apellidos = "—"
		}
		est = domain.Estudiante{
			Codigo:     strings.ToUpper(codigo),
			DNI:        req.DNI,
			Nombres:    req.Nombres,
			Apellidos:  apellidos,
			Correo:     correo,
			IDEscuela:  proy.IDEscuela,
			Estado:     "ACTIVO",
		}
		if err := h.db.Create(&est).Error; err != nil {
			utils.Fail(c, 400, "No se pudo crear el perfil del participante: "+err.Error(), nil)
			return
		}
		// Cuenta de acceso para que también pueda entrar al sistema.
		var yaExiste domain.RSUUsuario
		if h.db.Where("correo = ?", correo).First(&yaExiste).Error != nil {
			hash, herr := bcrypt.GenerateFromPassword([]byte(utils.ClaveRegistroInicial()), bcrypt.DefaultCost)
			if herr == nil {
				idPersona := est.ID
				_ = h.db.Create(&domain.RSUUsuario{
					Correo: correo, Nombre: req.Nombres + " " + apellidos,
					PasswordHash: string(hash), Rol: "ESTUDIANTE_EJEC",
					TipoUsuario: "ESTUDIANTE", IDPersona: &idPersona, Activo: true,
				}).Error
			}
		}
	}

	_, err = h.svc.InscribirEstudiante(dto.InscribirEstudianteReq{
		IDProyecto:    uint(idProj),
		IDEstudiante:  est.ID,
		IDRolProyecto: req.IDRolProyecto,
	})
	if err != nil {
		utils.Fail(c, 400, err.Error(), nil)
		return
	}
	utils.Created(c, gin.H{
		"participante": gin.H{
			"id_estudiante": est.ID,
			"nombres":       est.Nombres,
			"apellidos":     est.Apellidos,
			"correo":        est.Correo,
		},
	}, "Participante inscrito")
}

// Docentes asignados al proyecto
// @Tags		Asignaciones
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/docentes [get]
func (h *AsignacionHandler) ListDocentes(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.svc.ListDocentes(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}
// Estudiantes inscritos en el proyecto
// @Tags		Asignaciones
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/estudiantes [get]
func (h *AsignacionHandler) ListEstudiantes(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	list, err := h.svc.ListEstudiantes(uint(id))
	if err != nil { utils.Fail(c, 500, "Error", err.Error()); return }
	utils.Success(c, list, "OK")
}
// Retirar estudiante del proyecto
// @Tags		Asignaciones
// @Accept		json
// @Produce	json
// @Param		id path int true "ID proyecto"
// @Param		estudianteId path int true "ID estudiante"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/proyectos/{id}/estudiantes/{estudianteId} [delete]
func (h *AsignacionHandler) RetirarEstudiante(c *gin.Context) {
	idProj, _ := strconv.Atoi(c.Param("id"))
	idEst, _ := strconv.Atoi(c.Param("estudianteId"))
	if err := h.svc.RetirarEstudiante(uint(idProj), uint(idEst)); err != nil { utils.Fail(c, 400, err.Error(), nil); return }
	utils.Success(c, nil, "Estudiante retirado — queda libre para otro proyecto")
}

