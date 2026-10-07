package database

import (
	"fmt"
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(dsn string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("DB connect failed: %v | DSN: %s", err, maskDSN(dsn))
	}
	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	// TZ Lima (Postgres)
	db.Exec("SET timezone = 'America/Lima'")
	fmt.Println("✓ PostgreSQL 18 conectado: undc_rsu")
	return db
}

func maskDSN(dsn string) string { return dsn }
