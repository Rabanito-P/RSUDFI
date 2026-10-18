package service

import "testing"

// ─────────────────────────────────────────────────────────────────
// HU-F1-08 — Catálogo de formatos oficiales DRSU descargables
// CA-8.1 catálogo independiente: NO altera el catálogo actual de 7
// CA-8.3 equivalencia con los formatos existentes
// CA-8.5 el sistema no genera ni firma: es solo lectura
// ─────────────────────────────────────────────────────────────────

// CA-8.5: el catálogo DRSU es de solo lectura; nunca emite documento.
func TestFormatoDRSUNoSeGenera(t *testing.T) {
	f := NewFormatoDRSU("F-M03.01-RSU-001", "Informe Inicial de SSU", "SSU", "PROPUESTA")

	if f.EsPlantillaNueva() {
		t.Fatal("F-001 tiene equivalente en el catálogo actual: no debe marcarse como plantilla nueva")
	}
	if f.Equivalente() != "PROPUESTA" {
		t.Fatalf("se esperaba el equivalente PROPUESTA, se obtuvo %q", f.Equivalente())
	}
	if !f.EsDescargable() {
		t.Fatal("todo formato del catálogo DRSU debe ser descargable")
	}
}

// CA-8.4: los formatos sin equivalente se ofrecen como plantillas nuevas.
func TestFormatoDRSUNuevo(t *testing.T) {
	f := NewFormatoDRSU("F-M03.01-RSU-016", "Compromiso de Asesoría SSU", "SSU", "")

	if !f.EsPlantillaNueva() {
		t.Fatal("F-016 no tiene equivalente: debe ser plantilla nueva")
	}
	if f.Equivalente() != "" {
		t.Fatalf("no debe tener equivalente, se obtuvo %q", f.Equivalente())
	}
}

// CA-8.3: los formatos PEP se homologan con los entregables actuales.
func TestCatalogoDRSUHomologaPEP(t *testing.T) {
	cat := CatalogoDRSUFase1()
	equiv := map[string]string{}
	for _, f := range cat {
		equiv[f.Codigo] = f.Equivalente()
	}

	esperado := map[string]string{
		"F-M03.01-RSU-001": "PROPUESTA",
		"F-M03.01-RSU-005": "",
		"F-M03.01-RSU-016": "",
		"F-M03-RSU-001":    "PROPUESTA",
		"F-M03-RSU-002":    "PRIMER_ENTREGABLE",
		"F-M03-RSU-003":    "INFORME_FINAL",
	}

	for cod, exp := range esperado {
		got, existe := equiv[cod]
		if !existe {
			t.Fatalf("falta el formato %s en el catálogo de Fase 1", cod)
		}
		if got != exp {
			t.Fatalf("formato %s: esperaba equivalente %q, obtuvo %q", cod, exp, got)
		}
	}
}

// CA-8.1: el catálogo DRSU no pisa el catálogo operativo de 7 formatos.
func TestCatalogoDRSUNoAfectaLos7Actuales(t *testing.T) {
	formatosActuales := []string{
		"PROPUESTA", "PLANIFICACION", "PRIMER_ENTREGABLE", "SEGUNDO_ENTREGABLE",
		"TERCER_ENTREGABLE", "ENCUESTA", "INFORME_FINAL",
	}

	for _, f := range CatalogoDRSUFase1() {
		for _, actual := range formatosActuales {
			if f.Codigo == actual {
				t.Fatalf("el formato DRSU %s pisa un formato operativo del sistema", f.Codigo)
			}
		}
		if f.Codigo == "" {
			t.Fatal("todo formato DRSU debe tener código")
		}
	}
}

// Los formatos de Fase 1 son solo los de SSU y PEP; los de constancias
// quedan para las Fases 3 y 4.
func TestCatalogoDRSUCubreSoloFase1(t *testing.T) {
	for _, f := range CatalogoDRSUFase1() {
		if f.Modalidad != "SSU" && f.Modalidad != "PEP" {
			t.Fatalf("el formato %s declara modalidad %q, fuera del alcance de Fase 1", f.Codigo, f.Modalidad)
		}
	}
}

// ─────────────────────────────────────────────────────────────────
// Transiciones de Fase 1 (HU-F1-03, 04, 06, 07)
// ─────────────────────────────────────────────────────────────────

// La cadena de estados de Fase 1 debe ser la documentada.
func TestCadenaEstadosFase1(t *testing.T) {
	esperado := []string{
		"BORRADOR", "ENVIADO_ASESOR", "OBSERVADO_ASESOR",
		"ACEPTADO_ASESOR", "ARCHIVADO_VENCIMIENTO",
	}

	for _, cod := range esperado {
		if !EstadoFase1Valido(cod) {
			t.Fatalf("el estado %s debe formar parte de la Fase 1", cod)
		}
	}
	if EstadoFase1Valido("EN_REVISION_ESCUELA") {
		t.Fatal("EN_REVISION_ESCUELA es Fase 2, no debe registrarse como estado de Fase 1")
	}
}
