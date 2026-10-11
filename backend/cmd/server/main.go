package main

import (
	"log"
	"os"

	"undc-rsu/backend/internal/config"
	"undc-rsu/backend/internal/middleware"
	"undc-rsu/backend/internal/router"
	"undc-rsu/backend/pkg/database"

	"github.com/gin-gonic/gin"
)

// @title						UNDC RSU API
// @version					1.0
// @description				API de Responsabilidad Social Universitaria — UNDC Cañete (Ley 30220 Art.124-125, SUNEDU Ind.29, SINEACE Est.25).
// @description				Auth real contra tabla RSU_Usuario (bcrypt + JWT). Storage local activo.
// @contact.name				UNDC Cañete — RSU
// @license.name				Uso institucional UNDC
// @host						localhost:8080
// @schemes					http
// @securityDefinitions.apikey	BearerAuth
// @in							header
// @name						Authorization
// @description				JWT: "Bearer <token>" obtenido de POST /api/v1/auth/login (password seed: undc2026)
func main() {
	cfg := config.Load()
	gin.SetMode(cfg.GinMode)

	// ISO 27001 A.10: no se arranca en producción con una configuración
	// criptográfica insegura (JWT_SECRET ausente o demasiado corto).
	if err := middleware.ValidarConfigSegura(); err != nil {
		log.Fatalf("[seguridad] %v", err)
	}

	// ensure upload dir
	_ = os.MkdirAll(cfg.UploadDir, 0755)

	db := database.Connect(config.DSN(cfg))
	r := router.Setup(db)

	addr := ":" + cfg.Port
	log.Printf("🚀 UNDC RSU API escuchando en http://localhost%s  (env: %s)", addr, cfg.GinMode)
	log.Printf("   Health: http://localhost%s/health", addr)
	log.Printf("   API:    http://localhost%s/api/v1", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
