import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCatalogoBpmn } from '../hooks/useCatalogoBpmn'
import { api, asArray } from '../api/client'
import { validarArchivo } from '../lib/archivos'
import { CheckCircle, Clock, FileText, Eye, Upload } from 'lucide-react'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'

type Opcion = { destino: string; nombre: string; rechazo: boolean }

// R27 / HU-005 / HU-007: estas aprobaciones exigen PDF firmado de sustento.
// El backend lo valida igual; aquí se pide ANTES para no perder el trabajo.
const DESTINOS_CON_PDF = ['CON_VB_ESCUELA', 'APROBADO_CON_RESOLUCION']
// Tipo de documento del sustento según el destino (catálogo RSU_Tipo_Documento).
const TIPO_DOC_SUSTENTO: Record<string, string> = {
  CON_VB_ESCUELA: '2',           // Informe Técnico de Viabilidad
  APROBADO_CON_RESOLUCION: '3',  // Resolución de Aprobación
}

// El estado puede venir como string o como objeto RSU_Estado_Proyecto.
function nombreEstado(v: any): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  return v.nombre || v.codigo || ''
}

export default function Bandeja() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pendientes, setPendientes] = useState<any[]>([])
  const [opciones, setOpciones] = useState<Record<number, Opcion[]>>({})
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  // Modal de observación: reemplaza al window.prompt (R26 exige motivo).
  const [obs, setObs] = useState<{ proyecto: any; motivo: string } | null>(null)
  const [obsBusy, setObsBusy] = useState(false)
  // Modal de sustento PDF (R27): se abre cuando la aprobación lo exige.
  const [sustento, setSustento] = useState<{ proyecto: any; destino: string } | null>(null)
  const [sustentoFile, setSustentoFile] = useState<File | null>(null)
  const [sustentoBusy, setSustentoBusy] = useState(false)

  // Escape cierra el modal de observación (misma conducta que el resto de la app).
  useEffect(() => {
    if (!obs) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && !obsBusy) setObs(null) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [obs, obsBusy])

  const confirmarObservar = async () => {
    if (!obs) return
    const motivo = obs.motivo.trim()
    if (motivo.length < 5) {
      setErr('El motivo de la observación debe tener al menos 5 caracteres.')
      return
    }
    setObsBusy(true)
    setErr('')
    try {
      await transicionar(obs.proyecto, 'OBSERVADO', motivo)
      // Solo cierra si no hubo error: transicionar deja el detalle en setErr.
      if (!err) setObs(null)
    } finally {
      setObsBusy(false)
    }
  }

  // Estados y transiciones reales (RSU_Estado_Proyecto / RSU_Transicion_Estado).
  const { transiciones, estados, codigosDeLane, lanePorCodigo, loading: catLoading, error: catError } =
    useCatalogoBpmn(user?.rol_actor_id)

  const destinosDe = useCallback(
    (idEstadoActual: number): Opcion[] => {
      const byId = new Map<number, string>(estados.map(e => [Number(e.id_estado), e.codigo]))
      const nameOf = new Map<number, string>(estados.map(e => [Number(e.id_estado), e.nombre]))
      return transiciones
        .filter(
          t =>
            Number(t.estado_origen) === Number(idEstadoActual) &&
            Number(t.id_rol_actor) === Number(user?.rol_actor_id),
        )
        .map(t => {
          const cod = byId.get(Number(t.estado_destino)) || ''
          return {
            destino: cod,
            nombre: nameOf.get(Number(t.estado_destino)) || cod,
            rechazo: cod.includes('RECHAZ'),
          }
        })
        .filter((o: Opcion) => !!o.destino)
    },
    [transiciones, estados, user?.rol_actor_id],
  )

  const loadPendientes = useCallback(() => {
    setLoading(true)
    setErr('')
    // Los estados que este rol debe revisar salen de la matriz de transiciones.
    const estadosParaRol = codigosDeLane
    if (estadosParaRol.length === 0 || !user) {
      setPendientes([])
      setLoading(false)
      return
    }
    Promise.all(
      estadosParaRol.map((estado) =>
        api.get(`/api/v1/proyectos?estado=${encodeURIComponent(estado)}&limit=50`)
          .then((r: any) => (Array.isArray(r.data) ? r.data : []))
          .catch(() => []),
      ),
    )
      .then((results) => {
        const seen = new Set<number>()
        const all: any[] = []
        for (const list of results) {
          for (const p of list) {
            if (p && !seen.has(Number(p.id_proyecto))) {
              seen.add(Number(p.id_proyecto))
              all.push(p)
            }
          }
        }
        setPendientes(all)
        const map: Record<number, Opcion[]> = {}
        for (const p of all) map[Number(p.id_proyecto)] = destinosDe(Number(p.id_estado_actual))
        setOpciones(map)
      })
      .catch((e) => setErr(e?.message?.slice(0, 180) || 'Error al cargar proyectos'))
      .finally(() => setLoading(false))
  }, [user, destinosDe])

  useEffect(() => {
    loadPendientes()
  }, [loadPendientes])

  const transicionar = async (proyecto: any, resultado: string, comentarios?: string, idDocumento?: number) => {
    const key = String(proyecto.id_proyecto)
    setBusy((prev) => ({ ...prev, [key]: true }))
    setErr('')
    setMsg('')
    try {
      const opcs = opciones[Number(proyecto.id_proyecto)] || []
      // APROBADO -> primer destino que no sea rechazo; OBSERVADO -> destino de rechazo (rebote)
      const elegida = resultado === 'APROBADO' ? opcs.find((o) => !o.rechazo) : opcs.find((o) => o.rechazo)
      if (!elegida) throw new Error('Tu rol no tiene una transición válida desde el estado actual del proyecto.')
      // R27: si la aprobación exige PDF y aún no lo tenemos, se pide primero.
      if (resultado === 'APROBADO' && DESTINOS_CON_PDF.includes(elegida.destino) && !idDocumento) {
        setSustento({ proyecto, destino: elegida.destino })
        setSustentoFile(null)
        return
      }
      await api.post(`/api/v1/proyectos/${proyecto.id_proyecto}/transicion`, {
        estado_destino: elegida.destino,
        id_rol_actor: user?.rol_actor_id,
        id_usuario: user?.id,
        resultado,
        comentarios: comentarios || undefined,
        id_documento_sustento: idDocumento || undefined,
      })
      setMsg(`${proyecto.codigo_proyecto}: ${resultado === 'APROBADO' ? 'aprobado → ' + elegida.nombre : 'observado y devuelto al emisor'}.`)
      loadPendientes()
    } catch (e: any) {
      setErr(e?.message?.replace(/^HTTP \d+: /, '')?.slice(0, 200) || 'Error al procesar la transición')
    } finally {
      setBusy((prev) => ({ ...prev, [key]: false }))
    }
  }

  // R27: sube el PDF firmado y continúa la aprobación con su id.
  const confirmarSustento = async () => {
    if (!sustento) return
    const errFile = validarArchivo(sustentoFile, 'pdf')
    if (errFile) { setErr(errFile); return }
    setSustentoBusy(true); setErr('')
    try {
      const fd = new FormData()
      fd.append('id_proyecto', String(sustento.proyecto.id_proyecto))
      fd.append('id_tipo_doc', TIPO_DOC_SUSTENTO[sustento.destino] || '1')
      fd.append('archivo', sustentoFile as File)
      const r: any = await api.upload('/api/v1/documentos/upload', fd)
      const idDoc = r?.data?.id_documento
      if (!idDoc) throw new Error('El documento se subió pero no devolvió su id')
      await transicionar(sustento.proyecto, 'APROBADO', undefined, idDoc)
      setSustento(null); setSustentoFile(null)
    } catch (e: any) {
      setErr(e?.message?.replace(/^HTTP \d+: /, '')?.slice(0, 220) || 'No se pudo subir el sustento')
    } finally {
      setSustentoBusy(false)
    }
  }

  const observar = (proyecto: any) => {
    setObs({ proyecto, motivo: '' })
  }

  const laneLabels = codigosDeLane
    .map(c => lanePorCodigo.get(c)?.nombre)
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">Bandeja de aprobación — {user?.rol_actor}</h1>
        <p className="text-sm text-slate-500">
          Solo ves proyectos cuyo <b>estado_actual</b> habilita una transición de tu rol (RSU_Transicion_Estado).
        </p>
      </div>

      <div className="bg-undc-50 border border-undc-200 rounded-2xl p-3 text-xs">
        {catLoading ? (
          <span className="text-slate-500">Leyendo matriz de transiciones…</span>
        ) : (
          <>
            <span className="text-slate-600">Tus lanes: </span>
            <b>{laneLabels || '—'}</b>
            {user?.rol_actor_id ? <span className="text-slate-500"> · rol_actor_id {user.rol_actor_id}</span> : null}
            {!laneLabels && !catError ? (
              <span className="text-amber-700"> · tu rol no tiene estados asignados en la matriz</span>
            ) : null}
          </>
        )}
      </div>

      {catError && <Alert variant="error">{catError}</Alert>}
      {err && <Alert variant="error">{err}</Alert>}
      {msg && <Alert variant="success">{msg}</Alert>}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : pendientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <Clock className="mx-auto text-slate-400" />
          <div className="font-bold mt-2">Sin pendientes para tu rol</div>
          <div className="text-sm text-slate-500">
            Cuando un proyecto llegue a un estado que tu rol puede actuar, aparecerá aquí.
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {pendientes.map((p) => {
            const opcs = opciones[Number(p.id_proyecto)] || []
            const puedeAprobar = opcs.some((o) => !o.rechazo)
            const puedeObservar = opcs.some((o) => o.rechazo)
            return (
              <div key={p.id_proyecto} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[260px]">
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{p.codigo_proyecto}</span>
                    <span className="px-2 py-1 bg-undc-700 text-white rounded-full text-xs font-bold">
                      {p.estado_actual?.codigo || nombreEstado(p.estado)}
                    </span>
                    <span className="text-xs text-slate-500">{p.escuela?.nombre || ''}</span>
                  </div>
                  <div className="font-semibold mt-1">{p.titulo}</div>
                  <div className="text-xs text-slate-500">
                    Líder: {p.estudiante_lider ? `${p.estudiante_lider.nombres} ${p.estudiante_lider.apellidos}` : '—'} · Asesor:{' '}
                    {p.docente_asesor ? `${p.docente_asesor.nombres} ${p.docente_asesor.apellidos}` : '—'}
                  </div>
                  {opcs.length > 0 && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      Destinos válidos: {opcs.map((o) => o.nombre).join(' · ')}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                  <button
                    onClick={() => transicionar(p, 'APROBADO')}
                    disabled={!puedeAprobar || busy[p.id_proyecto]}
                    title={puedeAprobar ? 'Aprobar y avanzar de estado' : 'Sin transición de aprobación para tu rol'}
                    className="px-3 py-2 bg-undc-700 hover:bg-undc-800 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center gap-1"
                  >
                    <CheckCircle size={14} /> Aprobar
                  </button>
                  <button
                    onClick={() => observar(p)}
                    disabled={!puedeObservar || busy[p.id_proyecto]}
                    title={puedeObservar ? 'Observar y devolver al emisor' : 'Sin transición de rechazo para tu rol'}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold"
                  >
                    Observar
                  </button>
                  <button
                    onClick={() => navigate(`/proyectos/${p.id_proyecto}`)}
                    className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-sm flex items-center gap-1"
                  >
                    <Eye size={14} /> Ver expediente
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold flex items-center gap-2">
          <FileText size={16} /> Resoluciones
        </h3>
        <p className="text-xs text-slate-500">
          RSU_Resolucion (APROBACION / CIERRE / CONFORMIDAD_EVALUACION) — emite Consejo de Facultad y se adjunta como
          documento.
        </p>
      </div>

      {obs && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={() => !obsBusy && setObs(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-4 sm:p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900">Observar proyecto</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {obs.proyecto?.codigo_proyecto} — {obs.proyecto?.titulo}
                </p>
              </div>
              <button
                onClick={() => !obsBusy && setObs(null)}
                className="w-9 h-9 rounded-full bg-slate-100 grid place-items-center shrink-0 hover:bg-slate-200"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-700">
                Motivo de la observación <span className="text-red-500">*</span>
              </label>
              <textarea
                autoFocus
                rows={4}
                value={obs.motivo}
                onChange={e => setObs({ ...obs, motivo: e.target.value })}
                placeholder="Explica qué debe corregir el equipo para poder aprobar"
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-undc-500 focus:ring-4 focus:ring-undc-500/10"
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-slate-400">El proyecto vuelve al emisor con este motivo.</span>
                <span className={`text-[11px] font-semibold ${obs.motivo.trim().length < 5 ? 'text-slate-400' : 'text-emerald-600'}`}>
                  {obs.motivo.trim().length} caracteres
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                onClick={() => setObs(null)}
                disabled={obsBusy}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarObservar}
                disabled={obsBusy || obs.motivo.trim().length < 5}
                className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {obsBusy && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {obsBusy ? 'Enviando…' : 'Observar y devolver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de sustento PDF (R27): V°B° de Escuela y dictamen del Consejo ── */}
      {sustento && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={() => !sustentoBusy && setSustento(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-4 sm:p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900">Adjuntar PDF firmado</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {sustento.proyecto?.codigo_proyecto} — {sustento.proyecto?.titulo}
                </p>
              </div>
              <button
                onClick={() => !sustentoBusy && setSustento(null)}
                className="w-9 h-9 rounded-full bg-slate-100 grid place-items-center shrink-0 hover:bg-slate-200"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 bg-undc-50 border border-undc-200 rounded-xl p-3 text-xs text-undc-800">
              {sustento.destino === 'CON_VB_ESCUELA'
                ? 'El V°B° del Director de Escuela requiere el Informe Técnico de Viabilidad firmado (HU-005).'
                : 'El dictamen del Consejo requiere la Resolución firmada (HU-007 / R27).'}
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-700">
                Documento PDF <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => setSustentoFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border-0 file:bg-undc-700 file:text-white file:text-xs file:font-semibold"
                />
                <Upload size={16} className="text-slate-400 shrink-0" />
              </div>
              {sustentoFile && (
                <div className="mt-2 text-xs text-slate-600">
                  {sustentoFile.name} · {(sustentoFile.size / 1024).toFixed(0)} KB
                </div>
              )}
              <div className="text-[11px] text-slate-400 mt-1">Solo PDF · máximo 32MB. Se guarda con hash y queda en el expediente del proyecto.</div>
            </div>

            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                onClick={() => setSustento(null)}
                disabled={sustentoBusy}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarSustento}
                disabled={sustentoBusy || !sustentoFile}
                className="px-4 py-2.5 bg-undc-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sustentoBusy && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {sustentoBusy ? 'Subiendo y aprobando…' : 'Subir y aprobar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}