package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/repository"
	"undc-rsu/backend/pkg/utils"
)

// ── Configuración (M11) ─────────────────────────────────────

type ConfiguracionHandler struct{ repo *repository.ConfiguracionRepo }

func NewConfiguracionHandler(db *gorm.DB) *ConfiguracionHandler {
	return &ConfiguracionHandler{repo: repository.NewConfiguracionRepo(db)}
}

// Listar parámetros de configuración
// @Tags		Configuración
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/configuracion [get]
func (h *ConfiguracionHandler) List(c *gin.Context) {
	ambito := c.Query("ambito")
	list, err := h.repo.FindAll(ambito, nil)
	if err != nil {
		utils.Fail(c, 500, "Error", err.Error())
		return
	}
	utils.Success(c, list, "OK")
}

// Obtener parámetro por clave
// @Tags		Configuración
// @Accept		json
// @Produce	json
// @Param		clave path string true "Clave del parámetro"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/configuracion/{clave} [get]
func (h *ConfiguracionHandler) Get(c *gin.Context) {
	clave := c.Param("clave")
	item, err := h.repo.GetByClave(clave)
	if err != nil {
		utils.Fail(c, 404, "Clave no encontrada", nil)
		return
	}
	utils.Success(c, item, "OK")
}

// Crear/actualizar parámetro
// @Tags		Configuración
// @Accept		json
// @Produce	json
// @Param		clave path string true "Clave del parámetro"
// @Param		body body object true "Cuerpo JSON"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/configuracion/{clave} [put]
func (h *ConfiguracionHandler) Upsert(c *gin.Context) {
	clave := c.Param("clave")
	var body struct {
		Valor       string  `json:"valor" binding:"required"`
		Descripcion *string `json:"descripcion"`
		Tipo        string  `json:"tipo"`
		Ambito      string  `json:"ambito"`
		IDFacultad  *uint   `json:"id_facultad"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ValidationFail(c, err.Error())
		return
	}
	ambito := body.Ambito
	if ambito == "" {
		ambito = "GLOBAL"
	}
	tipo := body.Tipo
	if tipo == "" {
		tipo = "STRING"
	}
	cfg := &domain.RSUConfiguracion{
		Clave: clave, Valor: body.Valor, Descripcion: body.Descripcion,
		Tipo: tipo, Ambito: ambito, IDFacultad: body.IDFacultad,
	}
	if err := h.repo.Upsert(cfg); err != nil {
		utils.Fail(c, 400, "Error guardando configuración", err.Error())
		return
	}
	utils.Success(c, cfg, "Configuración guardada")
}

// Eliminar parámetro
// @Tags		Configuración
// @Accept		json
// @Produce	json
// @Param		id path int true "ID config"
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/api/v1/configuracion/{id} [delete]
func (h *ConfiguracionHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.repo.Delete(uint(id)); err != nil {
		utils.Fail(c, 400, "Error eliminando", err.Error())
		return
	}
	utils.Success(c, nil, "Eliminada")
}

