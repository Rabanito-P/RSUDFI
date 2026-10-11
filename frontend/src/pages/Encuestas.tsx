import { useEffect, useMemo, useState } from 'react'
import { api, asArray } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { Empty } from '../components/ui/Empty'
import { Alert } from '../components/ui/Alert'
import { BarChart3, TrendingUp, Users, ClipboardCheck, Award, FileDown } from 'lucide-react'

type Encuesta = {
  id_encuesta_benef: number
  id_proyecto: number
  id_beneficiario: number
  fecha_aplicacion?: string
  modalidad?: string
  promedio_general?: number
  beneficiario?: { nombres?: string; apellidos?: string; razon_social?: string; dni?: string; ruc?: string }
  proyecto?: { titulo?: string; codigo_proyecto?: string }
  respuestas?: {
    id_pregunta: number
    valor_numerico: number
    pregunta?: { codigo?: string; dimension?: string; texto_pregunta?: string }
  }[]
}

const ETIQUETAS: Record<string, string> = {
  UTILIDAD: 'Utilidad',
  CALIDAD: 'Calidad',
  TRATO: 'Trato',
  PERTINENCIA: 'Pertinencia',
  IMPACTO: 'Impacto',
}

function etiqueta(n: number) {
  if (n >= 4.5) return { label: 'MUY BUENO', color: '#673AB7' }
  if (n >= 3.5) return { label: 'BUENO', color: '#4CAF50' }
  if (n >= 2.5) return { label: 'REGULAR', color: '#FF9800' }
  if (n >= 1.5) return { label: 'MALO', color: '#FF5722' }
  return { label: 'MUY MALO', color: '#9E9E9E' }
}

/**
 * Resultados de encuestas de satisfacción.
 *
 * La aplicación de la encuesta es un trámite en campo: el personal registra las
 * respuestas en el formato Word adjunto al proyecto y luego las consolida. Esta
 * pantalla solo muestra los puntajes ya cargados y su relación con las
 * dimensiones del indicador (SUNEDU Ind.29 / SINEACE Est.25).
 */
export default function Encuestas() {
  const { user } = useAuth()
  const [encs, setEncs] = useState<Encuesta[]>([])
  const [proyectos, setProyectos] = useState<any[]>([])
  const [proyectoId, setProyectoId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Proyectos accesibles según el rol (estudiante ve solo los suyos).
  const cargarProyectos = () => {
    if (!user) return
    const endpoint = user.rol === 'ESTUDIANTE'
      ? `/api/v1/estudiantes/${user.persona_id}/proyectos`
      : `/api/v1/docentes/${user.persona_id}/proyectos`
    api.get(endpoint)
      .then((r: any) => {
        const list = asArray(r.data)
        setProyectos(list)
        if (list[0]?.id_proyecto) setProyectoId(String(list[0].id_proyecto))
      })
      .catch(() => setProyectos([]))
  }

  useEffect(() => { cargarProyectos() }, [user?.persona_id, user?.rol])

  // Descarga el formato oficial de campo (el que esté publicado en el
  // catálogo del administrador) para aplicarlo con los beneficiarios.
  const descargarFormato = async () => {
    setError('')
    try {
      const raw = localStorage.getItem('undc_user')
      const token = raw ? JSON.parse(raw)?.token : ''
      const res = await fetch('/api/v1/formatos/ENCUESTA/descargar', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const cd = res.headers.get('content-disposition') || ''
      const nombre = cd.split('filename="')[1]?.split('"')[0] || 'encuesta-satisfaccion.docx'
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = nombre
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo descargar el formato de encuesta')
    }
  }

  const cargar = () => {
    if (!proyectoId) { setLoading(false); return }
    setLoading(true); setError('')
    api.get(`/api/v1/proyectos/${proyectoId}/encuestas`)
      .then((r: any) => setEncs(asArray<Encuesta>(r.data)))
      .catch((ex: any) => { setEncs([]); setError(ex?.message || 'No se pudieron cargar las encuestas') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [proyectoId])

  // Promedio por pregunta en el proyecto (consolida todos los beneficiarios).
  const porPregunta = useMemo(() => {
    const mapa = new Map<number, { codigo: string; dimension: string; texto: string; suma: number; n: number }>()
    for (const e of encs) {
      for (const r of e.respuestas || []) {
        const clave = Number(r.id_pregunta)
        if (!mapa.has(clave)) {
          mapa.set(clave, {
            codigo: r.pregunta?.codigo || `P${clave}`,
            dimension: r.pregunta?.dimension || '—',
            texto: r.pregunta?.texto_pregunta || '',
            suma: 0, n: 0,
          })
        }
        const act = mapa.get(clave)!
        act.suma += Number(r.valor_numerico) || 0
        act.n += 1
      }
    }
    return [...mapa.values()]
      .map(v => ({ ...v, promedio: v.n ? v.suma / v.n : 0 }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo))
  }, [encs])

  // Promedio por dimensión (para el indicador de impacto).
  const porDimension = useMemo(() => {
    const mapa = new Map<string, { suma: number; n: number }>()
    for (const p of porPregunta) {
      const clave = ETIQUETAS[p.dimension] || p.dimension
      const act = mapa.get(clave) || { suma: 0, n: 0 }
      act.suma += p.promedio
      act.n += 1
      mapa.set(clave, act)
    }
    return [...mapa.entries()]
      .map(([k, v]) => ({ dimension: k, promedio: v.n ? v.suma / v.n : 0 }))
      .sort((a, b) => a.dimension.localeCompare(b.dimension))
  }, [porPregunta])

  const promedioProyecto = porPregunta.length
    ? porPregunta.reduce((a, p) => a + p.promedio, 0) / porPregunta.length
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Encuestas de satisfacción"
        subtitle="Resultados de la encuesta Likert aplicada a los beneficiarios. La recolección en campo se registra en el formato del proyecto."
        icon={<BarChart3 size={20} />}
        badge={
          <span className="px-2.5 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full text-xs font-bold">
            {encs.length} encuesta(s)
          </span>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      {/* Selector de proyecto */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <label className="text-xs font-semibold text-slate-700">Proyecto</label>
            <Select value={proyectoId} onChange={e => setProyectoId(e.target.value)} className="mt-1">
              <option value="">-- seleccionar --</option>
              {proyectos.map((p: any) => (
                <option key={p.id_proyecto} value={String(p.id_proyecto)}>
                  {p.codigo_proyecto} — {p.titulo}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="outline" onClick={cargar} leftIcon={<TrendingUp size={14} />}>
            Actualizar
          </Button>
          <Button variant="outline" onClick={descargarFormato} leftIcon={<FileDown size={14} />}>
            Formato de encuesta
          </Button>
        </div>
        {proyectos.length === 0 && !loading && (
          <div className="text-xs text-slate-500 mt-2">No hay proyectos disponibles para tu usuario.</div>
        )}
      </Card>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
        </div>
      ) : (
        <>
          {/* ── Resumen ── */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 border-l-4 border-l-violet-500">
              <div className="text-xs text-slate-500 flex items-center gap-1"><Award size={13} /> Promedio general</div>
              <div className="text-3xl font-black text-violet-600 mt-1">
                {porPregunta.length ? promedioProyecto.toFixed(2) : '—'}
                <span className="text-sm font-normal text-slate-400"> /5</span>
              </div>
              {porPregunta.length > 0 && (
                <Badge color={etiqueta(promedioProyecto).color} variant="soft">
                  {etiqueta(promedioProyecto).label}
                </Badge>
              )}
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500 flex items-center gap-1"><ClipboardCheck size={13} /> Encuestas aplicadas</div>
              <div className="text-3xl font-black mt-1">{encs.length}</div>
              <div className="text-xs text-slate-500">beneficiarios que respondieron</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500 flex items-center gap-1"><Users size={13} /> Cobertura del indicador</div>
              <div className="text-3xl font-black mt-1">{porPregunta.length}<span className="text-sm font-normal text-slate-400"> /6</span></div>
              <div className="text-xs text-slate-500">preguntas P01–P06 con datos</div>
            </Card>
          </div>

          {/* ── Promedio por pregunta ── */}
          <Card>
            <CardHeader>
              <CardTitle><BarChart3 size={16} className="text-undc-700" /> Promedio por pregunta</CardTitle>
              <p className="text-xs text-slate-500">Consolidado de todas las encuestas del proyecto seleccionado.</p>
            </CardHeader>
            <CardContent>
              {porPregunta.length === 0 ? (
                <Empty
                  title="Sin encuestas registradas"
                  description="Cuando el personal consolide las respuestas del formato de campo, los puntajes aparecerán aquí."
                  icon={<ClipboardCheck size={22} />}
                />
              ) : (
                <div className="space-y-3">
                  {porPregunta.map(p => {
                    const e = etiqueta(p.promedio)
                    return (
                      <div key={p.codigo} className="border border-slate-200 rounded-2xl p-3 sm:p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] bg-slate-900 text-white px-2 py-0.5 rounded">{p.codigo}</span>
                          <Badge color="#1b5e20" variant="soft">{ETIQUETAS[p.dimension] || p.dimension}</Badge>
                          <span className="ml-auto text-lg font-black" style={{ color: e.color }}>
                            {p.promedio.toFixed(2)} <span className="text-xs font-normal text-slate-400">/5</span>
                          </span>
                          <Badge color={e.color} variant="soft">{e.label}</Badge>
                        </div>
                        <div className="text-sm text-slate-700 mt-1.5">{p.texto}</div>
                        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(p.promedio / 5) * 100}%`, background: e.color }} />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">{p.n} respuesta(s)</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Promedio por dimensión ── */}
          {porDimension.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle><TrendingUp size={16} /> Promedio por dimensión</CardTitle>
                <p className="text-xs text-slate-500">Vista agregada del indicador de impacto (SUNEDU Ind.29 / SINEACE Est.25).</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {porDimension.map(d => {
                    const e = etiqueta(d.promedio)
                    return (
                      <div key={d.dimension} className="border border-slate-200 rounded-2xl p-3 text-center">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{d.dimension}</div>
                        <div className="text-2xl font-black mt-1" style={{ color: e.color }}>
                          {d.promedio.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">de 5.00</div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Detalle por beneficiario ── */}
          {encs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle><ClipboardCheck size={16} /> Detalle por beneficiario</CardTitle>
                <p className="text-xs text-slate-500">Puntaje individual de cada encuesta aplicada.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {encs.map(e => {
                    const prom = Number(e.promedio_general) || 0
                    const et = etiqueta(prom)
                    const nombre = e.beneficiario?.razon_social
                      || `${e.beneficiario?.apellidos || ''}, ${e.beneficiario?.nombres || ''}`.trim().replace(/^,\s*/, '')
                      || `Beneficiario #${e.id_beneficiario}`
                    return (
                      <div key={e.id_encuesta_benef} className="border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-slate-900 truncate">{nombre}</div>
                          <div className="text-[11px] text-slate-500">
                            {e.fecha_aplicacion?.slice(0, 10) || 'sin fecha'}
                            {e.modalidad ? ` · ${e.modalidad}` : ''}
                            {(e.beneficiario?.dni || e.beneficiario?.ruc) ? ` · ${e.beneficiario?.dni || e.beneficiario?.ruc}` : ''}
                          </div>
                        </div>
                        {prom > 0 && (
                          <>
                            <Badge color={et.color} variant="soft">{et.label}</Badge>
                            <span className="text-lg font-black text-slate-800">{prom.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
