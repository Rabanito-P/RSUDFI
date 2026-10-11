import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, asArray } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'
import { Wallet, Clock, AlertTriangle, CheckCircle, BookOpen, ArrowRight } from 'lucide-react'

type Row = {
  id_asignacion:number
  id_proyecto:number
  codigo:string
  titulo:string
  estado_proyecto:string
  horas:number
  tipo:string
  estado:string
  id_ciclo:number
}

// El backend devuelve el estado del proyecto a veces como string y a veces como
// objeto RSU_Estado_Proyecto ({id_estado, codigo, nombre, ...}). React no puede
// renderizar un objeto como hijo, así que se normaliza a texto.
function nombreEstado(v: any): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  return v.nombre || v.codigo || ''
}

export default function DocenteCarga(){
  const {user} = useAuth()
  const [maxHoras,setMaxHoras]=useState(0)
  const [rows,setRows]=useState<Row[]>([])
  const [ciclo,setCiclo]=useState('')
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')

  const load = async()=>{
    if(!user?.persona_id) return
    setLoading(true); setError('')
    try{
      const [docR, projR, cicR] = await Promise.all([
        api.get(`/api/v1/docentes/${user.persona_id}`),
        api.get(`/api/v1/docentes/${user.persona_id}/proyectos?limit=50`),
        api.get('/api/v1/ciclos').catch(()=>({data:[]}))
      ])
      const doc:any = docR.data ?? docR
      setMaxHoras(Number(doc?.carga_no_lectiva_max ?? 0))
      const activo = asArray((cicR as any).data).find((c:any)=> c.activo)
      setCiclo(activo?.nombre ?? '')

      const proyectos = asArray(projR.data)
      const out:Row[] = []
      for(const p of proyectos){
        try{
          const a:any = await api.get(`/api/v1/proyectos/${p.id_proyecto}/docentes`)
          for(const x of asArray(a.data)){
            if(Number(x.id_docente)!==Number(user.persona_id)) continue
            out.push({
              id_asignacion: Number(x.id_asignacion),
              id_proyecto: Number(x.id_proyecto),
              codigo: p.codigo_proyecto ?? `#${p.id_proyecto}`,
              titulo: p.titulo ?? '',
              estado_proyecto: nombreEstado(p.estado ?? p.estado_actual),
              horas: Number(x.horas_asignadas ?? 0),
              tipo: x.tipo_hora ?? 'NO_LECTIVA',
              estado: x.estado_asignacion ?? 'PENDIENTE',
              id_ciclo: Number(x.id_ciclo ?? 0)
            })
          }
        }catch{
          setError(prev=> prev || `No se pudieron cargar las asignaciones del proyecto ${p.codigo_proyecto ?? p.id_proyecto}`)
        }
      }
      out.sort((a,b)=> a.codigo.localeCompare(b.codigo))
      setRows(out)
    }catch(e:any){
      setRows([]); setMaxHoras(0)
      setError(e?.message||'No se pudo cargar tu información de carga docente')
    }finally{ setLoading(false) }
  }
  useEffect(()=>{ load() },[user?.persona_id])

  const aprobadas = rows.filter(r=> r.estado==='APROBADA' && r.tipo==='NO_LECTIVA')
  const total = aprobadas.reduce((s,r)=> s+r.horas, 0)
  const restante = Math.max(0, maxHoras - total)
  const pct = maxHoras>0 ? Math.min(100, Math.round((total/maxHoras)*100)) : 0
  const excede = maxHoras>0 && total>maxHoras
  const activos = rows.filter(r=> !['CERRADO','ANULADO','RECHAZADO'].includes(String(r.estado_proyecto).toUpperCase())).length
  const porEstado = rows.filter(r=> r.estado==='PENDIENTE').length

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mi carga RSU"
        subtitle="Horas asignadas vs carga_no_lectiva_max — validación Art.86 Ley 30220. Fuente: RSU_Asignacion_Docente (APROBADA, NO_LECTIVA)."
        icon={<Wallet size={20}/>}
        badge={<span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold">{maxHoras>0 ? `Límite ${maxHoras}h` : 'Límite sin configurar'}{ciclo? ` · ${ciclo}`:''}</span>}
      />

      {error && <Alert variant="error"><div className="flex items-center justify-between gap-3"><span>{error}</span><Button size="sm" variant="outline" onClick={load}>Reintentar</Button></div></Alert>}

      {loading ? <div className="grid md:grid-cols-3 gap-4"><Skeleton className="h-28"/><Skeleton className="h-28"/><Skeleton className="h-28"/></div> :
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-l-emerald-500">
            <div className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12}/> Asignadas{ciclo? ` ${ciclo}`:''}</div>
            <div className="text-2xl font-black">{total} <span className="text-base font-normal text-slate-500">/ {maxHoras||'—'} h</span></div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className={`h-full ${excede?'bg-red-500':'bg-undc-700'}`} style={{width:`${pct}%`}}/></div>
            <div className={`text-xs mt-1 ${excede?'text-red-600 font-semibold':'text-emerald-700'}`}>
              {excede ? `Excede en ${(total-maxHoras).toFixed(1)}h el límite Art.86` : maxHoras>0 ? `Quedan ${restante.toFixed(1)}h disponibles` : 'Define carga_no_lectiva_max en el perfil'}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-slate-500">Proyectos con tu asignación</div>
            <div className="text-2xl font-black">{rows.length}</div>
            <div className="text-xs text-slate-500">{activos} activos · {porEstado} asignaciones pendientes</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-slate-500">Estado validación</div>
            <div className={`flex items-center gap-1.5 mt-1 font-bold ${excede?'text-red-600':'text-emerald-700'}`}>
              {excede ? <AlertTriangle size={16}/> : <CheckCircle size={16}/>}
              {excede ? 'Excedido' : 'Conforme'}
            </div>
            <div className="text-xs text-slate-500">{excede? 'Corrige antes de asignar más horas':'Sin exceso Art.86'}</div>
          </Card>
        </div>
      }

      <Card hover>
        <CardHeader>
          <CardTitle><BookOpen size={16}/> Detalle asignaciones por proyecto — RSU_Asignacion_Docente</CardTitle>
          <p className="text-xs text-slate-500">Calculado desde las asignaciones reales de cada proyecto que coordines.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? <Skeleton className="h-40 w-full"/> :
            rows.length===0 ? (
              <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-sm text-slate-500">
                Sin asignaciones registradas.
                {error && <div className="mt-1">Corrige el error superior y reintenta.</div>}
              </div>
            ) : rows.map(r=>(
              <div key={r.id_asignacion} className="border border-slate-200 rounded-xl p-3 flex justify-between items-center gap-3 flex-wrap">
                <div>
                  <div className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded-lg inline-block">{r.codigo}</div>
                  <div className="font-semibold text-sm mt-1">{r.titulo || 'Proyecto sin título'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{r.horas}h · {r.tipo} · {r.estado_proyecto || '—'} · Ciclo {r.id_ciclo || '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={r.estado==='APROBADA'?'#10b981': r.estado==='RECHAZADA'?'#ef4444':'#f59e0b'} variant="soft">{r.estado}</Badge>
                  <Link to={`/proyectos/${r.id_proyecto}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50">Ver <ArrowRight size={12}/></Link>
                </div>
              </div>
            ))
          }
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-5 text-sm flex gap-2">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5"/>
          <div>
            <b>Validación backend:</b> Al asignar, el servicio suma <code>SUM(horas_asignadas)</code> donde tipo_hora=NO_LECTIVA y estado_asignacion=APROBADA para el docente en el ciclo. Si excede <b>carga_no_lectiva_max</b>, rechaza con error 400.
            <div className="text-xs text-slate-600 mt-1">Prueba API: <code>POST /api/v1/asignaciones/docente</code> con horas que superen las disponibles.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
