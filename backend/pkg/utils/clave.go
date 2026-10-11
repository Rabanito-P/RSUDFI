package utils

import "os"

// ClaveRegistroInicial es la contraseña provisional que se asigna a las cuentas
// creadas desde el registro público (pantalla de login). En producción debe
// definirse con REGISTRO_CLAVE_INICIAL; sin ella se usa un valor conocido solo
// para entornos de demostración.
func ClaveRegistroInicial() string {
	if v := os.Getenv("REGISTRO_CLAVE_INICIAL"); v != "" {
		return v
	}
	return "undc2026"
}
