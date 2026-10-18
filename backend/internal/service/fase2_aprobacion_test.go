package service

import (
	"encoding/json"
	"testing"
	"time"
)

// ─────────────────────────────────────────────────────────────────
// HU-F2-02 — Plazo de subsanación (rules §5 CAMINO 2 y 3)
// CA-2.1/CA-2.2: 10 días hábiles para la Dirección de Escuela.
// CA-2.5: los plazos son días hábiles, no corridos.
// ─────────────────────────────────────────────────────────────────

func TestDiasHabiles_NoCuentaFinDeSemana(t *testing.T) {
	casos := []struct {
		nombre   string
		desde    string
		dias     int
		esperado string
	}{
		// Un viernes + 1 día hábil cae el lunes.
		{"viernes a lunes", "2026-10-16", 1, "2026-10-19"},
		// Un lunes + 10 días hábiles salta dos fines de semana.
		{"lunes a 10 hábiles", "2026-10-19", 10, "2026-11-02"},
		// Cero días devuelve el mismo día.
		{"cero días", "2026-10-16", 0, "2026-10-16"},
	}

	for _, c := range casos {
		t.Run(c.nombre, func(t *testing.T) {
			desde, err := time.Parse("2006-01-02", c.desde)
			if err != nil {
				t.Fatalf("fecha de prueba inválida: %v", err)
			}
			got := diasHabiles(desde, c.dias).Format("2006-01-02")
			if got != c.esperado {
				t.Fatalf("desde %s + %d hábiles: se esperaba %s, se obtuvo %s", c.desde, c.dias, c.esperado, got)
			}
		})
	}
}

func TestDiasHabiles_NuncaCaeEnSabadoNiDomingo(t *testing.T) {
	desde, _ := time.Parse("2006-01-02", "2026-10-19")
	for n := 1; n <= 20; n++ {
		fecha := diasHabiles(desde, n)
		if wd := fecha.Weekday(); wd == time.Saturday || wd == time.Sunday {
			t.Fatalf("+%d hábiles cayó en %s (%s)", n, wd, fecha.Format("2006-01-02"))
		}
	}
}

func TestPlazoSegunEstado(t *testing.T) {
	casos := []struct {
		estado   string
		esperado int
	}{
		{"EN_REVISION_ESCUELA", 10},       // CA-2.1
		{"EN_PRIORIZACION_FACULTAD", 5},   // CA-5.3
		{"ENVIADO_ASESOR", 5},             // Fase 1
		{"OBSERVADO_ASESOR", 5},           // Fase 1
		{"OTRO", 10},                      // valor por defecto conservador
	}

	// Sin base de datos el helper usa los valores por defecto.
	for _, c := range casos {
		t.Run(c.estado, func(t *testing.T) {
			if got := plazoSegunEstado(nil, c.estado); got != c.esperado {
				t.Fatalf("%s: se esperaban %d días, se obtuvieron %d", c.estado, c.esperado, got)
			}
		})
	}
}

func TestCamposBloqueadosPara_ExcluyeLosEditables(t *testing.T) {
	p := camposBloqueadosPara("EN_REVISION_ESCUELA")
	if p == nil {
		t.Fatal("se esperaba una lista de campos bloqueados")
	}
	var bloqueados []string
	if err := json.Unmarshal([]byte(*p), &bloqueados); err != nil {
		t.Fatalf("no se pudo interpretar el JSON: %v", err)
	}
	conjunto := map[string]bool{}
	for _, b := range bloqueados {
		conjunto[b] = true
	}
	// La escuela, el ciclo y el asesor no se cambian mientras se subsana.
	for _, campo := range []string{"id_escuela", "id_ciclo_creacion", "id_docente_asesor"} {
		if !conjunto[campo] {
			t.Errorf("%s debería quedar bloqueado", campo)
		}
	}
	// El título sí se puede corregir.
	if conjunto["titulo"] {
		t.Error("el título debería poder corregirse durante la subsanación")
	}
}
