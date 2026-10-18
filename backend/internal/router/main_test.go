package router

import (
	"os"
	"testing"
)

// TestMain fija el entorno antes de que corran las pruebas del paquete.
//
// config.Load() aborta el proceso con log.Fatalf cuando GIN_MODE=release y
// no hay JWT_SECRET. Ese control es correcto en producción y no debe
// relajarse: lo que se ajusta es el entorno de la prueba. Godotenv no
// pisa variables ya presentes, así que este entorno gana sobre backend/.env.
func TestMain(m *testing.M) {
	os.Setenv("JWT_SECRET", "secreto-de-prueba-minimo-32-caracteres-xxxx")
	os.Setenv("GIN_MODE", "test")
	os.Exit(m.Run())
}
