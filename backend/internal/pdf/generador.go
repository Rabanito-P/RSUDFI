// Package pdf encapsula la generación de documentos oficiales.
//
// La Fase 2 necesita generar el Oficio de Elevación que el Decano firma para
// elevar el expediente a la DRSU Central (rules fase de propuesta-aprobacion-
// cierre (3) §3.1-4). El motor se aisló detrás de la interfaz Generador para
// poder cambiarlo sin reescribir la fase: es una librería joven (gpdf v1.0.13,
// sin adoptantes conocidos) y no conviene que el resto del código dependa de
// sus tipos (HU-F2-T3 CA-T3.4).
package pdf

import "context"

// Generador produce documentos oficiales en PDF.
//
// Solo hay una implementación hoy (gpdf), pero la interfaz permite sustituirla
// si en el futuro aparece un problema de la librería.
type Generador interface {
	// GenerarOficioElevacion devuelve el PDF del Oficio de Elevación prellenado
	// con los datos del proyecto, listo para que el Decano lo firme y selle.
	GenerarOficioElevacion(ctx context.Context, datos OficioElevacion) ([]byte, error)
}

// OficioElevacion es la información con la que se prellena el Oficio de
// Elevación. La firma y el sello se aplican en físico, no en el sistema.
type OficioElevacion struct {
	CodigoProyecto string
	Titulo         string
	Modalidad      string
	Escuela        string
	Facultad       string
	Lider          string
	Asesor         string
	FechaInicio    string
	FechaFin       string
	Presupuesto    float64
	Fecha          string
	NumeroOficio   string
	// Referencia QR: lo que se codifica en el código de verificación.
	ReferenciaQR string
}
