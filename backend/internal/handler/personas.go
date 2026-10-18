package handler

import (
	"encoding/json"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/pkg/utils"
)

// ── Docente / Estudiante Handler ─────────────────────────────

type DocenteHandler struct {
	repo *repository.DocenteRepo
	db   *gorm.DB
}

func NewDocenteHandler(db *gorm.DB) *DocenteHandler {
	return &DocenteHandler{repo: repository.NewDocenteRepo(db), db: db}
}

// Crear docente
// @Tags		Personas
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/docentes [post]
func (h *DocenteHandler) Create(c *gin.Context) {
	var req dto.CreateDocenteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	d := &domain.Docente{
		CodigoDocente: req.CodigoDocente, DNI: req.DNI, Nombres: req.Nombres, Apellidos: req.Apellidos,
		Correo: req.Correo, IDEscuela: req.IDEscuela, IDDepartamento: req.IDDepartamento,
		TipoDocente: req.TipoDocente, Categoria: req.Categoria,
		CargaLectivaMax: req.CargaLectivaMax, CargaNoLectivaMax: req.CargaNoLectivaMax, Activo: true,
	}
	if err := h.repo.Create(d); err != nil {
		utils.Fail(c, 400, "Error crear docente", err.Error())
		return
	}
	utils.Created(c, d, "Docente creado")
}

// Listar docentes
// @Tags		Personas
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/docentes [get]
func (h *DocenteHandler) List(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	items, total, err := h.repo.FindAll(page, limit, c.Query("search"))
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}

// Obtener docente por id
// @Tags		Personas
// @Accept		json
// @Produce	json
// @Param		id path int true "ID docente"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/docentes/{id} [get]
func (h *DocenteHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	d, err := h.repo.FindByID(uint(id))
	if err != nil {
		utils.Fail(c, 404, "No encontrado", nil)
		return
	}
	utils.Success(c, h.conCarga(c, d), "OK")
}

// DocentesAsesores lista los docentes que se pueden proponer como asesor,
// con su carga disponible. Es lo que necesita el formulario de creación de
// proyecto, que no debe depender del módulo 'personas' (el estudiante no lo
// tiene: ver laFaculty completa no le corresponde, pero sí elegir quién le
// asesora). Todo llega por API y admite búsqueda, no hay lista fija.
//
//	?escuela=ID   filtra por escuela
//	?search=texto busca por nombre, apellido o código
//
// @Tags		Personas
// @Accept		json
// @Produce	json
// @Param		escuela query int false "ID de escuela"
// @Param		search query string false "Texto a buscar"
// @Success	200 {object} map[string]any "Docentes aptos para asesorar"
// @Router		/api/v1/docentes/asesores [get]
func (h *DocenteHandler) Asesores(c *gin.Context) {
	q := h.db.Model(&domain.Docente{}).Where("activo = ?", true)
	if v, err := strconv.Atoi(c.Query("escuela")); err == nil && v > 0 {
		q = q.Where("id_escuela = ?", v)
	}
	if s := strings.TrimSpace(c.Query("search")); s != "" {
		like := "%" + strings.ReplaceAll(strings.ReplaceAll(s, "%", "\\%"), "_", "\\_") + "%"
		q = q.Where("nombres LIKE ? OR apellidos LIKE ? OR codigo_docente LIKE ?", like, like, like)
	}
	var items []domain.Docente
	if err := q.Order("apellidos ASC, nombres ASC").Limit(200).Find(&items).Error; err != nil {
		utils.Fail(c, 500, "Error listando docentes", err.Error())
		return
	}
	// El selector necesita la carga para no proponer a quien ya llegó al tope.
	out := make([]map[string]any, 0, len(items))
	for i := range items {
		out = append(out, h.conCarga(c, &items[i]))
	}
	utils.Success(c, out, "OK")
}

// conCarga agrega el consumo real de carga no lectiva (Art.79/86 Ley 30220):
// horas ya asignadas, disponibilidad y si excede el tope autorizado.
func (h *DocenteHandler) conCarga(c *gin.Context, d *domain.Docente) map[string]any {
	var horas float64
	h.db.Raw(
		`SELECT COALESCE(SUM("horas_asignadas"), 0) FROM "RSU_Asignacion_Docente" WHERE "id_docente" = ?`,
		d.ID,
	).Scan(&horas)

	out := map[string]any{}
	raw, _ := json.Marshal(d)
	_ = json.Unmarshal(raw, &out)

	out["horas_asignadas_total"] = horas
	out["carga_disponible"] = d.CargaNoLectivaMax - horas
	out["excede_carga_max"] = horas > d.CargaNoLectivaMax
	return out
}

type EstudianteHandler struct {
	repo *repository.EstudianteRepo
	db   *gorm.DB
}

func NewEstudianteHandler(db *gorm.DB) *EstudianteHandler {
	return &EstudianteHandler{repo: repository.NewEstudianteRepo(db), db: db}
}

// Crear estudiante
// @Tags		Personas
// @Accept		json
// @Produce	json
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/estudiantes [post]
func (h *EstudianteHandler) Create(c *gin.Context) {
	var req dto.CreateEstudianteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	e := &domain.Estudiante{Codigo: req.Codigo, DNI: req.DNI, Nombres: req.Nombres, Apellidos: req.Apellidos, Correo: req.Correo, IDEscuela: req.IDEscuela, Estado: "ACTIVO"}
	if err := h.repo.Create(e); err != nil {
		utils.Fail(c, 400, "Error crear estudiante", err.Error())
		return
	}
	// Perfil completo: si se pide, se crea también la cuenta de acceso para que
	// el estudiante pueda iniciar sesión de inmediato (contraseña hasheada).
	if req.CrearUsuario {
		pass := req.Password
		if pass == "" {
			pass = "undc2026" // clave inicial institucional; el usuario la cambia al entrar
		}
		if len(pass) < 6 {
			utils.Fail(c, 400, "La contraseña debe tener al menos 6 caracteres", nil)
			return
		}
		rol := req.RolActor
		if rol == "" {
			rol = "ESTUDIANTE_PROP"
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
		if err != nil {
			utils.Fail(c, 500, "No se pudo asegurar la contraseña", err.Error())
			return
		}
		idPersona := e.ID
		u := &domain.RSUUsuario{
			Correo: e.Correo, Nombre: e.Nombres + " " + e.Apellidos,
			PasswordHash: string(hash), Rol: rol, TipoUsuario: "ESTUDIANTE",
			IDPersona: &idPersona, Activo: true,
		}
		if err := h.db.Create(u).Error; err != nil {
			// La persona ya quedó creada: se avisa en lugar de fallar en silencio.
			utils.Success(c, gin.H{
				"estudiante":     e,
				"usuario_creado": false,
				"aviso":          "La persona se creó, pero no se pudo crear el usuario de acceso: " + err.Error(),
			}, "Estudiante creado (sin usuario de acceso)")
			return
		}
		utils.Created(c, gin.H{"estudiante": e, "usuario_creado": true}, "Estudiante y usuario de acceso creados")
		return
	}
	utils.Created(c, e, "Estudiante creado")
}

// Listar estudiantes
// @Tags		Personas
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/estudiantes [get]
func (h *EstudianteHandler) List(c *gin.Context) {
	page, limit, _ := utils.GetPagination(c)
	items, total, err := h.repo.FindAll(page, limit, c.Query("search"))
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Paginated(c, items, utils.BuildMeta(page, limit, total), "OK")
}

// Obtener estudiante por id
// @Tags		Personas
// @Accept		json
// @Produce	json
// @Param		id path int true "ID estudiante"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/estudiantes/{id} [get]
func (h *EstudianteHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	e, err := h.repo.FindByID(uint(id))
	if err != nil {
		utils.Fail(c, 404, "No encontrado", nil)
		return
	}
	utils.Success(c, e, "OK")
}
