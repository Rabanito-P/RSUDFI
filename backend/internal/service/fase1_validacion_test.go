package service

import "testing"

// ─────────────────────────────────────────────────────────────────
// HU-F1-01 — Registrar propuesta inicial de proyecto SSU
// CA-1.3 Problemática obligatoria (mín. 100 caracteres)
// CA-1.4 ODS obligatorio (1..17)
// ─────────────────────────────────────────────────────────────────

func TestValidarProblematica_ObligatoriaYMinimo(t *testing.T) {
	casos := []struct {
		nombre string
		in     string
		ok     bool
	}{
		{"vacia", "", false},
		{"solo espacios", "   \n\t ", false},
		{"corto", "La comunidad no tiene internet en la escuela.", false},
		{"borde 99 caracteres", generarTexto(99), false},
		{"borde 100 caracteres", generarTexto(100), true},
		{"largo", generarTexto(350), true},
	}

	for _, c := range casos {
		t.Run(c.nombre, func(t *testing.T) {
			err := validarProblematica(c.in)
			if c.ok && err != nil {
				t.Fatalf("se esperaba aceptar %q, pero devolvió error: %v", c.nombre, err)
			}
			if !c.ok && err == nil {
				t.Fatalf("se esperaba rechazar %q, pero fue aceptado", c.nombre)
			}
		})
	}
}

// CA-1.4: el ODS debe ser un número entero entre 1 y 17.
func TestValidarODS_Rango1a17(t *testing.T) {
	casos := []struct {
		nombre string
		in     string
		ok     bool
	}{
		{"vacio", "", false},
		{"no numerico", "salud", false},
		{"cero", "0", false},
		{"uno", "1", true},
		{"diecisiete", "17", true},
		{"dieciocho fuera de rango", "18", false},
		{"negativo", "-3", false},
		{"con espacios alrededor", " 4 ", true},
	}

	for _, c := range casos {
		t.Run(c.nombre, func(t *testing.T) {
			err := validarODS(c.in)
			if c.ok && err != nil {
				t.Fatalf("se esperaba aceptar %q, pero devolvió error: %v", c.nombre, err)
			}
			if !c.ok && err == nil {
				t.Fatalf("se esperaba rechazar %q, pero fue aceptado", c.nombre)
			}
		})
	}
}

// generarTexto arma una cadena de n caracteres no vacíos para los bordes.
func generarTexto(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = 'x'
	}
	return string(b)
}