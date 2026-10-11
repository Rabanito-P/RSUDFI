import { useEffect, useMemo, useState } from 'react'
import { api, asArray } from '../api/client'

export type EstadoCatalogo = {
  id_estado: number
  codigo: string
  nombre: string
  descripcion?: string
  orden?: number
  es_final?: boolean
}

export type RolCatalogo = {
  id_rol_actor: number
  codigo: string
  nombre: string
  tipo: string
}

export type TransicionCatalogo = {
  id_transicion: number
  estado_origen: number
  estado_destino: number
  id_rol_actor: number
  requiere_documento: boolean
  rol_actor?: RolCatalogo
}

export type Lane = {
  /** Estado en el que el proyecto queda cuando este rol actúa. */
  codigo: string
  nombre: string
  id_estado: number
  /** Siguiente estado posible al aprobar. */
  destino: string
  destinoNombre: string
  id_destino: number
  requiere_documento: boolean
  es_rechazo: boolean
  /** Nombre legible del rol responsable. */
  rol: string
}

/**
 * Catálogo del flujo BPMN leído desde la base de datos.
 *
 * La matriz de estados y transiciones es el dato autoritativo
 * (RSU_Estado_Proyecto + RSU_Transicion_Estado + RSU_Rol_Actor). El frontend no
 * mantiene listas propias: si la BD cambia un rol o agrega un estado, la interfaz
 * lo refleja sin tocar código.
 */
export function useCatalogoBpmn(rolActorId?: number | null) {
  const [estados, setEstados] = useState<EstadoCatalogo[]>([])
  const [roles, setRoles] = useState<RolCatalogo[]>([])
  const [transiciones, setTransiciones] = useState<TransicionCatalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      api.get('/api/v1/catalogos/estados'),
      api.get('/api/v1/catalogos/roles-actor'),
      api.get('/api/v1/catalogos/transiciones'),
    ])
      .then(([e, r, t]: any[]) => {
        if (!alive) return
        setEstados(asArray<EstadoCatalogo>(e?.data))
        setRoles(asArray<RolCatalogo>(r?.data))
        setTransiciones(asArray<TransicionCatalogo>(t?.data))
        setError('')
      })
      .catch(() => alive && setError('No se pudo cargar el flujo de aprobación'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const porId = useMemo(() => {
    const m = new Map<number, EstadoCatalogo>()
    estados.forEach(e => m.set(Number(e.id_estado), e))
    return m
  }, [estados])

  const rolPorId = useMemo(() => {
    const m = new Map<number, RolCatalogo>()
    roles.forEach(r => m.set(Number(r.id_rol_actor), r))
    return m
  }, [roles])

  /** Lanes (estados) en los que el rol indicado tiene al menos una transición. */
  const lanes = useMemo<Lane[]>(() => {
    if (!rolActorId) return []
    const idRol = Number(rolActorId)
    const salida = new Map<number, Lane>()
    transiciones.forEach(t => {
      if (Number(t.id_rol_actor) !== idRol) return
      const origen = porId.get(Number(t.estado_origen))
      const destino = porId.get(Number(t.estado_destino))
      if (!origen || !destino) return
      const cod = String(origen.codigo)
      const previo = salida.get(Number(origen.id_estado))
      // Un rol puede tener varios destinos (aprobar / devolver). Se prioriza el
      // destino principal y, si aún no hay, cualquier transición válida.
      if (!previo || (previo.es_rechazo && !String(destino.codigo).includes('RECHAZ'))) {
        salida.set(Number(origen.id_estado), {
          codigo: cod,
          nombre: origen.nombre || cod,
          id_estado: Number(origen.id_estado),
          destino: String(destino.codigo),
          destinoNombre: destino.nombre || String(destino.codigo),
          id_destino: Number(destino.id_estado),
          requiere_documento: !!t.requiere_documento,
          es_rechazo: String(destino.codigo).includes('RECHAZ'),
          rol: rolPorId.get(Number(t.id_rol_actor))?.nombre || '',
        })
      }
    })
    return [...salida.values()].sort((a, b) => a.id_estado - b.id_estado)
  }, [transiciones, porId, rolPorId, rolActorId])

  /** Flujo completo ordenado, para dibujar la línea de progreso. */
  const flujo = useMemo(
    () => [...estados].sort((a, b) => Number(a.id_estado) - Number(b.id_estado)),
    [estados],
  )

  const codigosDeLane = useMemo(() => lanes.map(l => l.codigo), [lanes])
  const lanePorCodigo = useMemo(() => new Map(lanes.map(l => [l.codigo, l])), [lanes])

  return {
    estados,
    roles,
    transiciones,
    flujo,
    lanes,
    codigosDeLane,
    lanePorCodigo,
    porId,
    loading,
    error,
    /** Nombre legible de un estado por código. */
    nombreDe: (codigo?: string | null) =>
      estados.find(e => String(e.codigo) === String(codigo))?.nombre || codigo || '',
    /** ¿Este rol tiene alguna acción en este estado? */
    tieneLane: (codigo?: string | null) => !!codigo && codigosDeLane.includes(String(codigo)),
  }
}