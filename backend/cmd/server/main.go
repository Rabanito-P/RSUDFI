package main

import (
	"log"
	"os"

	"undc-rsu/backend/internal/config"
	"undc-rsu/backend/internal/router"
	"undc-rsu/backend/pkg/database"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	gin.SetMode(cfg.GinMode)

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
