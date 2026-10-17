package handler

import (
	"errors"
	"net/http"
	"strconv"
	"unicode"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/dto"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/pkg/utils"
)

// ── Gestión de usuarios y permisos (solo ADMIN) ──
//
// El administrador crea usuarios, los activa/desactiva y decide a qué módulos
// del sistema puede entrar cada uno.

// Roles de negocio UNDC disponibles para asignar a un usuario.
// Los 12 roles BPMN del documento (HU-041): los 6 operativos de siempre más
// Departamento, Central RS, Abastecimiento, Comité Calidad, Colaborador y
// Comité PS — cada uno con sus transiciones en RSU_Transicion_Estado.
var ROLES_NEGOCIO = []dto.ModuloInfo{
	{Clave: "ESTUDIANTE_PROP", Nombre: "Estudiante proponente", Desc: "Crea el borrador y propone el proyecto"},
	{Clave: "ESTUDIANTE_EJEC", Nombre: "Estudiante ejecutor", Desc: "Ejecuta, sube entregables y evidencias"},
	{Clave: "DOCENTE_RESP", Nombre: "Docente responsable", Desc: "Asesora, monitorea y verifica entregables"},
	{Clave: "DOCENTE_COLAB", Nombre: "Docente colaborador", Desc: "Apoya la ejecución de campo"},
	{Clave: "DIR_ESCUELA", Nombre: "Director de Escuela Profesional", Desc: "Revisa y da V°B° a los proyectos"},
	{Clave: "COMITE_PS", Nombre: "Comité Proyección Social", Desc: "Revisa no duplicidad y alinea al Plan RS"},
	{Clave: "DIR_RS_FACULTAD", Nombre: "Dir. RS Facultad", Desc: "Prioriza banco, presupuesto y monitoreo"},
	{Clave: "CONSEJO_FACULTAD", Nombre: "Consejo de Facultad", Desc: "Dictamina y emite resoluciones"},
	{Clave: "DIR_DEPTO", Nombre: "Director de Departamento", Desc: "Asigna la carga no lectiva (Art.86)"},
	{Clave: "DIR_CENTRAL_RS", Nombre: "Dir. Central RS / VRA", Desc: "Padrón oficial, memoria anual y reporte SUNEDU"},
	{Clave: "UNIDAD_ABAST", Nombre: "Unidad de Abastecimiento", Desc: "Verifica vouchers y ejecución presupuestal"},
	{Clave: "COMITE_CALIDAD", Nombre: "Comité de Calidad", Desc: "Procesa impacto e indicadores Likert"},
	{Clave: "ADMIN", Nombre: "Administrador", Desc: "Control total: usuarios y módulos"},
}

// Tipo de usuario derivado del rol (usado por el resto del sistema).
func tipoDeRol(rol string) string {
	switch rol {
	case "ESTUDIANTE_PROP", "ESTUDIANTE_EJEC":
		return "ESTUDIANTE"
	case "DOCENTE_RESP", "DOCENTE_COLAB":
		return "DOCENTE"
	default:
		// DIR_ESCUELA, COMITE_PS, DIR_RS_FACULTAD, CONSEJO_FACULTAD, DIR_DEPTO,
		// DIR_CENTRAL_RS, UNIDAD_ABAST, COMITE_CALIDAD, ADMIN
		return "ADMINISTRATIVO"
	}
}

// Módulos activables del sistema.
var MODULOS = []dto.ModuloInfo{
	{Clave: "proyectos", Nombre: "Proyectos", Desc: "Crear y consultar proyectos"},
	{Clave: "bandeja", Nombre: "Bandeja", Desc: "Revisar pendientes de aprobación"},
	{Clave: "entregables", Nombre: "Entregables", Desc: "Verificar entregables enviados"},
	{Clave: "evidencias", Nombre: "Evidencias", Desc: "Actividades de campo y fotos"},
	{Clave: "beneficiarios", Nombre: "Beneficiarios", Desc: "Padrón de beneficiarios"},
	{Clave: "presupuesto", Nombre: "Presupuesto", Desc: "Movimientos y vouchers"},
	{Clave: "encuestas", Nombre: "Encuestas", Desc: "Aplicar encuestas Likert"},
	{Clave: "monitoreo", Nombre: "Monitoreo", Desc: "Seguimiento de avance"},
	{Clave: "reportes", Nombre: "Reportes", Desc: "Reportes y memoria anual"},
	{Clave: "personas", Nombre: "Personas", Desc: "Gestión de docentes y estudiantes"},
	{Clave: "estructura", Nombre: "Estructura", Desc: "Facultades, escuelas y ciclos"},
	{Clave: "catalogos", Nombre: "Catálogos", Desc: "Tipos, líneas y estados"},
	{Clave: "documentos", Nombre: "Documentos", Desc: "Archivo documental"},
	{Clave: "auditoria", Nombre: "Auditoría", Desc: "Trazabilidad de acciones"},
}

type UsuarioAdminHandler struct {
	repo *repository.UsuarioRepo
	db   *gorm.DB
}

func NewUsuarioAdminHandler(db *gorm.DB) *UsuarioAdminHandler {
	return &UsuarioAdminHandler{repo: repository.NewUsuarioRepo(db), db: db}
}

// esAdmin comprueba el rol de negocio del token (claim user_id → RSU_Usuario.rol).// El middleware pone rol_actor (CODIGO como DIR_ESCUELA, ADMIN...), no "rol".
func esAdmin(c *gin.Context) bool {
	v, ok := c.Get("rol_actor")
	return ok && v == "ADMIN"
}

func (h *UsuarioAdminHandler) vista(u *domain.RSUUsuario, modulos []string) dto.UsuarioConPermisos {
	return dto.UsuarioConPermisos{
		ID: u.ID, Correo: u.Correo, Nombre: u.Nombre,
		Rol: u.Rol, RolActor: u.Rol, TipoUsuario: u.TipoUsuario,
		IDPersona: u.IDPersona, Activo: u.Activo,
		UltimoLogin: u.UltimoLogin, Modulos: modulos,
	}
}

// List devuelve todos los usuarios con sus módulos activos.
// @Tags		Usuarios
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	401 "No autorizado"
// @Failure	403 "Solo administradores"
// @Router		/api/v1/usuarios [get]
func (h *UsuarioAdminHandler) List(c *gin.Context) {
	if !esAdmin(c) {
		utils.Fail(c, http.StatusForbidden, "Solo el administrador puede gestionar usuarios", nil)
		return
	}
	usuarios, err := h.repo.FindAll()
	if err != nil {
		utils.Fail(c, 500, "Error al listar usuarios", err.Error())
		return
	}
	out := make([]dto.UsuarioConPermisos, 0, len(usuarios))
	for i := range usuarios {
		mods, _ := h.repo.PermisosDe(usuarios[i].ID)
		out = append(out, h.vista(&usuarios[i], clavesModulos(mods)))
	}
	utils.Success(c, out, "OK")
}

// Crear da de alta un usuario con contraseña hasheada y módulos iniciales.
// @Tags		Usuarios
// @Accept		json
// @Produce	json
// @Success	201 {object} map[string]any "Creado"
// @Router		/api/v1/usuarios [post]
func (h *UsuarioAdminHandler) Crear(c *gin.Context) {
	if !esAdmin(c) {
		utils.Fail(c, http.StatusForbidden, "Solo el administrador puede crear usuarios", nil)
		return
	}
	var req dto.CrearUsuarioReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, 400, "Datos inválidos: correo, nombre, contraseña y rol son obligatorios", err.Error())
		return
	}
	if !rolValido(req.RolActor) {
		utils.Fail(c, 400, "rol_actor inválido para el sistema UNDC", nil)
		return
	}
	// OWASP A07: política de contraseña (mínimo 8, mayúscula, minúscula y número).
	if err := validarPassword(req.Password); err != nil {
		utils.Fail(c, 400, err.Error(), nil)
		return
	}
	if _, err := h.repo.FindByCorreo(req.Correo); err == nil {
		utils.Fail(c, 409, "Ya existe un usuario con ese correo", nil)
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.Fail(c, 500, "No se pudo asegurar la contraseña", err.Error())
		return
	}
	u := &domain.RSUUsuario{
		Correo: req.Correo, Nombre: req.Nombre, PasswordHash: string(hash),
		Rol: req.RolActor, TipoUsuario: tipoDeRol(req.RolActor), IDPersona: req.IDPersona,
		Activo: req.Activo == nil || *req.Activo,
	}
	if err := h.repo.Create(u); err != nil {
		utils.Fail(c, 500, "No se pudo crear el usuario", err.Error())
		return
	}
	if len(req.Modulos) > 0 {
		if err := h.repo.ReemplazarPermisos(u.ID, req.Modulos); err != nil {
			utils.Fail(c, 500, "Usuario creado, pero falló asignar módulos", err.Error())
			return
		}
	}
	utils.Created(c, h.vista(u, req.Modulos), "Usuario creado")
}

// Actualizar edita nombre, rol, estado, persona, contraseña y módulos.
// @Tags		Usuarios
// @Accept		json
// @Produce	json
// @Router		/api/v1/usuarios/{id} [put]
func (h *UsuarioAdminHandler) Actualizar(c *gin.Context) {
	if !esAdmin(c) {
		utils.Fail(c, http.StatusForbidden, "Solo el administrador puede editar usuarios", nil)
		return
	}
	id, _ := strconv.Atoi(c.Param("id"))
	u, err := h.repo.FindByID(uint(id))
	if err != nil {
		utils.Fail(c, 404, "Usuario no encontrado", nil)
		return
	}
	var req dto.ActualizarUsuarioReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, 400, "Datos inválidos", err.Error())
		return
	}
	if req.RolActor != nil {
		if !rolValido(*req.RolActor) {
			utils.Fail(c, 400, "rol_actor inválido", nil)
			return
		}
		u.Rol = *req.RolActor
		u.TipoUsuario = tipoDeRol(*req.RolActor)
	}
	if req.Nombre != nil {
		u.Nombre = *req.Nombre
	}
	if req.IDPersona != nil {
		u.IDPersona = req.IDPersona
	}
	if req.Activo != nil {
		u.Activo = *req.Activo
	}
	if req.Password != nil && *req.Password != "" {
		if err := validarPassword(*req.Password); err != nil {
			utils.Fail(c, 400, err.Error(), nil)
			return
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			utils.Fail(c, 500, "No se pudo asegurar la contraseña", err.Error())
			return
		}
		u.PasswordHash = string(hash)
	}
	if err := h.repo.Update(u); err != nil {
		utils.Fail(c, 500, "No se pudo actualizar el usuario", err.Error())
		return
	}
	if req.Modulos != nil {
		if err := h.repo.ReemplazarPermisos(u.ID, req.Modulos); err != nil {
			utils.Fail(c, 500, "Usuario actualizado, pero falló guardar módulos", err.Error())
			return
		}
	}
	mods, _ := h.repo.PermisosDe(u.ID)
	utils.Success(c, h.vista(u, clavesModulos(mods)), "Usuario actualizado")
}

// Eliminar borra un usuario y sus permisos. Nunca permite borrarse a sí mismo.
// @Tags		Usuarios
// @Produce	json
// @Router		/api/v1/usuarios/{id} [delete]
func (h *UsuarioAdminHandler) Eliminar(c *gin.Context) {
	if !esAdmin(c) {
		utils.Fail(c, http.StatusForbidden, "Solo el administrador puede eliminar usuarios", nil)
		return
	}
	id, _ := strconv.Atoi(c.Param("id"))
	if id == tokenUserID(c) {
		utils.Fail(c, 400, "No puedes eliminar tu propio usuario", nil)
		return
	}
	if err := h.repo.EliminarPermisos(uint(id)); err != nil {
		utils.Fail(c, 500, "No se pudieron eliminar los permisos", err.Error())
		return
	}
	if err := h.repo.Delete(uint(id)); err != nil {
		utils.Fail(c, 500, "No se pudo eliminar el usuario", err.Error())
		return
	}
	utils.Success(c, nil, "Usuario eliminado")
}

// Permiso activa o desactiva un módulo puntual.
// @Tags		Usuarios
// @Accept		json
// @Produce	json
// @Router		/api/v1/usuarios/{id}/permisos [put]
func (h *UsuarioAdminHandler) Permiso(c *gin.Context) {
	if !esAdmin(c) {
		utils.Fail(c, http.StatusForbidden, "Solo el administrador cambia permisos", nil)
		return
	}
	id, _ := strconv.Atoi(c.Param("id"))
	if _, err := h.repo.FindByID(uint(id)); err != nil {
		utils.Fail(c, 404, "Usuario no encontrado", nil)
		return
	}
	var req dto.PermisoReq
	if err := c.ShouldBindJSON(&req); err != nil || req.Modulo == "" {
		utils.Fail(c, 400, "modulo requerido", err.Error())
		return
	}
	if !moduloValido(req.Modulo) {
		utils.Fail(c, 400, "módulo desconocido", nil)
		return
	}
	if err := h.repo.SetPermiso(uint(id), req.Modulo, req.Activo); err != nil {
		utils.Fail(c, 500, "No se pudo guardar el permiso", err.Error())
		return
	}
	mods, _ := h.repo.PermisosDe(uint(id))
	utils.Success(c, clavesModulos(mods), "Permiso actualizado")
}

// RolesDisponibles alimenta el selector del formulario.
// @Tags		Usuarios
// @Produce	json
// @Router		/api/v1/usuarios/roles-disponibles [get]
func (h *UsuarioAdminHandler) RolesDisponibles(c *gin.Context) {
	utils.Success(c, ROLES_NEGOCIO, "OK")
}

// ModulosDisponibles alimenta las casillas de activación.
// @Tags		Usuarios
// @Produce	json
// @Router		/api/v1/usuarios/modulos-disponibles [get]
func (h *UsuarioAdminHandler) ModulosDisponibles(c *gin.Context) {
	utils.Success(c, MODULOS, "OK")
}

func clavesModulos(ps []domain.RSUUsuarioPermiso) []string {
	out := make([]string, 0, len(ps))
	for _, p := range ps {
		if p.Activo {
			out = append(out, p.Modulo)
		}
	}
	return out
}

func rolValido(rol string) bool {
	for _, r := range ROLES_NEGOCIO {
		if r.Clave == rol {
			return true
		}
	}
	return false
}

func moduloValido(mod string) bool {
	for _, m := range MODULOS {
		if m.Clave == mod {
			return true
		}
 	}
 	return false
 }

// validarPassword exige la política OWASP A07: 8+ caracteres, mayúscula,
// minúscula y número. Se aplica al crear y al cambiar contraseñas.
func validarPassword(p string) error {
	if len(p) < 8 {
		return errors.New("la contraseña debe tener al menos 8 caracteres")
	}
	var mayus, minus, num bool
	for _, r := range p {
		switch {
		case unicode.IsUpper(r):
			mayus = true
		case unicode.IsLower(r):
			minus = true
		case unicode.IsDigit(r):
			num = true
		}
	}
	if !mayus || !minus || !num {
		return errors.New("la contraseña debe combinar mayúsculas, minúsculas y números")
	}
	return nil
}
