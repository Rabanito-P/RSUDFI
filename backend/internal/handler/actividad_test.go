package handler

import "testing"

// Especificación HU-011: transiciones válidas del estado de una actividad de campo.
// PROGRAMADA → EN_EJECUCION → EJECUTADA | SUSPENDIDA; SUSPENDIDA → EN_EJECUCION;
// EJECUTADA terminal. El mismo estado no requiere transición (idempotente).
func TestPuedeTransicionarActividad(t *testing.T) {
	casos := []struct{ de, a string; ok bool }{
		{"PROGRAMADA", "EN_EJECUCION", true},
		{"PROGRAMADA", "EJECUTADA", false},
		{"PROGRAMADA", "SUSPENDIDA", false},
		{"EN_EJECUCION", "EJECUTADA", true},
		{"EN_EJECUCION", "SUSPENDIDA", true},
		{"EN_EJECUCION", "PROGRAMADA", false},
		{"SUSPENDIDA", "EN_EJECUCION", true},
		{"SUSPENDIDA", "EJECUTADA", false},
		{"SUSPENDIDA", "PROGRAMADA", false},
		// Estado final: sin salida excepto el PATCH idempotente.
		{"EJECUTADA", "EN_EJECUCION", false},
		{"EJECUTADA", "EJECUTADA", true},
		// Estados desconocidos nunca transicionan a otra cosa.
		{"INEXISTENTE", "EJECUTADA", false},
		{"PROGRAMADA", "INEXISTENTE", false},
	}
	for _, c := range casos {
		if got := puedeTransicionarActividad(c.de, c.a); got != c.ok {
			t.Errorf("actividad %s→%s: esperado %v, obtenido %v", c.de, c.a, c.ok, got)
		}
	}
}

// Especificación HU-014 (R26): los estados aceptados en el PATCH de justificación
// se normalizan (espacios y mayúsculas) y los inválidos se descartan.
func TestNormEstadoJustificacion(t *testing.T) {
	validos := map[string]string{
		"PENDIENTE":  "PENDIENTE",
		"revisado":   "REVISADO",
		"  APROBADO ": "APROBADO",
		"RECHAZADO":  "RECHAZADO",
		"observado":  "OBSERVADO",
	}
	for entrada, esperado := range validos {
		if got := normEstadoJust(entrada); got != esperado {
			t.Errorf("normEstadoJust(%q): esperado %q, obtenido %q", entrada, esperado, got)
		}
	}
	if got := normEstadoJust("APROBADA"); got != "" {
		t.Errorf("normEstadoJust(APROBADA): no debe aceptarse feminino, obtuvo %q", got)
	}
	if got := normEstadoJust("CAFE"); got != "" {
		t.Errorf("normEstadoJust(CAFE): debe descartarse, obtuvo %q", got)
	}
	if got := normEstadoJust(""); got != "" {
		t.Errorf("normEstadoJust(vacío): debe descartarse, obtuvo %q", got)
	}
}

func TestNormEstadoModificacion(t *testing.T) {
	casos := map[string]string{
		"pendiente": "PENDIENTE",
		"APROBADO":  "APROBADO",
		"OBSERVADO": "OBSERVADO",
		"RECHAZADO": "RECHAZADO",
	}
	for entrada, esperado := range casos {
		if got := normEstadoMod(entrada); got != esperado {
			t.Errorf("normEstadoMod(%q): esperado %q, obtenido %q", entrada, esperado, got)
		}
	}
	if got := normEstadoMod("REVISADO"); got != "REVISADO" {
		t.Errorf("normEstadoMod(REVISADO): esperado REVISADO, obtenido %q", got)
	}
	if got := normEstadoMod("EXPULSADO"); got != "" {
		t.Errorf("normEstadoMod(EXPULSADO): no es estado de modificación, obtuvo %q", got)
	}
}
