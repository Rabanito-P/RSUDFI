package service

import (
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/internal/mail"
)

// ── Puente servicio → correos (Resend) ─────────────────────────
// Los avisos del panel (RSU_Notificacion) se duplican por correo para que
// nadie se pierda una aprobación o una devolución con motivo. El envío es
// asíncrono y best-effort: nunca bloquea ni rompe la transición BPMN.

type destCorreo struct {
	Correo string
	Nombre string
}

// correosDeRol devuelve correo + nombre de todos los usuarios activos con ese
// rol BPMN. Las notificaciones de lane son bandera (id_usuario NULL), así que
// el correo va a cada persona del lane.
func (s *ProyectoService) correosDeRol(rolCodigo string) []destCorreo {
	if rolCodigo == "" {
		return nil
	}
	var us []domain.RSUUsuario
	if err := s.db.Where("rol = ? AND activo = ?", rolCodigo, true).Find(&us).Error; err != nil {
		return nil
	}
	out := make([]destCorreo, 0, len(us))
	for _, u := range us {
		out = append(out, destCorreo{Correo: u.Correo, Nombre: u.Nombre})
	}
	return out
}

// correoDeUsuarioID resuelve el correo/nombre de un RSU_Usuario por su id.
func (s *ProyectoService) correoDeUsuarioID(id *uint) (destCorreo, bool) {
	if id == nil || *id == 0 {
		return destCorreo{}, false
	}
	var u domain.RSUUsuario
	if err := s.db.First(&u, "id_usuario = ?", *id).Error; err != nil {
		return destCorreo{}, false
	}
	return destCorreo{Correo: u.Correo, Nombre: u.Nombre}, true
}

// nombreRolLegible devuelve el nombre para mostrar de un rol BPMN.
func (s *ProyectoService) nombreRolLegible(codigoRol string) string {
	var ra domain.RSURolActor
	if err := s.db.First(&ra, "codigo = ?", codigoRol).Error; err == nil {
		return ra.Nombre
	}
	return ""
}

// enviarCorreos renderiza la plantilla para cada destinatario (saludo
// personalizado) y despacha el envío por Resend en segundo plano.
func (s *ProyectoService) enviarCorreos(dests []destCorreo, base mail.DatosProyecto, render func(mail.DatosProyecto) (string, string, string)) {
	if len(dests) == 0 {
		return
	}
	go func() {
		for _, d := range dests {
			personal := base
			personal.Destinatario = d.Nombre
			asunto, htmlDoc, texto := render(personal)
			_ = mail.Enviar(mail.Mensaje{
				Para:   []string{d.Correo},
				Asunto: asunto,
				HTML:   htmlDoc,
				Texto:  texto,
			})
		}
	}()
}
