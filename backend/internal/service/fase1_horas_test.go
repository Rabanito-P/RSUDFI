package service

import "testing"

// ─────────────────────────────────────────────────────────────────
// HU-F1-02 — Validar composición del equipo y cronograma de 60 h
// CA-2.4 cronograma mínimo de horas efectivas
// CA-2.6 advertencia entre 45 y 60 horas
// CA-2.1 / CA-2.2 equipo entre 2 y 5 estudiantes
// ─────────────────────────────────────────────────────────────────

// Las constantes MinimoHorasSSU y UmbralAdvertenciaHoras viven en el
// código de producción (fase1_validacion.go): las pruebas no inventan
// reglas de negocio.

func TestValidarHorasCronograma_BloqueaDebajoDelMinimo(t *testing.T) {
	casos := []struct {
		nombre string
		horas  float64
		ok     bool
	}{
		{"cero horas", 0, false},
		{"muy por debajo", 12.5, false},
		{"borde 59.9", 59.9, false},
		{"exactamente 60", 60, true},
		{"sobre el mínimo", 72.5, true},
	}

	for _, c := range casos {
		t.Run(c.nombre, func(t *testing.T) {
			err := validarHorasCronograma(c.horas, MinimoHorasSSU)
			if c.ok && err != nil {
				t.Fatalf("se esperaba aceptar %v horas, pero devolvió error: %v", c.horas, err)
			}
			if !c.ok && err == nil {
				t.Fatalf("se esperaba rechazar %v horas, pero fue aceptado", c.horas)
			}
		})
	}
}

// CA-2.6: entre 45 y 60 horas NO bloquea, solo advierte.
func TestValidarHorasCronograma_AdvertenciaEntre45y60(t *testing.T) {
	casos := []struct {
		nombre   string
		horas    float64
		advierte bool
	}{
		{"44 horas sin advertencia", 44, false},
		{"45 horas con advertencia", 45, true},
		{"52.5 horas con advertencia", 52.5, true},
		{"59.9 horas con advertencia", 59.9, true},
		{"60 horas sin advertencia", 60, false},
	}

	for _, c := range casos {
		t.Run(c.nombre, func(t *testing.T) {
			_, advierte := revisarHorasCronograma(c.horas, MinimoHorasSSU)
			if advierte != c.advierte {
				t.Fatalf("con %v horas esperaba advierte=%v, obtuvo %v", c.horas, c.advierte, advierte)
			}
		})
	}
}

// El error de bloqueo debe informar cuántas horas faltan (UX del modal).
func TestValidarHorasCronograma_ErrorInformaFaltantes(t *testing.T) {
	err := validarHorasCronograma(40, 60)
	if err == nil {
		t.Fatal("se esperaba error con 40 horas")
	}
	// El mensaje debe permitir al estudiante saber cuánto le falta.
	for _, frag := range []string{"60", "20"} {
		if !contiene(err.Error(), frag) {
			t.Fatalf("el mensaje %q debe mencionar %q para que el estudiante sepa cuánto falta", err.Error(), frag)
		}
	}
}

func TestValidarTamanioEquipo_Min2Max5(t *testing.T) {
	casos := []struct {
		nombre string
		tamano int
		ok     bool
	}{
		{"cero", 0, false},
		{"uno (solo el líder)", 1, false},
		{"dos (mínimo)", 2, true},
		{"tres", 3, true},
		{"cinco (máximo)", 5, true},
		{"seis (excede)", 6, false},
		{"nueve", 9, false},
	}

	for _, c := range casos {
		t.Run(c.nombre, func(t *testing.T) {
			err := validarTamanioEquipo(c.tamano)
			if c.ok && err != nil {
				t.Fatalf("se esperaba aceptar un equipo de %d, pero devolvió error: %v", c.tamano, err)
			}
			if !c.ok && err == nil {
				t.Fatalf("se esperaba rechazar un equipo de %d, pero fue aceptado", c.tamano)
			}
		})
	}
}

// contiene es un auxiliar de aserción para no depender de strings en el test.
func contiene(haystack, needle string) bool {
	return len(needle) == 0 || (len(haystack) >= len(needle) && indexOf(haystack, needle) >= 0)
}

func indexOf(haystack, needle string) int {
	for i := 0; i+len(needle) <= len(haystack); i++ {
		if haystack[i:i+len(needle)] == needle {
			return i
		}
	}
	return -1
}
