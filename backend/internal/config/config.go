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
		JWTSecret:   env("JWT_SECRET", "undc-rsu-super-secret-2026"),
		GinMode:     env("GIN_MODE", "release"),
		UploadDir:   env("UPLOAD_DIR", "./uploads"),
		MaxUploadMB: 20,
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

// DSN PostgreSQL 18 (GORM postgres)
func DSN(c *Config) string {
	// host=postgres user=undc password=undc2026 dbname=undc_rsu port=5432 sslmode=disable TimeZone=America/Lima
	return "host=" + c.DBHost + " user=" + c.DBUser + " password=" + c.DBPass + " dbname=" + c.DBName + " port=" + c.DBPort + " sslmode=disable TimeZone=America/Lima"
}

// DSNMySQL kept for local dev without docker (fallback)
func DSNMySQL(c *Config) string {
	return c.DBUser + ":" + c.DBPass + "@tcp(" + c.DBHost + ":" + c.DBPort + ")/" + c.DBName + "?charset=utf8mb4&parseTime=True&loc=Local"
}
