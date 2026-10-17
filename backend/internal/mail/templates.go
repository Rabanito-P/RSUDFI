package mail

import (
	"fmt"
	"html"
	"strings"
)

// ── Plantillas HTML (email-safe: tablas + estilos inline) ───────
// Compatibles con Outlook/Gmail mobile. Paleta institucional UNDC.

const azulUNDC = "#1e3a8a"
const azulBoton = "#1d4ed8"

// DatosProyecto son los campos comunes de todo correo de proyecto.
type DatosProyecto struct {
	Destinatario string // nombre de la persona (para el saludo)
	Codigo       string // UNDC-RSU-2026-012
	Titulo       string // título del proyecto
	Accion       string // "aprobó", "devolvió", "cambió de estado"...
	Actor        string // quién ejecutó la acción (nombre del rol o persona)
	EstadoNuevo  string // "Con V°B° de Escuela"...
	EstadoAnt    string // estado anterior (para devoluciones)
	Motivo       string // motivo de la devolución (R26)
	RolLector    string // "Director de Escuela", "Líder del equipo"...
	URLProyecto  string // enlace al panel
}

// esc escapa texto del usuario para insertarlo en HTML sin romper el marcado.
func esc(s string) string { return html.EscapeString(s) }

// envoltorio maqueta el correo: header institucional, contenido y footer.
func envoltorio(titulo, contenido, ctaTexto, ctaURL string) string {
	boton := ""
	if ctaTexto != "" && ctaURL != "" {
		boton = fmt.Sprintf(`
	<tr><td style="padding:8px 32px 28px">
		<a href="%s" style="display:inline-block;background:%s;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:8px">%s</a>
	</td></tr>`, esc(ctaURL), azulBoton, esc(ctaTexto))
	}
	return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>` + esc(titulo) + `</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
	<tr><td style="background:` + azulUNDC + `;padding:22px 32px">
		<div style="color:#ffffff;font-size:19px;font-weight:800;letter-spacing:.3px">UNDC — Responsabilidad Social Universitaria</div>
		<div style="color:#bfdbfe;font-size:12px;margin-top:2px">Sistema de Gestión RSU · Ley 30220 (Art. 124-125) · Cañete</div>
	</td></tr>
	<tr><td style="padding:26px 32px 4px">
		<div style="font-size:17px;font-weight:800;color:#0f172a">` + esc(titulo) + `</div>
	</td></tr>
	<tr><td style="padding:12px 32px 0">
	` + contenido + `
	</td></tr>` + boton + `
	<tr><td style="padding:0 32px 26px">
		<div style="border-top:1px solid #e2e8f0;padding-top:14px;color:#94a3b8;font-size:11px;line-height:1.6">
		Correo automático del Sistema de Gestión RSU — Universidad Nacional de Cañete.<br>
		No respondas a este mensaje; ingresa al panel para gestionar tu proyecto.
		</div>
	</td></tr>
</table>
</td></tr></table>
</body></html>`
}

// fichaDatos arma la tabla código/título/estado usada en varios correos.
func fichaDatos(d DatosProyecto) string {
	filas := ""
	if d.Codigo != "" {
		filas += fila("Proyecto", d.Codigo)
	}
	if d.Titulo != "" {
		filas += fila("Título", d.Titulo)
	}
	if d.EstadoNuevo != "" {
		filas += fila("Estado actual", d.EstadoNuevo)
	}
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;margin:6px 0 10px">` + filas + `</table>`
}

func fila(k, v string) string {
	return fmt.Sprintf(`<tr>
	<td style="padding:9px 14px;color:#64748b;font-size:12px;font-weight:600;width:130px;border-bottom:1px solid #f1f5f9">%s</td>
	<td style="padding:9px 14px;color:#0f172a;font-size:13px;font-weight:600;border-bottom:1px solid #f1f5f9">%s</td>
</tr>`, esc(k), esc(v))
}

// cajaInfo renderiza una caja de color (éxito / alerta) con título y texto.
func cajaInfo(bg, borde, color, titulo, texto string) string {
	return fmt.Sprintf(`<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:%s;border:1px solid %s;border-left:4px solid %s;border-radius:8px;margin:6px 0 10px">
<tr><td style="padding:12px 14px">
	<div style="font-size:12px;font-weight:800;color:%s">%s</div>
	<div style="font-size:13px;color:#334155;margin-top:3px;line-height:1.55">%s</div>
</td></tr></table>`, bg, borde, borde, color, esc(titulo), esc(texto))
}

// saludo arma el "Hola <nombre>" con caída elegante.
func saludo(nombre string) string {
	n := strings.TrimSpace(nombre)
	if n == "" {
		n = "estimado(a) miembro del equipo"
	}
	return `<div style="font-size:13px;color:#334155;line-height:1.6;margin-bottom:4px">Hola <b>` + esc(n) + `</b>:</div>`
}

// urlPanel arma el enlace al detalle del proyecto en el panel.
func urlPanel(d DatosProyecto) string {
	base := Cargar().BaseURL
	if d.URLProyecto != "" {
		return d.URLProyecto
	}
	return strings.TrimRight(base, "/") + "/mis-proyectos"
}

// CorreoAvance — aprobación / derivación del proyecto.
func CorreoAvance(d DatosProyecto) (asunto, htmlDoc, texto string) {
	asunto = fmt.Sprintf("RSU: tu proyecto %s avanzó a %s", d.Codigo, d.EstadoNuevo)
	contenido := saludo(d.Destinatario) +
		fmt.Sprintf(`<div style="font-size:13px;color:#334155;line-height:1.6;margin-bottom:10px">
		<b>%s</b> %s el proyecto <b>%s</b>. El nuevo estado es <b>%s</b>%s.</div>`,
			esc(d.Actor), esc(d.Accion), esc(d.Codigo), esc(d.EstadoNuevo), rolLector(d)) +
		cajaInfo("#ecfdf5", "#a7f3d0", "#047857", "Novedad", "Puedes revisar el detalle, el historial de aprobaciones y los documentos en el panel RSU.") +
		fichaDatos(d)
	htmlDoc = envoltorio("Tu proyecto avanzó de estado", contenido, "Abrir panel RSU", urlPanel(d))
	texto = fmt.Sprintf("Hola %s:\n\n%s %s el proyecto %s («%s»). Nuevo estado: %s.\n\nRevisa el detalle en el panel RSU: %s",
		d.Destinatario, d.Actor, d.Accion, d.Codigo, d.Titulo, d.EstadoNuevo, urlPanel(d))
	return
}

// CorreoDevolucion — rechazo/observación: incluye el motivo (R26).
func CorreoDevolucion(d DatosProyecto) (asunto, htmlDoc, texto string) {
	asunto = fmt.Sprintf("RSU: tu proyecto %s fue devuelto — requiere correcciones", d.Codigo)
	contenido := saludo(d.Destinatario) +
		fmt.Sprintf(`<div style="font-size:13px;color:#334155;line-height:1.6;margin-bottom:10px">
		<b>%s</b> devolvió el proyecto <b>%s</b> desde <b>%s</b>. Revisa el motivo y realiza las correcciones.</div>`,
			esc(d.Actor), esc(d.Codigo), esc(estadoODashboard(d))) +
		cajaInfo("#fffbeb", "#fde68a", "#b45309", "Motivo de la devolución (R26)", motivoODefault(d)) +
		fichaDatos(d) +
		`<div style="font-size:13px;color:#334155;line-height:1.6;margin:4px 0 12px">Corrige lo señalado y vuelve a enviarlo desde <b>Mis proyectos</b>. El historial completo queda registrado en el sistema.</div>`
	htmlDoc = envoltorio("Tu proyecto fue devuelto para correcciones", contenido, "Corregir y reenviar", urlPanel(d))
	texto = fmt.Sprintf("Hola %s:\n\n%s devolvió el proyecto %s («%s»). Estado anterior: %s.\nMotivo: %s\n\nCorrige y reenvía desde Mis proyectos: %s",
		d.Destinatario, d.Actor, d.Codigo, d.Titulo, estadoODashboard(d), motivoODefault(d), urlPanel(d))
	return
}

// CorreoLiderCambiado — aviso al líder saliente y al líder entrante.
func CorreoLiderCambiado(d DatosProyecto, eresEntrante bool, contraparte string) (asunto, htmlDoc, texto string) {
	if eresEntrante {
		asunto = fmt.Sprintf("RSU: ahora eres líder del proyecto %s", d.Codigo)
		contenido := saludo(d.Destinatario) +
			fmt.Sprintf(`<div style="font-size:13px;color:#334155;line-height:1.6;margin-bottom:10px">
			A partir de ahora eres <b>líder del equipo</b> del proyecto <b>%s</b>.</div>`, esc(d.Codigo)) +
			cajaInfo("#eff6ff", "#bfdbfe", "#1d4ed8", "Nuevo rol", "Como líder puedes editar la información del proyecto, gestionar el equipo y enviarlo a revisión. "+esc(contraparte)+" queda como miembro del equipo.") +
			fichaDatos(d)
		htmlDoc = envoltorio("Ahora eres líder del proyecto", contenido, "Abrir panel RSU", urlPanel(d))
		texto = fmt.Sprintf("Hola %s:\n\nA partir de ahora eres líder del proyecto %s («%s»). Ingrésalo desde: %s",
			d.Destinatario, d.Codigo, d.Titulo, urlPanel(d))
		return
	}
	asunto = fmt.Sprintf("RSU: dejaste de ser líder del proyecto %s", d.Codigo)
	contenido := saludo(d.Destinatario) +
		fmt.Sprintf(`<div style="font-size:13px;color:#334155;line-height:1.6;margin-bottom:10px">
		El liderazgo del proyecto <b>%s</b> fue transferido a <b>%s</b>.</div>`, esc(d.Codigo), esc(contraparte)) +
		cajaInfo("#f8fafc", "#e2e8f0", "#475569", "Cambio de liderazgo", "Sigues siendo miembro del equipo y puedes continuar subiendo documentos y evidencias (HU-033).") +
		fichaDatos(d)
	htmlDoc = envoltorio("Cambio de liderazgo del proyecto", contenido, "Abrir panel RSU", urlPanel(d))
	texto = fmt.Sprintf("Hola %s:\n\nEl liderazgo del proyecto %s («%s») fue transferido a %s. Sigues en el equipo.",
		d.Destinatario, d.Codigo, d.Titulo, contraparte)
	return
}

// CorreoProyectoCreado — confirmación al líder al crear el informe inicial.
func CorreoProyectoCreado(d DatosProyecto) (asunto, htmlDoc, texto string) {
	asunto = fmt.Sprintf("RSU: proyecto %s creado en borrador", d.Codigo)
	contenido := saludo(d.Destinatario) +
		fmt.Sprintf(`<div style="font-size:13px;color:#334155;line-height:1.6;margin-bottom:10px">
		Tu proyecto <b>%s</b> quedó registrado en estado <b>BORRADOR</b>. Todo el equipo ya puede subir documentos y evidencias.</div>`, esc(d.Codigo)) +
		fichaDatos(d)
	htmlDoc = envoltorio("Proyecto creado", contenido, "Abrir panel RSU", urlPanel(d))
	texto = fmt.Sprintf("Hola %s:\n\nTu proyecto %s («%s») quedó en BORRADOR. Panel: %s",
		d.Destinatario, d.Codigo, d.Titulo, urlPanel(d))
	return
}

func rolLector(d DatosProyecto) string {
	if strings.TrimSpace(d.RolLector) == "" {
		return ""
	}
	return " Te toca revisarlo como " + d.RolLector + "."
}

func estadoODashboard(d DatosProyecto) string {
	if strings.TrimSpace(d.EstadoAnt) != "" {
		return d.EstadoAnt
	}
	return "el estado anterior"
}

func motivoODefault(d DatosProyecto) string {
	if strings.TrimSpace(d.Motivo) != "" {
		return d.Motivo
	}
	return "(sin motivo especificado)"
}
