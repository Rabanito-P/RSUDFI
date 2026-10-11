package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// health
// Healthcheck de la API
// @Tags		Health
// @Accept		json
// @Produce	json
// @Success	200 {object} map[string]any "OK"
// @Failure	400 {object} map[string]any "Error de validación"
// @Failure	401 {object} map[string]any "No autorizado"
// @Router		/health [get]
func Health(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status":"ok","service":"UNDC RSU API","version":"1.0.0"}) }
