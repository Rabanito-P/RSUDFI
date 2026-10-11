// Reglas de permiso del estudiante sobre su proyecto (HU-004, HU-010..HU-014, HU-033).
// El catálogo de estados y roles vive en la base de datos (/api/v1/catalogos/*):
// aquí solo se decide qué puede hacer el usuario con el estado que ya tiene.

/** El equipo puede editar el proyecto en borrador o cuando el informe fue observado. */
export function canStudentEdit(codigoEstado?: string): boolean {
  return ['BORRADOR', 'OBSERVADO'].includes(String(codigoEstado || ''))
}

/** Cualquier miembro del equipo puede subir documentos, salvo en estados cerrados. */
export function canStudentUploadDocs(codigoEstado?: string, esMiembro?: boolean): boolean {
  if (!esMiembro) return false
  return !['CERRADO', 'REPORTADO_SUNEDU', 'EVALUACION_VALIDADA'].includes(String(codigoEstado || ''))
}

/** Cualquier miembro puede registrar actividades mientras el proyecto está en campo. */
export function canStudentRegisterActivity(codigoEstado?: string, esMiembro?: boolean): boolean {
  if (!esMiembro) return false
  return ['EN_EJECUCION', 'EN_MONITOREO'].includes(String(codigoEstado || ''))
}
