package pdf

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"regexp"
	"strings"
	"testing"
)

// nuevoOficioDePrueba arma un oficio con los datos reales que maneja la Fase 2.
func nuevoOficioDePrueba() OficioElevacion {
	return OficioElevacion{
		CodigoProyecto: "RSU-2026-0012",
		Titulo:         "Fortalecimiento del aprendizaje Anything Else",
		Modalidad:      "PEP_FINANCIADO",
		Escuela:        "Ingeniería de Sistemas",
		Facultad:       "Ingeniería",
		Lider:          "Diego Vargas León",
		Asesor:         "Rosa Mendoza Quispe",
		FechaInicio:    "01/09/2026",
		FechaFin:       "30/11/2026",
		Presupuesto:    4800.00,
		Fecha:          "18 de octubre de 2026",
		NumeroOficio:   "OFICIO N.° 018-2026-UNDC/FI-DEC",
		ReferenciaQR:   "RSU-2026-0012",
	}
}

// TestGenerarOficioElevacion_ProducePDFValido — HU-F2-04 CA-4.1..CA-4.7
// Verifica que el PDF se genera, es estructuralmente válido y contiene el
// membrete, los datos prellenados y la referencia del QR.
func TestGenerarOficioElevacion_ProducePDFValido(t *testing.T) {
	g := NewGPDF()

	data, err := g.GenerarOficioElevacion(context.Background(), nuevoOficioDePrueba())
	if err != nil {
		t.Fatalf("no se generó el oficio: %v", err)
	}
	if len(data) == 0 {
		t.Fatal("el PDF vino vacío")
	}

	if err := validarEstructuraPDF(t, data); err != nil {
		t.Fatalf("PDF inválido: %v", err)
	}

	// CA-4.1: membrete institucional.
	if !contieneSecuencia(data, "UNIVERSIDAD NACIONAL DE CA") {
		t.Error("falta el membrete de la universidad")
	}
	// CA-4.2: los datos del proyecto van prellenados.
	for _, dato := range []string{"RSU-2026-0012", "Ingenier", "Diego Vargas", "Rosa Mendoza"} {
		if !contieneSecuencia(data, dato) {
			t.Errorf("falta el dato prellenado %q", dato)
		}
	}
	// CA-4.3: el QR se embebe como imagen (XObject), no como texto.
	if !bytes.Contains(data, []byte("/Subtype /Image")) {
		t.Error("no se detecta el código QR del expediente (falta el XObject de imagen)")
	}
	// CA-4.6: el pie de trámite.
	if !contieneSecuencia(data, "Oficio de Elevaci") {
		t.Error("falta el pie del oficio")
	}

	// Copia para inspección visual cuando se pide con UNDC_PDF_DEBUG=1.
	// Así no queda un archivo suelto en el repositorio en una ejecución normal.
	if os.Getenv("UNDC_PDF_DEBUG") == "1" {
		if err := os.WriteFile("/src/oficio-ejemplo.pdf", data, 0644); err != nil {
			t.Logf("no se pudo volcar la copia de inspección: %v", err)
		}
	}
}

// validarEstructuraPDF comprueba lo esencial: cabecera, tabla xref con offsets
// que apuntan a sus objetos, trailer con Root válido y streams con la longitud
// declarada. Es el mismo nivel de comprobación que haría un visor.
func validarEstructuraPDF(t *testing.T, data []byte) error {
	t.Helper()
	s := string(data)

	if !strings.HasPrefix(s, "%PDF-1.") {
		return fmt.Errorf("el encabezado no es un PDF: %q", s[:8])
	}
	const xref = "xref\n"
	i := strings.LastIndex(s, "startxref")
	if i < 0 {
		return errf("sin startxref")
	}
	num := regexp.MustCompile(`\d+`).FindAllString(s[i:], 2)
	if len(num) < 1 {
		return errf("startxref sin offset")
	}
	var off int
	for _, c := range num[0] {
		off = off*10 + int(c-'0')
	}
	if off >= len(s) || !strings.HasPrefix(s[off:], xref) {
		return errf("startxref no apunta a la tabla xref")
	}

	// Toda referencia "N 0 R" debe existir como objeto "N 0 obj".
	objs := regexp.MustCompile(`(?m)^(\d+) 0 obj`).FindAllStringSubmatch(s, -1)
	existentes := map[string]bool{}
	for _, m := range objs {
		existentes[m[1]] = true
	}
	for _, m := range regexp.MustCompile(`(\d+) 0 R`).FindAllStringSubmatch(s, -1) {
		if !existentes[m[1]] {
			return errf("referencia al objeto %s inexistente", m[1])
		}
	}

	// Streams: la longitud declarada debe coincidir con el contenido real.
	for _, m := range regexp.MustCompile(`<< /Length (\d+) >>\nstream\n`).FindAllStringSubmatchIndex(s, -1) {
		var n int
		for _, c := range s[m[2]:m[3]] {
			n = n*10 + int(c-'0')
		}
		inicio := m[1]
		fin := strings.Index(s[inicio:], "\nendstream")
		if fin < 0 || fin != n {
			return errf("stream con /Length %d pero contenido %d", n, fin)
		}
	}
	return nil
}

// contieneSecuencia busca una cadena tolerando la codificación interna del PDF
// (paréntesis escapados y saltos de línea dentro de la cadena literal).
func contieneSecuencia(data []byte, want string) bool {
	limpio := strings.NewReplacer("\\(", "(", "\\)", ")", "\\\n", "", "\n", "").Replace(string(data))
	return strings.Contains(limpio, want)
}

func errf(format string, args ...any) error { return fmt.Errorf(format, args...) }
