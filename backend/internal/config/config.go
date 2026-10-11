package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DBHost      string
	DBPort      string
	DBUser      string
	DBPass      string
	DBName      string
	JWTSecret   string
	GinMode     string
	UploadDir   string
	MaxUploadMB int
}

func Load() *Config {
	_ = godotenv.Load()
	cfg := &Config{
		Port:        env("PORT", "8080"),
		DBHost:      env("DB_HOST", "postgres"),
		DBPort:      env("DB_PORT", "5432"),
		DBUser:      env("DB_USER", "undc"),
		DBPass:      env("DB_PASS", "undc2026"),
		DBName:      env("DB_NAME", "undc_rsu"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		GinMode:     env("GIN_MODE", "release"),
		UploadDir:   env("UPLOAD_DIR", "./uploads"),
		MaxUploadMB: 20,
	}
	if cfg.JWTSecret == "" {
		if cfg.GinMode == "release" {
			log.Fatalf("[config] JWT_SECRET es obligatorio en producción (GIN_MODE=release)")
		}
		cfg.JWTSecret = "dev-secret-change-me"
		log.Printf("[config] ADVERTENCIA: JWT_SECRET no definido, usando solo-desarrollo")
	}
	if cfg.GinMode == "debug" {
		log.Println("[config] Loaded env debug mode")
	}
	return cfg
}

func env(k, fallback string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return fallback
}

func DSN(c *Config) string {
	return "host=" + c.DBHost + " user=" + c.DBUser + " password=" + c.DBPass + " dbname=" + c.DBName + " port=" + c.DBPort + " sslmode=disable TimeZone=America/Lima"
}
