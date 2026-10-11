// ── Catálogo de roles de la UNDC (6 roles funcionales) ──
//
// El backend mantiene 13 cuentas en RSU_Usuario, pero el negocio UNDC opera con
// 6 roles. Cada cuenta se mapea a uno de ellos para mostrar etiquetas legibles en
// la interfaz (nunca códigos crudos como ESTUDIANTE_PROP).
//
// La fuente autoritativa del flujo sigue siendo RSU_Rol_Actor /
// RSU_Transicion_Estado: esto solo cambia cómo se NOMBRA al usuario.

export type RolKey = 'ESTUDIANTE' | 'DOCENTE' | 'CONSEJO' | 'ESCUELA' | 'FACULTAD' | 'ADMIN'

export const ROLES: Record<RolKey, { nombre: string; desc: string; color: string }> = {
  ESTUDIANTE: { nombre: 'Estudiante', desc: 'Propone, ejecuta y registra evidencias', color: '#0ea5e9' },
  DOCENTE: { nombre: 'Docente', desc: 'Asesora, monitorea y verifica entregables', color: '#10b981' },
  CONSEJO: { nombre: 'Consejo de Facultad', desc: 'Dictamina y emite resoluciones', color: '#6366f1' },
  ESCUELA: { nombre: 'Dir. Escuela Profesional', desc: 'Revisa y da V°B° a los proyectos', color: '#f59e0b' },
  FACULTAD: { nombre: 'Dir. RS Facultad', desc: 'Prioriza el banco y gestiona presupuesto', color: '#8b5cf6' },
  ADMIN: { nombre: 'Administrador', desc: 'Control total, usuarios y módulos', color: '#0f172a' },
}

/** ROL de RSU_Usuario → rol de negocio. */
export function rolDe(rol?: string | null): RolKey {
  switch (String(rol || '').toUpperCase()) {
    case 'ESTUDIANTE': return 'ESTUDIANTE'
    case 'DOCENTE': return 'DOCENTE'
    case 'ADMIN': return 'ADMIN'
    default: return 'ADMIN'
  }
}

/** rol_actor → rol de negocio (más fino que ROL). */
export function rolDeActor(rolActor?: string | null): RolKey {
  const a = String(rolActor || '').toUpperCase()
  if (a.startsWith('ESTUDIANTE')) return 'ESTUDIANTE'
  if (a.startsWith('DOCENTE')) return 'DOCENTE'
  if (a.startsWith('CONSEJO')) return 'CONSEJO'
  if (a.startsWith('DIR_ESCUELA')) return 'ESCUELA'
  if (a.startsWith('DIR_RS_FACULTAD')) return 'FACULTAD'
  if (a === 'ADMIN') return 'ADMIN'
  // Departamento y Central RS reportan al nivel facultad en el alcance vigente.
  if (a.startsWith('DIR_DEPTO') || a.startsWith('DIR_CENTRAL')) return 'FACULTAD'
  return 'ADMIN'
}

/** Nombre legible del rol de negocio. */
export function rolLegible(rol?: string | null): string {
  return ROLES[rolDe(rol)].nombre
}

/** Nombre legible del actor del usuario (grueso, sin códigos crudos). */
export function actorLegible(rolActor?: string | null): string {
  const k = rolDeActor(rolActor)
  return ROLES[k].nombre
}

export function colorRol(rol?: string | null): string {
  return ROLES[rolDe(rol)].color
}

/** Color del punto de estado del header (hereda del rol de negocio). */
export function colorActor(rolActor?: string | null): string {
  return ROLES[rolDeActor(rolActor)].color
}
