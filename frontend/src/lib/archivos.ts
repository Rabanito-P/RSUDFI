// Validación de archivos ANTES de subir: fail-fast en el navegador para no
// gastar ancho y mostrar el error de inmediato. El backend revalida siempre
// (tamaño, extensión y contenido) — esto es la primera capa amable.

export const MAX_PDF_MB = 32
export const MAX_FOTO_MB = 5
export const MAX_OFFICE_MB = 32

type Regla = {
  ext: string[]          // extensiones permitidas (con punto)
  maxMB: number
  etiqueta: string       // "el informe en PDF", "la foto de evidencia"...
}

const REGLAS = {
  pdf:     { ext: ['.pdf'], maxMB: MAX_PDF_MB, etiqueta: 'el documento PDF' },
  foto:    { ext: ['.jpg', '.jpeg', '.png'], maxMB: MAX_FOTO_MB, etiqueta: 'la foto de evidencia' },
  office:  { ext: ['.docx', '.xlsx'], maxMB: MAX_OFFICE_MB, etiqueta: 'el formato' },
  mixto:   { ext: ['.pdf', '.docx', '.xlsx'], maxMB: MAX_PDF_MB, etiqueta: 'el documento' },
} as Record<string, Regla>

const TIPOS: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
}

/** Devuelve el mensaje de error amable, o null si el archivo pasa. */
export function validarArchivo(file: File | null | undefined, tipo: keyof typeof REGLAS): string | null {
  const regla = REGLAS[tipo]
  if (!regla) return null
  if (!file) return `Selecciona ${regla.etiqueta}`
  if (file.size === 0) return `El archivo «${file.name}» está vacío`
  const maxBytes = regla.maxMB * 1024 * 1024
  if (file.size > maxBytes) {
    const peso = file.size >= 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`
    return `«${file.name}» pesa ${peso} y el máximo para ${regla.etiqueta} es ${regla.maxMB} MB`
  }
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
  if (!regla.ext.includes(ext)) {
    return `«${file.name}» no es válido: solo se aceptan ${regla.ext.join(', ')}`
  }
  // Content-type del navegador (algunos SO no lo informan: no se bloquea por eso).
  const tipos = TIPOS[ext]
  if (file.type && tipos && tipos.length && !tipos.includes(file.type)) {
    return `«${file.name}» no parece ser ${ext.replace('.', '').toUpperCase()} real (tipo detectado: ${file.type || 'desconocido'})`
  }
  return null
}

/** Validación múltiple para lotes (subida de varias fotos). */
export function validarLote(files: File[], tipo: keyof typeof REGLAS, maxArchivos?: number): string | null {
  if (!files.length) return `Selecciona al menos un archivo`
  if (maxArchivos && files.length > maxArchivos) {
    return `Puedes subir máximo ${maxArchivos} archivo(s) a la vez (seleccionaste ${files.length})`
  }
  for (const f of files) {
    const err = validarArchivo(f, tipo)
    if (err) return err
  }
  return null
}
