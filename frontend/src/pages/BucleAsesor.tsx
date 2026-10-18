import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api, asArray } from '../api/client'
import { Alert } from '../components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { CheckCircle2, XCircle, Clock, UserCheck } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────
// HU-F1-04 / HU-F1-06 — Bucle de aceptación y rechazo del docente asesor
// Base: rules (3) §3.1 punto 2 y §5 CAMINO 1.
//
// El docente recibe la propuesta en ENVIADO_ASESOR y decide:
//   ACEPTAR  → ACEPTADO_ASESOR (habilitado para envío a Escuela)
//   RECHAZAR → OBSERVADO_ASESOR (congela el contenido; el líder elige
//              otro asesor y reenvía, con reintentos ilimitados)
// ─────────────────────────────────────────────────────────────────

const codigoEstado = (p: any): string => {
  const e = p?.estado_actual
  if (!e) return ''
  return typeof e === 'string' ? e : (e.codigo ?? '')
}

export default function BucleAsesor() {
  const { user } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const [motivos, setMotivos] = useState<Record<number, string>>({})
  const [verMotivo, setVerMotivo] = useState<number | null>(null)

  const esDocente = user?.rol === 'DOCENTE'

  const cargar = async () => {
    setLoading(true)
    setErr('')
    try {
      const r: any = await api.get('/api/v1/proyectos?limit=50')
      const lista = asArray(r.data)
      // Solo las propuestas que esperan al asesor.
      setItems(lista.filter((p: any) => codigoEstado(p) === 'ENVIADO_ASESOR'))
    } catch (ex: any) {
      setErr(ex?.message || 'No se pudieron cargar las propuestas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (esDocente) cargar() }, [user?.rol])

  const decidir = async (p: any, decision: 'ACEPTAR' | 'RECHAZAR') => {
    setErr(''); setMsg('')
    const motivo = (motivos[p.id_proyecto] ?? '').trim()
    // CA-4.9: rechazar exige motivo escrito (regla R26 vigente).
    if (decision === 'RECHAZAR' && !motivo) {
      setErr('Escribe el motivo del rechazo: el estudiante debe saber qué corregir.')
      setVerMotivo(p.id_proyecto)
      return
    }
    setBusy(p.id_proyecto)
    try {
      const body: any = { decision }
      if (motivo) body.motivo = motivo
      const r: any = await api.post(`/api/v1/proyectos/${p.id_proyecto}/decision-asesor`, body)
      setMsg(r?.message ?? (decision === 'ACEPTAR' ? 'Asesoría aceptada' : 'Asesoría rechazada'))
      setMotivos(m => { const c = { ...m }; delete c[p.id_proyecto]; return c })
      setVerMotivo(null)
      await cargar()
    } catch (ex: any) {
      setErr(ex?.message || 'No se pudo registrar la decisión')
    } finally {
      setBusy(null)
    }
  }

  if (!esDocente) {
    return (
      <Card className="p-6">
        <Alert variant="info">Esta sección es exclusiva del docente asesor.</Alert>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-black text-lg flex items-center gap-2">
          <UserCheck size={18} /> Propuestas por asesorar
        </h2>
        <Button onClick={cargar} disabled={loading}>Actualizar</Button>
      </div>

      {err && <Alert variant="error">{err}</Alert>}
      {msg && <Alert variant="success">{msg}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando propuestas…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-500">
            No hay propuestas esperando tu respuesta.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(p => (
            <Card key={p.id_proyecto}>
              <CardHeader>
                <CardTitle className="text-sm">{p.codigo_proyecto} — {p.titulo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {p.problematica && (
                  <div>
                    <b>Problemática:</b>{' '}
                    <span className="text-slate-600">{p.problematica}</span>
                  </div>
                )}
                <div className="grid sm:grid-cols-3 gap-2 text-xs text-slate-600">
                  <div><b>ODS:</b> {p.ods ?? '—'}</div>
                  <div><b>Ciclo:</b> {p.ciclo_creacion?.nombre ?? p.semestre ?? '—'}</div>
                  <div><b>Líder:</b> {p.estudiante_lider?.nombres ?? '—'} {p.estudiante_lider?.apellidos ?? ''}</div>
                </div>

                {verMotivo === p.id_proyecto && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Motivo del rechazo *</label>
                    <textarea
                      rows={3}
                      value={motivos[p.id_proyecto] ?? ''}
                      onChange={e => setMotivos(m => ({ ...m, [p.id_proyecto]: e.target.value }))}
                      placeholder="Ej.: falta definir el presupuesto o la población beneficiaria"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                    <div className="text-[11px] text-slate-500">
                      Al rechazar, el contenido técnico queda congelado y el estudiante podrá elegir otro asesor.
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => decidir(p, 'ACEPTAR')}
                    disabled={busy === p.id_proyecto}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 size={14} className="mr-1" /> Aceptar asesoría
                  </Button>
                  <Button
                    onClick={() => { setVerMotivo(p.id_proyecto); setErr('') }}
                    disabled={busy === p.id_proyecto}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <XCircle size={14} className="mr-1" /> Rechazar
                  </Button>
                  {verMotivo === p.id_proyecto && (
                    <Button
                      onClick={() => decidir(p, 'RECHAZAR')}
                      disabled={busy === p.id_proyecto || !(motivos[p.id_proyecto] ?? '').trim()}
                      className="bg-red-700 hover:bg-red-800"
                    >
                      <Clock size={14} className="mr-1" /> Confirmar rechazo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}