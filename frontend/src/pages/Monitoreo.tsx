import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, asArray } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from '../components/ui/Skeleton'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label, Select, Textarea } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { Empty } from '../components/ui/Empty'
import { CheckCircle, Activity, Clock, TrendingUp, ArrowRight } from 'lucide-react'

type Msg = {type:'ok'|'err', text:string} | null

export default function Monitoreo(){
  const {user} = useAuth()
  const [proyectos,setProyectos]=useState<any[]>([])
  const [proyectoId,setProyectoId]=useState('')
  const [reuniones,setReuniones]=useState<any[]>([])
  const [nueva,setNueva]=useState({fecha_monitoreo:'', resultado:'', observaciones:'', porcentaje_avance:''})
  const [msg,setMsg]=useState<Msg>(null)
  const [saving,setSaving]=useState(false)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')

  useEffect(()=>{
    if(!user) return
    const endpoint = user.rol==='ESTUDIANTE'
      ? `/api/v1/estudiantes/${user.persona_id}/proyectos?limit=50`
      : user.rol==='DOCENTE'
        ? `/api/v1/docentes/${user.persona_id}/proyectos?limit=50`
        : '/api/v1/proyectos?limit=50'
    api.get(endpoint).then((r:any)=>{
      const ps = asArray(r.data)
      setProyectos(ps)
      setProyectoId(prev=> prev || (ps[0]? String(ps[0].id_proyecto):''))
    }).catch((e:any)=>{ setProyectos([]); setError(e?.message||'No se pudieron cargar tus proyectos') })
  },[user?.persona_id, user?.rol])

  const load = ()=>{
    if(!proyectoId){ setReuniones([]); setLoading(false); return }
    setLoading(true); setError('')
    api.get(`/api/v1/proyectos/${proyectoId}/monitoreos`)
      .then((r:any)=> setReuniones(asArray(r.data)))
      .catch((e:any)=>{ setReuniones([]); setError(e?.message||'No se pudieron cargar los monitoreos del proyecto') })
      .finally(()=> setLoading(false))
  }
  useEffect(()=>{ load() },[proyectoId])

  const agregar=async()=>{
    setMsg(null)
    if(!proyectoId){ setMsg({type:'err', text:'Selecciona un proyecto'}); return }
    if(!nueva.fecha_monitoreo){ setMsg({type:'err', text:'Indica la fecha de monitoreo'}); return }
    if(!nueva.resultado){ setMsg({type:'err', text:'Indica el resultado del monitoreo'}); return }
    setSaving(true)
    try{
      await api.post('/api/v1/monitoreos', {
        id_proyecto: Number(proyectoId),
        id_monitor: Number(user?.persona_id),
        fecha_monitoreo: nueva.fecha_monitoreo,
        resultado: nueva.resultado,
        porcentaje_avance: nueva.porcentaje_avance===''? undefined : Number(nueva.porcentaje_avance),
        observaciones: nueva.observaciones || undefined
      })
      setMsg({type:'ok', text:'Monitoreo registrado. El día que te toca podrás subir fotos, encuesta o informe del estudiante.'})
      setNueva({fecha_monitoreo:'', resultado:'', observaciones:'', porcentaje_avance:''})
      load()
    }catch(ex:any){
      setMsg({type:'err', text: ex?.message||'Error al registrar'})
    }finally{ setSaving(false) }
  }

  const proyectosOpts = proyectos.length
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Monitoreo"
        subtitle="Registra los días de monitoreo con tus estudiantes. En cada fecha podrás subir evidencias e informes."
        icon={<Activity size={20}/>}
        badge={<span className="px-2.5 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full text-xs font-bold">{reuniones.length} monitoreos</span>}
      />

      <Card>
        <CardHeader>
          <CardTitle><Clock size={16} className="text-undc-700"/> Registrar monitoreo</CardTitle>
          <p className="text-xs text-slate-500">Indica cuándo fue el monitoreo y qué resultado obtuviste. Backend: POST /api/v1/monitoreos (fecha_monitoreo).</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <Label required>Proyecto</Label>
              <Select value={proyectoId} onChange={e=>setProyectoId(e.target.value)}>
                <option value="">-- seleccionar --</option>
                {proyectosOpts && proyectos.map(p=> <option key={p.id_proyecto} value={String(p.id_proyecto)}>{p.codigo_proyecto} — {p.titulo}</option>)}
              </Select>
            </div>
            <div><Label required>Fecha de monitoreo</Label><Input type="date" value={nueva.fecha_monitoreo} onChange={e=>setNueva({...nueva, fecha_monitoreo:e.target.value})}/></div>
            <div><Label>Avance (%)</Label><Input type="number" min="0" max="100" value={nueva.porcentaje_avance} onChange={e=>setNueva({...nueva, porcentaje_avance:e.target.value})} placeholder="75"/></div>
            <div className="flex items-end"><Button onClick={agregar} className="w-full bg-undc-700" loading={saving}>Registrar</Button></div>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <div><Label required>Resultado</Label><Input value={nueva.resultado} onChange={e=>setNueva({...nueva, resultado:e.target.value})} placeholder="Ej. Cumple con lo planificado"/></div>
            <div><Label>Observaciones</Label><Textarea rows={2} value={nueva.observaciones} onChange={e=>setNueva({...nueva, observaciones:e.target.value})} placeholder="Hallazgos, acuerdos, pendientes..."/></div>
          </div>
          {msg && <div className="mt-3"><Alert variant={msg.type==='ok'?'success':'error'} className="text-xs">{msg.text}</Alert></div>}
          {proyectos.length===0 && <div className="mt-3"><Alert variant="warning" className="text-xs">No se encontraron proyectos disponibles para tu usuario.</Alert></div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle><TrendingUp size={16}/> Calendario de monitoreo</CardTitle>
          <p className="text-xs text-slate-500">Cada registro guarda fecha_monitoreo, resultado, avance y observaciones.</p>
        </CardHeader>
        <CardContent>
          {loading ? <div className="space-y-2"><Skeleton className="h-16 w-full"/><Skeleton className="h-16 w-full"/></div> :
          error ? <Alert variant="error" className="text-xs"><div className="flex items-center justify-between gap-3"><span>{error}</span><Button size="sm" variant="outline" onClick={load}>Reintentar</Button></div></Alert> :
          <div className="space-y-2">
            {reuniones.map(r=>(
              <div key={r.id_monitoreo} className="border border-slate-200 rounded-xl p-4 flex gap-3 items-center flex-wrap">
                <div className="w-12 h-12 rounded-xl bg-undc-700 text-white grid place-items-center text-sm font-bold">{String(r.fecha_monitoreo||'').slice(5,10) || '—'}</div>
                <div className="flex-1 min-w-[200px]">
                  <div className="font-semibold text-sm">{r.fecha_monitoreo? new Date(r.fecha_monitoreo).toLocaleDateString('es-PE') : '—'} · {r.resultado}</div>
                  <div className="text-xs text-slate-500">
                    {r.porcentaje_avance!=null && <span>Avance {r.porcentaje_avance}% · </span>}
                    {r.observaciones || 'Sin observaciones'}
                  </div>
                </div>
                <Link to={`/proyectos/${r.id_proyecto}?tab=evidencias`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50">Ver proyecto <ArrowRight size={12}/></Link>
              </div>
            ))}
            {reuniones.length===0 && <Empty title="Sin monitoreos registrados" description="Registra el primer monitoreo con la fecha y el resultado."/>}
          </div>}
        </CardContent>
      </Card>

      <Card className="bg-undc-700 text-white border-undc-700">
        <CardContent className="pt-4">
          <div className="text-sm"><b>Flujo docente:</b> Registra el monitoreo → el día que te toca sube evidencias en el proyecto y adjunta el informe del estudiante indicando si cumple (asistencia, entregables, justificación).</div>
        </CardContent>
      </Card>
    </div>
  )
}
