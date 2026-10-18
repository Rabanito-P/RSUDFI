package pdf

import (
	"context"
	"fmt"

	"github.com/gpdf-dev/gpdf/document"
	"github.com/gpdf-dev/gpdf/pdf"
	"github.com/gpdf-dev/gpdf/qrcode"
	"github.com/gpdf-dev/gpdf/template"
)

// GPDF es la implementación del generador sobre la librería gpdf.
//
// Se eligió gpdf (MIT, Go puro, cero dependencias) en lugar de la línea fpdf,
// que quedó archivada en 2025 y no recibe parches de seguridad. Ver la reserva
// honesta en HU-F2-T3: al ser una librería joven, este archivo es el ÚNICO
// punto del sistema que conoce la librería.
type GPDF struct{}

// NewGPDF construye el generador basado en gpdf.
func NewGPDF() *GPDF { return &GPDF{} }

// GenerarOficioElevacion — HU-F2-04
//
// Membrete institucional, datos del proyecto prellenados, numeración de
// páginas, pie de trámite y código QR con la referencia del expediente.
// Los acentos y la Ñ se renderizan con la fuente Helvetica integrada.
func (g *GPDF) GenerarOficioElevacion(ctx context.Context, d OficioElevacion) ([]byte, error) {
	doc := template.New(
		template.WithPageSize(document.A4),
		template.WithMargins(document.UniformEdges(document.Mm(18))),
		template.WithMetadata(document.DocumentMetadata{
			Title:   "Oficio de Elevación - " + d.NumeroOficio,
			Author:  "Universidad Nacional de Cañete",
			Subject: "Elevación de expediente RSU a la DRSU Central",
		}),
		template.WithWriterSetup(func(pw *pdf.Writer) {
			pw.SetObjectHook(corregirEncodingFuentes)
		}),
	)

	// ── Pie de página: numeración y leyenda del trámite ────────────────────
	doc.Footer(func(p *template.PageBuilder) {
		p.AutoRow(func(r *template.RowBuilder) {
			r.Col(8, func(c *template.ColBuilder) {
				c.Text("Oficio de Elevación · UNDC RSU · Facultad de Ingeniería",
					template.FontSize(7),
					template.TextColor(pdf.Gray(0.45)),
				)
			})
			r.Col(4, func(c *template.ColBuilder) {
				c.PageNumber(template.FontSize(7), template.AlignRight(),
					template.TextColor(pdf.Gray(0.45)))
				c.TotalPages(template.FontSize(7), template.AlignRight(),
					template.TextColor(pdf.Gray(0.45)))
			})
		})
	})

	page := doc.AddPage()

	// ── Membrete institucional ─────────────────────────────────────────────
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Text("UNIVERSIDAD NACIONAL DE CAÑETE",
				template.FontSize(13), template.Bold(), template.AlignCenter())
		})
	})
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Text("FACULTAD DE INGENIERÍA",
				template.FontSize(10), template.Bold(), template.AlignCenter())
		})
	})
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Text("Decanato · Oficina de Responsabilidad Social Universitaria",
				template.FontSize(8), template.AlignCenter(),
				template.TextColor(pdf.Gray(0.35)))
		})
	})
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Line(template.LineThickness(document.Pt(0.8)),
				template.LineColor(pdf.Gray(0.7)))
		})
	})

	// ── Encabezado del oficio ──────────────────────────────────────────────
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(6, func(c *template.ColBuilder) {
			c.Text(d.NumeroOficio, template.FontSize(11), template.Bold())
		})
		r.Col(6, func(c *template.ColBuilder) {
			c.Text(d.Fecha, template.FontSize(10), template.AlignRight())
		})
	})
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Text("ASUNTO:", template.FontSize(10), template.Bold())
			c.Text("  Elevación de expediente de proyecto de Responsabilidad Social Universitaria a la Dirección de Responsabilidad Social Universitaria (DRSU) Central.",
				template.FontSize(10))
		})
	})
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Text("SEÑOR(A) DIRECTOR(A) DE RESPONSABILIDAD SOCIAL UNIVERSITARIA",
				template.FontSize(10), template.Bold())
		})
	})

	// ── Cuerpo: el expediente se eleva con sus datos ───────────────────────
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Text("Por medio del presente, me dirijo a usted para elevar el expediente del proyecto de Responsabilidad Social Universitaria que a continuación se detalla, a fin de que se proceda a su evaluación y aprobación conforme a la normativa vigente.",
				template.FontSize(10))
		})
	})

	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Text("Datos del expediente", template.FontSize(10), template.Bold())
			c.Line(template.LineThickness(document.Pt(0.6)), template.LineColor(pdf.Gray(0.7)))
		})
	})

	// Se dibuja campo por campo en dos columnas en lugar de una tabla con
	// ColumnWidths: esa combinación con texto largo produce un bucle infinito
	// en el motor de layout de gpdf v1.0.13 (ver nota en el README del
	// paquete). La disposición por columnas da el mismo resultado y no cuelga.
	filaDetalle(page, "Código del proyecto", d.CodigoProyecto)
	filaDetalle(page, "Título del proyecto", d.Titulo)
	filaDetalle(page, "Modalidad", d.Modalidad)
	filaDetalle(page, "Escuela Profesional", d.Escuela)
	filaDetalle(page, "Facultad", d.Facultad)
	filaDetalle(page, "Estudiante líder", d.Lider)
	filaDetalle(page, "Docente asesor", d.Asesor)
	filaDetalle(page, "Período de ejecución", d.FechaInicio+" al "+d.FechaFin)
	filaDetalle(page, "Presupuesto aprobado (S/)", fmt.Sprintf("%.2f", d.Presupuesto))

	// ── Motivo de la elevación ─────────────────────────────────────────────
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Text("El expediente fue validado por el Comité de Responsabilidad Social Universitaria de la Facultad y aprobado por el Decano, por lo que se eleva a la DRSU Central para los fines correspondientes.",
				template.FontSize(10))
		})
	})
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Text("Es propicia la ocasión para expresarle las consideraciones de mi especial estima.",
				template.FontSize(10))
		})
	})

	// ── Firma ──────────────────────────────────────────────────────────────
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Spacer(document.Pt(34))
			c.Line(template.LineThickness(document.Pt(0.6)), template.LineColor(pdf.Gray(0.6)))
			c.Text("DECANO DE LA FACULTAD DE INGENIERÍA",
				template.FontSize(10), template.Bold(), template.AlignCenter())
			c.Text("Universidad Nacional de Cañete",
				template.FontSize(8), template.AlignCenter(),
				template.TextColor(pdf.Gray(0.4)))
		})
	})

	// ── QR de verificación ─────────────────────────────────────────────────
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Spacer(document.Pt(16))
			c.Text("Verificación del expediente", template.FontSize(9), template.Bold())
			c.QRCode(d.ReferenciaQR,
				template.QRSize(document.Mm(26)),
				template.QRErrorCorrection(qrcode.LevelM),
			)
			c.Text("Referencia: "+d.ReferenciaQR,
				template.FontSize(7), template.TextColor(pdf.Gray(0.45)))
		})
	})

	return doc.Generate()
}

// filaDetalle dibuja una fila "campo — valor" con una línea separadora fina.
func filaDetalle(page *template.PageBuilder, etiqueta, valor string) {
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(4, func(c *template.ColBuilder) {
			c.Text(etiqueta, template.FontSize(9), template.Bold(),
				template.TextColor(pdf.Gray(0.3)))
		})
		r.Col(8, func(c *template.ColBuilder) {
			c.Text(valor, template.FontSize(9))
		})
	})
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Line(template.LineThickness(document.Pt(0.4)),
				template.LineColor(pdf.Gray(0.85)))
		})
	})
}

// corregirEncodingFuentes añade /Encoding /WinAnsiEncoding a las fuentes
// estándar de 14 que gpdf emite sin esa entrada.
//
// gpdf escribe los bytes WinAnsi correctos (0xD1 para Ñ, 0xE1 para á…), pero
// el diccionario de la fuente se queda en
//
//	<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
//
// Sin /Encoding, el visor asume StandardEncoding, donde esos bytes no son las
// tildes ni la Ñ: el documento oficial salía con "CA ETE" en lugar de "CAÑETE".
// Se corrige en el hook de escritura, antes de que el objeto llegue al PDF,
// así no hay que post-procesar bytes ni traer una fuente TTF.
func corregirEncodingFuentes(_ pdf.ObjectRef, obj pdf.Object) pdf.Object {
	dict, ok := obj.(pdf.Dict)
	if !ok {
		return obj
	}
	if dict[pdf.Name("Subtype")] != pdf.Name("Type1") {
		return obj
	}
	if _, yaTiene := dict[pdf.Name("Encoding")]; yaTiene {
		return obj
	}
	corregido := make(pdf.Dict, len(dict)+1)
	for k, v := range dict {
		corregido[k] = v
	}
	corregido[pdf.Name("Encoding")] = pdf.Name("WinAnsiEncoding")
	return corregido
}
