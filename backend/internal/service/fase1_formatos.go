package service

import (
	"fmt"
	"strings"
)

// ─────────────────────────────────────────────────────────────────
// Fase 1 · Creación — catálogo de formatos oficiales DRSU (HU-F1-08)
// ─────────────────────────────────────────────────────────────────
//
// Los formatos F-M03.01-RSU-xxx y F-M03-RSU-xxx son modelos oficiales de
// la DRSU Central (info/objetivo.txt §2.1, fuente "DRSU"). El Mini-RSU
// los CONSUME como plantillas descargables: no los genera ni los firma.
//
// CA-8.1: es un catálogo INDEPENDIENTE. Los 7 formatos operativos
// (PROPUESTA, PLANIFICACION, PRIMER/SEGUNDO/TERCER_ENTREGABLE, ENCUESTA,
// INFORME_FINAL) no se renombran, no se eliminan y no se duplican.
//
// CA-8.5: solo lectura. No hay generación ni firma digital.

// FormatoDRSU describe un formato oficial de la DRSU disponible como
// plantilla descargable dentro del Mini-RSU.
type FormatoDRSU struct {
	Codigo           string `json:"codigo"`
	Nombre           string `json:"nombre"`
	Modalidad        string `json:"modalidad"`
	CodigoEquivalente string `json:"codigo_equivalente"`
}

// NewFormatoDRSU construye una entrada del catálogo DRSU.
// `equivalente` es el código del formato operativo actual que cubre el
// mismo documento; vacío cuando el formato no tiene contraparte en el
// catálogo de 7 (plantilla nueva).
func NewFormatoDRSU(codigo, nombre, modalidad, equivalente string) FormatoDRSU {
	return FormatoDRSU{
		Codigo:            strings.TrimSpace(codigo),
		Nombre:            nombre,
		Modalidad:         modalidad,
		CodigoEquivalente: strings.TrimSpace(equivalente),
	}
}

// EsPlantillaNueva indica si el formato no tiene equivalente en el
// catálogo operativo y debe ofrecerse como plantilla propia (CA-8.4).
func (f FormatoDRSU) EsPlantillaNueva() bool { return f.CodigoEquivalente == "" }

// Equivalente devuelve el código del formato operativo que cubre el
// mismo documento, o cadena vacía si no tiene contraparte.
func (f FormatoDRSU) Equivalente() string { return f.CodigoEquivalente }

// EsDescargable siempre es cierto: el catálogo DRSU es de solo lectura
// y su único propósito es la descarga de la plantilla (CA-8.5).
func (f FormatoDRSU) EsDescargable() bool { return f.Codigo != "" }

// CatalogoDRSUFase1 devuelve los formatos DRSU correspondientes a la
// Fase 1 (Creación): documentos de SSU y de PEP.
//
// Las constancias y el informe del docente asesor quedan para las Fases
// 3 y 4, cuando exista el flujo de cierre y certificación.
func CatalogoDRSUFase1() []FormatoDRSU {
	return []FormatoDRSU{
		// ── SSU ──
		NewFormatoDRSU("F-M03.01-RSU-001", "Informe Inicial de SSU", "SSU", "PROPUESTA"),
		NewFormatoDRSU("F-M03.01-RSU-005", "Ficha de Calificación de Pertinencia Técnica", "SSU", ""),
		NewFormatoDRSU("F-M03.01-RSU-016", "Compromiso de Asesoría SSU", "SSU", ""),
		// ── PEP ──
		NewFormatoDRSU("F-M03-RSU-001", "Informe Inicial PEP", "PEP", "PROPUESTA"),
		NewFormatoDRSU("F-M03-RSU-002", "Informe de Avance PEP", "PEP", "PRIMER_ENTREGABLE"),
		NewFormatoDRSU("F-M03-RSU-003", "Informe Final PEP", "PEP", "INFORME_FINAL"),
	}
}

// BuscarFormatoDRSU localiza un formato del catálogo de Fase 1 por código.
func BuscarFormatoDRSU(codigo string) (FormatoDRSU, error) {
	c := strings.TrimSpace(codigo)
	for _, f := range CatalogoDRSUFase1() {
		if f.Codigo == c {
			return f, nil
		}
	}
	return FormatoDRSU{}, fmt.Errorf("el formato %q no pertenece al catálogo DRSU de la Fase 1", c)
}

// ─────────────────────────────────────────────────────────────────
// Sobre el catálogo actual de formatos (CA-8.1)
// ─────────────────────────────────────────────────────────────────

// codigosFormatoActual son los 7 formatos operativos del Mini-RSU.
// Sirven de salvaguarda: el catálogo DRSU nunca debe pisar estos códigos.
var codigosFormatoActual = map[string]bool{
	"PROPUESTA":          true,
	"PLANIFICACION":      true,
	"PRIMER_ENTREGABLE":  true,
	"SEGUNDO_ENTREGABLE": true,
	"TERCER_ENTREGABLE":  true,
	"ENCUESTA":           true,
	"INFORME_FINAL":      true,
}

// EsCodigoFormatoActual informa si un código pertenece al catálogo
// operativo de 7 formatos (CA-8.1).
func EsCodigoFormatoActual(codigo string) bool {
	return codigosFormatoActual[strings.ToUpper(strings.TrimSpace(codigo))]
}

// ValidarCatalogoDRSU comprueba que ninguna entrada del catálogo DRSU
// colisione con los formatos operativos vigentes.
func ValidarCatalogoDRSU() error {
	for _, f := range CatalogoDRSUFase1() {
		if EsCodigoFormatoActual(f.Codigo) {
			return fmt.Errorf("el formato DRSU %s colisiona con un formato operativo del sistema", f.Codigo)
		}
	}
	return nil
}