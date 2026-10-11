import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api, asArray } from '../../api/client'
import { Card, CardContent } from '../../components/ui/Card'
import { Label, Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Skeleton } from '../../components/ui/Skeleton'
import { Empty } from '../../components/ui/Empty'
import {
  Camera, Clock, Calendar, FileText, Image, Trash2, Eye, Upload,
  CheckCircle2, X, Timer, Play, Square, MapPin, Users, CalendarDays,
} from 'lucide-react'

const MAX_FOTOS = 5
const MAX_MB = 5

// Capturas que exige una actividad: inicio, 3 en el intervalo y cierre.
// Si la actividad dura pocos minutos se permiten igual (el equipo decide).
const ETAPAS = [
  { clave: 'INICIO', label: 'Inicio', min: 0 },
  { clave: 'SEGUIMIENTO_1', label: 'Seguimiento 1', min: 0.25 },
  { clave: 'SEGUIMIENTO_2', label: 'Seguimiento 2', min: 0.5 },
  { clave: 'SEGUIMIENTO_3', label: 'Seguimiento 3', min: 0.75 },
  { clave: 'FIN', label: 'Cierre', min: 1 },
]

type Actividad = {
  id_actividad: number
  nombre: string
  descripcion?: string
  fecha_programada?: string
  hora_inicio?: string
  hora_fin?: string
  minutos?: number
  estado: string
  nro_beneficiarios?: number
  total_fotos?: number
  etapas_capturadas?: string[]
}

type Foto = {
  id_foto?: number
  url_foto: string
  descripcion?: string
  fecha_subida: string
  etapa?: string
  minutos_transcurridos?: number
}

/** mm:ss a partir de minutos (o de segundos ya calculados). */
function reloj(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export default function Evidencias() {
  const { user } = useAuth()
  const [proyectos, setProyectos] = useState<any[]>([])
  const [proyectoId, setProyectoId] = useState<number | null>(null)
  const [hoy, setHoy] = useState<Actividad[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  // ── Captura en curso ──────────────────────────────────────────
  const [capturando, setCapturando] = useState<Actividad | null>(null)
  const [segundos, setSegundos] = useState(0)
  const [corriendo, setCorriendo] = useState(false)
  const [fotos, setFotos] = useState<File[]>([])
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [verFotos, setVerFotos] = useState<{ a: Actividad; fotos: Foto[] } | null>(null)
  const urlsRef = useRef<string[]>([])

  const hoyISO = new Date().toISOString().slice(0, 10)

  const cargar = async (id: number | null) => {
    if (!id) return
    try {
      const [dia, todas]: any = await Promise.all([
        api.get(`/api/v1/actividades/del-dia?id_proyecto=${id}&fecha=${hoyISO}`),
        api.get(`/api/v1/proyectos/${id}/actividades`),
      ])
      setHoy(asArray(dia.data))
      setActividades(asArray(todas.data))
    } catch {
      setHoy([])
      setActividades([])
    }
  }

  useEffect(() => {
    if (!user) return
    api.get(`/api/v1/estudiantes/${user.persona_id}/proyectos`)
      .then((r: any) => {
        const list = r.data || []
        setProyectos(list)
        if (list[0]?.id_proyecto) setProyectoId(list[0].id_proyecto)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.persona_id])

  useEffect(() => {
    if (proyectoId) cargar(proyectoId)
  }, [proyectoId])

  // ── Cronómetro ───────────────────────────────────────────────
  useEffect(() => {
    if (!corriendo) return
    const id = setInterval(() => setSegundos(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [corriendo])

  const limpiarFotos = () => {
    urlsRef.current.forEach(u => URL.revokeObjectURL(u))
    urlsRef.current = []
    setFotos([])
    setFotoPreviews([])
  }

  useEffect(() => () => limpiarFotos(), [])

  const abrirCaptura = (a: Actividad) => {
    limpiarFotos()
    setSegundos(0)
    setCorriendo(true)
    setCapturando(a)
    setErr('')
  }

  const cerrarCaptura = () => {
    setCorriendo(false)
    setCapturando(null)
    limpiarFotos()
  }

  /** Etapa sugerida según el tiempo transcurrido sobre la duración planificada. */
  const etapaActual = useMemo(() => {
    if (!capturando) return ETAPAS[0]
    const total = (capturando.minutos || 60) * 60
    const frac = total > 0 ? Math.min(1, segundos / total) : 1
    for (const e of ETAPAS) {
      if (frac <= e.min + 0.001) return e
    }
    return ETAPAS[ETAPAS.length - 1]
  }, [capturando, segundos])

  const onFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setMsg('')
    const validas: File[] = []
    for (const f of files) {
      if (!/\.(jpe?g|png)$/i.test(f.name) && !f.type.startsWith('image/')) {
        setMsg(`"${f.name}" no es JPG/PNG`); continue
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setMsg(`"${f.name}" excede ${MAX_MB}MB`); continue
      }
      validas.push(f)
    }
    const espacio = MAX_FOTOS - fotos.length
    const agregar = validas.slice(0, Math.max(0, espacio))
    if (agregar.length < validas.length) setMsg(`Máximo ${MAX_FOTOS} fotos por captura`)
    if (agregar.length) {
      const urls = agregar.map(f => URL.createObjectURL(f))
      urlsRef.current = [...urlsRef.current, ...urls]
      setFotos(prev => [...prev, ...agregar])
      setFotoPreviews(prev => [...prev, ...urls])
    }
  }

  const quitarFoto = (idx: number) => {
    if (urlsRef.current[idx]) URL.revokeObjectURL(urlsRef.current[idx])
    urlsRef.current = urlsRef.current.filter((_, i) => i !== idx)
    setFotos(f => f.filter((_, i) => i !== idx))
    setFotoPreviews(p => p.filter((_, i) => i !== idx))
  }

  const subirCaptura = async () => {
    if (!capturando || fotos.length === 0) return
    setSubiendo(true)
    let ok = 0
    let fallidas = 0
    for (let i = 0; i < fotos.length; i++) {
      const fd = new FormData()
      fd.append('id_actividad', String(capturando.id_actividad))
      fd.append('etapa', etapaActual.clave)
      fd.append('minutos_transcurridos', String(Math.floor(segundos / 60)))
      fd.append('descripcion', `${etapaActual.label} — ${capturando.nombre}`)
      fd.append('archivo', fotos[i])
      try {
        await api.upload('/api/v1/actividades/fotos', fd)
        ok++
      } catch {
        fallidas++
      }
    }
    setSubiendo(false)
    if (fallidas > 0) setErr(`${fallidas} foto(s) no se pudieron subir`)
    else setErr('')
    limpiarFotos()
    if (proyectoId) await cargar(proyectoId)
    setMsg(`${ok} foto(s) de "${etapaActual.label}" registradas${fallidas ? ` · ${fallidas} fallaron` : ''}`)
  }

  const finalizarCaptura = async () => {
    if (!capturando) return
    setCorriendo(false)
    try {
      await api.patch(`/api/v1/actividades/${capturando.id_actividad}/estado`, { estado: 'EJECUTADA' })
    } catch {
      /* si falla el cambio de estado, la actividad sigue programada */
    }
    setMsg(`Actividad "${capturando.nombre}" cerrada con ${reloj(segundos)} registrados`)
    setCapturando(null)
    limpiarFotos()
    if (proyectoId) await cargar(proyectoId)
  }

  const formatoHora = (h?: string) => (h ? String(h).slice(0, 5) : '—')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Cabecera ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Registro de Evidencias</h1>
          <p className="text-sm text-slate-500">
            Actividades de campo y evidencias fotográficas. Cualquier miembro del equipo puede iniciar la actividad.
          </p>
        </div>
        {proyectos.length > 1 && (
          <div className="min-w-[200px]">
            <Label>Proyecto</Label>
            <select
              value={proyectoId ?? ''}
              onChange={e => setProyectoId(Number(e.target.value))}
              className="input mt-1"
            >
              {proyectos.map(p => (
                <option key={p.id_proyecto} value={p.id_proyecto}>{p.titulo}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {err && <Alert variant="error">{err}</Alert>}
      {msg && <Alert variant="success">{msg}</Alert>}

      {/* ── Panel de captura con cronómetro ── */}
      {capturando && (
        <Card className="border-2 border-undc-300 overflow-hidden">
          <div className="bg-undc-700 text-white px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide opacity-80 flex items-center gap-1.5">
                {corriendo
                  ? <><span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> Capturando</>
                  : <><Square size={11} /> En pausa</>}
              </div>
              <div className="font-bold truncate">{capturando.nombre}</div>
              <div className="text-[11px] opacity-80">
                Planificado {formatoHora(capturando.hora_inicio)}–{formatoHora(capturando.hora_fin)}
                {capturando.minutos ? ` · ${capturando.minutos} min` : ''}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-3xl sm:text-4xl font-black tabular-nums">{reloj(segundos)}</div>
              <div className="text-[11px] opacity-80">tiempo transcurrido</div>
            </div>
          </div>

          <CardContent className="space-y-4">
            {/* Etapas: inicio, 3 seguimientos y cierre */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-1.5"><Timer size={13} /> Etapas de captura</Label>
                <span className="text-[11px] text-slate-500">
                  Etapa sugerida: <b className="text-undc-700">{etapaActual.label}</b>
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {ETAPAS.map(e => {
                  const hecha = (capturando.etapas_capturadas || []).includes(e.clave)
                  const activa = etapaActual.clave === e.clave
                  return (
                    <div
                      key={e.clave}
                      className={`rounded-xl border p-2 text-center transition-colors ${
                        hecha ? 'bg-emerald-50 border-emerald-300'
                          : activa ? 'bg-undc-50 border-undc-400 ring-2 ring-undc-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className={`text-[10px] font-bold leading-tight ${hecha ? 'text-emerald-700' : activa ? 'text-undc-700' : 'text-slate-500'}`}>
                        {e.label}
                      </div>
                      {hecha
                        ? <CheckCircle2 size={13} className="mx-auto mt-1 text-emerald-600" />
                        : <div className="text-[9px] text-slate-400 mt-1">{Math.round((e.min - 0) * (capturando.minutos || 60))} min</div>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Fotos */}
            <div>
              <Label>Evidencias de esta etapa (hasta {MAX_FOTOS} fotos JPG/PNG, máx {MAX_MB}MB c/u)</Label>
              <div className="mt-2 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                <div className="text-xs text-slate-500 mb-2">Cada foto guarda la fecha y hora en que se tomó</div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-undc-700 text-white rounded-xl text-sm cursor-pointer hover:bg-undc-800 transition-colors">
                  <Camera size={14} /> Seleccionar fotos
                  <input type="file" accept=".jpg,.jpeg,.png" multiple className="hidden" onChange={onFotos} />
                </label>
                <div className="text-[11px] text-slate-400 mt-2">{fotos.length}/{MAX_FOTOS} fotos seleccionadas</div>
              </div>

              {fotoPreviews.length > 0 && (
                <div className="mt-3 flex gap-3 flex-wrap">
                  {fotoPreviews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
                      <button
                        type="button"
                        onClick={() => quitarFoto(i)}
                        aria-label="Quitar foto"
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full grid place-items-center shadow"
                      >
                        <X size={10} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded-b-xl text-center">
                        {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setCorriendo(c => !c)}>
                {corriendo ? <><Square size={14} /> Pausar</> : <><Play size={14} /> Reanudar</>}
              </Button>
              <Button type="button" variant="outline" onClick={cerrarCaptura}>Salir sin finalizar</Button>
              <Button type="button" variant="secondary" onClick={subirCaptura} loading={subiendo} disabled={fotos.length === 0}>
                <Upload size={14} /> Subir {fotos.length || ''} foto(s) · {etapaActual.label}
              </Button>
              <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={finalizarCaptura}>
                <CheckCircle2 size={14} /> Finalizar actividad
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Actividades de hoy (desde la planificación) ── */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={16} className="text-undc-700" />
            <h2 className="font-bold text-slate-900">Actividades de hoy</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Vienen de la planificación que subiste al crear el proyecto. Toca <b>Capturar</b> el día de la actividad.
          </p>

          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : hoy.length === 0 ? (
            <Empty
              title="Sin actividades programadas para hoy"
              description="Las actividades aparecen aquí el día que les toca, según la planificación en Excel."
              icon={<CalendarDays size={22} />}
            />
          ) : (
            <div className="space-y-2">
              {hoy.map(a => {
                const capturas = a.total_fotos || 0
                const etapas = a.etapas_capturadas || []
                const completa = etapas.length >= ETAPAS.length
                return (
                  <div key={a.id_actividad} className="border border-slate-200 rounded-2xl p-3 sm:p-4">
                    <div className="flex flex-wrap items-start gap-3 justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900">{a.nombre}</span>
                          {a.estado === 'EJECUTADA'
                            ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-bold">Ejecutada</span>
                            : <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[11px] font-bold">Programada</span>}
                          {completa && (
                            <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 size={10} /> {ETAPAS.length}/{ETAPAS.length} etapas
                            </span>
                          )}
                        </div>
                        {a.descripcion && <div className="text-xs text-slate-500 mt-0.5">{a.descripcion}</div>}
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                          <span className="inline-flex items-center gap-1"><Clock size={11} /> {formatoHora(a.hora_inicio)}–{formatoHora(a.hora_fin)}{a.minutos ? ` (${a.minutos} min)` : ''}</span>
                          <span className="inline-flex items-center gap-1"><Camera size={11} /> {capturas} foto(s)</span>
                          {etapas.length > 0 && <span className="text-slate-400">etapas: {etapas.length}/{ETAPAS.length}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => api.get(`/api/v1/actividades/${a.id_actividad}/fotos`)
                            .then((r: any) => setVerFotos({ a, fotos: asArray(r.data) }))
                            .catch(() => setVerFotos({ a, fotos: [] }))}
                        >
                          <Eye size={13} /> Ver
                        </Button>
                        <Button
                          size="sm"
                          className="bg-undc-700"
                          onClick={() => abrirCaptura(a)}
                          disabled={capturando?.id_actividad === a.id_actividad}
                        >
                          <Camera size={13} /> {capturando?.id_actividad === a.id_actividad ? 'Capturando…' : 'Capturar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Historial completo ── */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-undc-700" />
              <h2 className="font-bold text-slate-900">Historial de Actividades</h2>
            </div>
            <span className="text-xs text-slate-500">{actividades.length} en total</span>
          </div>
          {actividades.length === 0 ? (
            <Empty title="Sin actividades" description="Aún no hay actividades registradas para este proyecto." icon={<FileText size={22} />} />
          ) : (
            <div className="space-y-2">
              {actividades.map(a => (
                <div key={a.id_actividad} className="border border-slate-200 rounded-2xl p-3 flex flex-wrap gap-3 items-center">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 grid place-items-center text-slate-500 shrink-0">
                    <Image size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{a.nombre}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                      <span><Calendar size={10} className="inline" /> {a.fecha_programada?.slice(0, 10) || '—'}</span>
                      {a.minutos ? <span><Clock size={10} className="inline" /> {Math.floor(a.minutos / 60)}h {a.minutos % 60}min</span> : null}
                      <span className={`px-1.5 py-0.5 rounded-full font-bold ${a.estado === 'EJECUTADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {a.estado}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => api.get(`/api/v1/actividades/${a.id_actividad}/fotos`)
                      .then((r: any) => setVerFotos({ a, fotos: asArray(r.data) }))
                      .catch(() => setVerFotos({ a, fotos: [] }))}
                  >
                    <Eye size={14} /> Ver
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal de fotos ── */}
      {verFotos && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={() => setVerFotos(null)}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{verFotos.a.nombre}</h3>
                <p className="text-xs text-slate-500">
                  {verFotos.fotos.length} evidencia(s) · {verFotos.a.fecha_programada?.slice(0, 10) || ''}
                </p>
              </div>
              <button onClick={() => setVerFotos(null)} aria-label="Cerrar" className="w-9 h-9 rounded-full bg-slate-100 grid place-items-center shrink-0 hover:bg-slate-200">
                <X size={16} />
              </button>
            </div>

            {verFotos.fotos.length === 0 ? (
              <Empty title="Sin fotos" description="Esta actividad todavía no tiene evidencias." icon={<Image size={22} />} />
            ) : (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {verFotos.fotos.map((f: Foto, i: number) => (
                  <a key={i} href={api.fileUrl(f.url_foto)} target="_blank" rel="noreferrer" className="group block">
                    <div className="relative">
                      <img src={api.fileUrl(f.url_foto)} className="w-full h-28 rounded-xl object-cover border border-slate-200 group-hover:opacity-90" />
                      {f.etapa && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] rounded-full font-bold">
                          {f.etapa.replace('SEGUIMIENTO_', 'Seg ')}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 truncate">
                      {f.minutos_transcurridos != null && f.minutos_transcurridos > 0
                        ? `+${f.minutos_transcurridos} min`
                        : new Date(f.fecha_subida).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
