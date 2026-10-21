package service

import "testing"

// HU-070: además de HU-060 (cambio de líder), la Dirección RS de Facultad
// expulsa a un integrante con causal registrada. El equipo SSU/VOLUNTARIADO
// nunca queda por debajo de 2 integrantes activos (R09/R10).
func TestPuedeQuedarEquipoTrasExpulsion(t *testing.T) {
	// SSU y VOLUNTARIADO exigen el mínimo de 2.
	if err := PuedeQuedarEquipo("SSU", 1); err == nil {
		t.Error("SSU con 1 integrante restante: debió rechazar (equipo mínimo 2, R09)")
	}
	if err := PuedeQuedarEquipo("VOLUNTARIADO", 0); err == nil {
		t.Error("VOLUNTARIADO sin integrantes restantes: debió rechazar")
	}
	// Encima del mínimo: válido.
	for _, modalidad := range []string{"SSU", "VOLUNTARIADO"} {
		if err := PuedeQuedarEquipo(modalidad, 2); err != nil {
			t.Errorf("%s con 2 restantes: debió permitir (%v)", modalidad, err)
		}
	}
	// PEP y otros no exigen el mínimo de estudiantes.
	for _, modalidad := range []string{"PEP_FINANCIADO", "PEP_AUTOFINANCIADO", "PUBLICACION_CIENTIFICA"} {
		for _, quedan := range []int{0, 1} {
			if err := PuedeQuedarEquipo(modalidad, quedan); err != nil {
				t.Errorf("%s con %d restantes: debió permitir (%v)", modalidad, quedan, err)
			}
		}
	}
	if err := PuedeQuedarEquipo("", 0); err == nil {
		t.Error("modalidad vacía (dato sucio): debió rechazar por prudencia")
	}
}

// HU-070: la causal es un enum cerrado; el motivo la explica.
func TestCausalExpulsionValida(t *testing.T) {
	for _, causal := range []string{"FALTAS", "TARDANZAS", "CONDUCTA", "OTRO"} {
		if !CausalExpulsionValida(causal) {
			t.Errorf("causal %q debe ser válida", causal)
		}
	}
	for _, causal := range []string{"", "faltas", "FALTO", "ENFERMEDAD", "FALTAS "} {
		if CausalExpulsionValida(causal) {
			t.Errorf("causal %q debe rechazarse", causal)
		}
	}
}
