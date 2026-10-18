package service

import "testing"

// ─────────────────────────────────────────────────────────────────
// HU-F1-03 / HU-F1-04 — Cupo de asesorías del docente
// Regla R43 corregida: el máximo se evalúa POR CICLO, no globalmente.
// Base: rules (3) §3.1 punto 2 e info/objetivo.txt R06 ("máx. 2 SSU por semestre").
// ─────────────────────────────────────────────────────────────────

func TestValidarCupoAsesor_PermiteHastaElMaximo(t *testing.T) {
	casos := []struct {
		nombre      string
		asesorados  int
		maximo      int
		ok          bool
	}{
		{"sin proyectos, acepta", 0, 2, true},
		{"1 de 2, acepta", 1, 2, true},
		{"2 de 2, rechaza por tope alcanzado", 2, 2, false},
		{"3 de 2, rechaza", 3, 2, false},
		{"topo 0, siempre rechaza", 0, 0, false},
	}

	for _, c := range casos {
		t.Run(c.nombre, func(t *testing.T) {
			err := validarCupoAsesor(c.asesorados, c.maximo)
			if c.ok && err != nil {
				t.Fatalf("se esperaba aceptar con %d asesorados (máx %d), pero: %v", c.asesorados, c.maximo, err)
			}
			if !c.ok && err == nil {
				t.Fatalf("se esperaba rechazar con %d asesorados (máx %d), pero fue aceptado", c.asesorados, c.maximo)
			}
		})
	}
}

// El error debe nombrar el tope para que el docente/entienda el límite.
func TestValidarCupoAsesor_ErrorMencionaElTope(t *testing.T) {
	err := validarCupoAsesor(2, 2)
	if err == nil {
		t.Fatal("se esperaba error al alcanzar el tope")
	}
	if !contiene(err.Error(), "2") {
		t.Fatalf("el mensaje %q debe indicar el máximo permitido", err.Error())
	}
}

// ─────────────────────────────────────────────────────────────────
// HU-F1-07 — CAMINO 3: bloqueo de reactivación por cupo
// El proyecto archivado no se reabre hasta que el docente tenga cupo libre.
// ─────────────────────────────────────────────────────────────────

func TestValidarReactivacion_ArchivadoExigeCupoLibre(t *testing.T) {
	casos := []struct {
		nombre     string
		cupoLibre  bool
		ok         bool
	}{
		{"docente con cupo libre, permite reactivar", true, true},
		{"docente en su tope, bloquea la reactivación", false, false},
	}

	for _, c := range casos {
		t.Run(c.nombre, func(t *testing.T) {
			err := validarReactivacionArchivado(c.cupoLibre)
			if c.ok && err != nil {
				t.Fatalf("se esperaba permitir la reactivación, pero: %v", err)
			}
			if !c.ok && err == nil {
				t.Fatal("se esperaba bloquear la reactivación por falta de cupo")
			}
		})
	}
}

// Un proyecto archivado libera el cupo del docente: por eso el conteo de
// asesorías debe ignorar los estados archivados.
func TestContarAsesoradosParaCupo_IgnoraArchivados(t *testing.T) {
	estados := []string{"ENVIADO_ASESOR", "ARCHIVADO_VENCIMIENTO", "ACEPTADO_ASESOR", "ARCHIVADO_VENCIMIENTO"}

	conArchivados := contarAsesoradosParaCupo(estados)
	sinArchivados := contarAsesoradosParaCupo([]string{"ENVIADO_ASESOR", "ACEPTADO_ASESOR"})

	if conArchivados != sinArchivados {
		t.Fatalf("los proyectos archivados no deben ocupar cupo: con=%d sin=%d", conArchivados, sinArchivados)
	}
	if sinArchivados != 2 {
		t.Fatalf("se esperaban 2 asesorados efectivos, se obtuvieron %d", sinArchivados)
	}
}

// Un proyecto archivado sí cuenta si el ciclo es distinto: el tope es por ciclo.
func TestContarAsesoradosParaCupo_RespetaElCiclo(t *testing.T) {
	tipos := []string{
		proyectoAsesorado("SSU", "2026-I"),
		proyectoAsesorado("SSU", "2026-I"),
		proyectoAsesorado("SSU", "2026-II"),
	}

	enPrimero := contarAsesoradosEnCiclo(tipos, "2026-I")
	enSegundo := contarAsesoradosEnCiclo(tipos, "2026-II")

	if enPrimero != 2 {
		t.Fatalf("se esperaban 2 asesorados en 2026-I, se obtuvieron %d", enPrimero)
	}
	if enSegundo != 1 {
		t.Fatalf("se esperaba 1 asesorado en 2026-II, se obtuvo %d", enSegundo)
	}
}

// Los PEP no consumen el cupo de asesorías de SSU.
func TestContarAsesoradosParaCupo_NoCuentaPEP(t *testing.T) {
	tipos := []string{
		proyectoAsesorado("PEP_FINANCIADO", "2026-I"),
		proyectoAsesorado("PEP_AUTOFINANCIADO", "2026-I"),
		proyectoAsesorado("SSU", "2026-I"),
	}

	if n := contarAsesoradosEnCiclo(tipos, "2026-I"); n != 1 {
		t.Fatalf("solo el SSU debe consumir cupo de asesoría, se contaron %d", n)
	}
}

// ─────────────────────────────────────────────────────────────────
// HU-F1-04 / HU-F1-06 — Congelamiento por estado
// ─────────────────────────────────────────────────────────────────

// CA-6.1 al rechazar la asesoría se congela el contenido técnico; solo
// queda habilitado el selector de nuevo asesor.
func TestCamposEditablesPorEstado(t *testing.T) {
	casos := []struct {
		estado    string
		editable  bool
	}{
		{"BORRADOR", true},
		{"OBSERVADO_ASESOR", false}, // congelado: solo puede cambiar de asesor
		{"ENVIADO_ASESOR", false},  // esperando aceptación del asesor
		{"ACEPTADO_ASESOR", false},
		{"ARCHIVADO_VENCIMIENTO", false},
	}

	for _, c := range casos {
		t.Run(c.estado, func(t *testing.T) {
			if got := contenidoTecnicoEditable(c.estado); got != c.editable {
				t.Fatalf("estado %s: esperaba editable=%v, obtuvo %v", c.estado, c.editable, got)
			}
		})
	}
}

// CA-6.2 el selector de asesor siempre disponible en OBSERVADO_ASESOR.
func TestSelectorAsesorHabilitado(t *testing.T) {
	if !selectorAsesorHabilitado("OBSERVADO_ASESOR") {
		t.Fatal("tras el rechazo debe poder elegirse un nuevo asesor (reintentos ilimitados)")
	}
	if selectorAsesorHabilitado("ENVIADO_ASESOR") {
		t.Fatal("mientras espera al asesor no debe poder cambiarse")
	}
}

// proyectoAsesorado arma una entrada de conteo para las pruebas de cupo.
func proyectoAsesorado(modalidad, ciclo string) string {
	return modalidad + "|" + ciclo + "|ENVIADO_ASESOR"
}