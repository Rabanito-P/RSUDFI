// Catálogo de errores amables (HU-063..HU-068): traduce los mensajes técnicos
// del backend ("HTTP 400: ...") a textos claros para el estudiante/responsable.
// Los mensajes originales se conservan en consola para soporte.
const MAPA: [RegExp, string][] = [
  [/ya tienes una solicitud pendiente/i, 'Ya enviaste una solicitud para este PEP. Revísala en “Mis solicitudes”.'],
  [/ya eres miembro de este proyecto/i, 'Ya eres miembro de este equipo.'],
  [/ya eres el l[ií]der/i, 'Eres el líder de este proyecto.'],
  [/solo los proyectos PEP reciben solicitudes/i, 'Solo los PEP abiertos reciben solicitudes de unión.'],
  [/ya est[aá] cerrado/i, 'Este proyecto ya cerró y no recibe solicitudes.'],
  [/ya pertenece a otro proyecto activo/i, 'Ya perteneces a otro proyecto activo. Pide tu retiro para unirte a uno nuevo.'],
  [/el equipo ya tiene 5/i, 'El equipo ya está completo (5 de 5).'],
  [/no se pudo inscribir al estudiante/i, 'No se pudo completar la inscripción. Intenta de nuevo en unos segundos.'],
  [/estudiante no encontrado/i, 'No se encontró tu perfil de estudiante. Vuelve a iniciar sesión.'],
  [/proyecto no encontrado|el proyecto ya no existe/i, 'El proyecto ya no existe. Recarga la lista.'],
  [/la solicitud ya fue resuelta/i, 'Esta solicitud ya fue resuelta. Recarga la lista.'],
  [/solo el responsable del PEP/i, 'Solo el responsable del PEP puede resolver solicitudes.'],
  [/motivo_rapido inv[aá]lido/i, 'Elige un motivo rápido válido.'],
  [/con motivo OTRO debes escribir/i, 'Con motivo OTRO escribe la razón del rechazo.'],
  [/solo el solicitante puede cancelar/i, 'Solo quien hizo la solicitud puede cancelarla.'],
  [/solo se puede cancelar una solicitud pendiente/i, 'Solo se puede cancelar una solicitud pendiente.'],
  [/c[oó]digo de proyecto ya existe/i, 'Ese código de proyecto ya existe. Intenta de nuevo.'],
  [/unexpected EOF|failed to fetch|networkerror|error de red/i, 'No se pudo contactar al servidor. Revisa tu conexión e intenta de nuevo.'],
]

export function mensajeError(ex: any, respaldo = 'Ocurrió un problema. Intenta de nuevo.'): string {
  const crudo = ex?.message || String(ex || '')
  // Log técnico para soporte; el usuario ve el texto amable.
  if (crudo) console.warn('[RSU]', crudo)
  const limpio = crudo.replace(/^HTTP \d+:\s*/, '').trim()
  for (const [re, texto] of MAPA) {
    if (re.test(limpio)) return texto
  }
  return limpio || respaldo
}
