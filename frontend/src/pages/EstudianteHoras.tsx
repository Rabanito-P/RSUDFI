import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Clock, BookOpen, TrendingUp, Calendar, AlertCircle } from 'lucide-react'

export default function EstudianteHoras(){
  const {user} = useAuth()
  const [proyectos,setProyectos]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [err,setErr]=useState('')

  useEffect(()=>{
    if(!user){ setLoading(false); return }
    api.get(`/api/v1/estudiantes/${user.persona_id}/proyectos`).then((r:any)=>{
      const list=r.data||[]
      setProyectos(list)
      return Promise.all(list.map((p:any)=> api.get(`/api/v1/proyectos/${p.id_proyecto}/actividades`).then((x:any)=>({p, acts:x.data||[]})).catch(()=>({p, acts:[]}))))
    }).then((details:any[])=>{
      if(details) setProyectos(details.map(d=> ({...d.p, _horas: Math.round(d.acts.reduce((acc:number,a:any)=> acc+(a.minutos||0),0)/60*10)/10 })))
    }).catch(()=> setErr('Error al cargar horas')).finally(()=> setLoading(false))
  },[user?.persona_id])

  // Horas reportadas: salen de las actividades de campo ejecutadas.
  const totalHoras = proyectos.reduce((acc,p)=> acc+(p._horas||0),0)
  const actividadesTotal = proyectos.reduce((acc,p)=> acc+(p._actividades||0),0)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mis horas RSU"
        subtitle="Horas acumuladas en actividades de campo. Esta información es la base para tu constancia de horas."
        icon={<Clock size={20}/>}
        badge={<span className="px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-700 rounded-full text-xs font-bold">{proyectos.length} proyectos · {Math.round(totalHoras*10)/10} h</span>}
      />

      {err && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700">{err}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 text-center border-sky-200 bg-sky-50/50">
          <Clock size={20} className="mx-auto text-sky-600"/>
          <div className="text-2xl font-black mt-1">{loading? '…' : `${Math.round(totalHoras*10)/10} h`}</div>
          <div className="text-xs text-slate-500">Horas acumuladas</div>
          <div className="text-xs font-bold text-sky-700 mt-1">RSU_Actividad_Campo</div>
        </Card>
        <Card className="p-5 text-center">
          <BookOpen size={20} className="mx-auto text-undc-700"/>
          <div className="text-2xl font-black mt-1">{proyectos.length}</div>
          <div className="text-xs text-slate-500">Proyectos participados</div>
          <div className="text-xs text-slate-500">líder o miembro del equipo</div>
        </Card>
      </div>

      <Card hover>
        <CardHeader>
          <CardTitle><TrendingUp size={16}/> Detalle por proyecto</CardTitle>
          <p className="text-xs text-slate-500">Horas por actividad de campo (RSU_Actividad_Campo.minutos) sumadas.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="text-sm text-slate-400 text-center py-6">Cargando horas…</div>
          ) : proyectos.length===0 ? (
            <div className="text-sm text-slate-400 text-center py-6">Sin proyectos — tus horas aparecerán al participar en uno.</div>
          ) : proyectos.map(p=>(
            <div key={p.id_proyecto} className="border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
              <div className="w-12 h-12 rounded-xl bg-sky-600 text-white grid place-items-center font-black text-sm">{p._horas||0}h</div>
              <div className="flex-1">
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded">{p.codigo_proyecto}</span>
                  <Badge color={p.estado_actual?.color_ui||'#0ea5e9'} variant="soft">{p.estado_actual?.codigo || '—'}</Badge>
                  <span className="text-xs bg-slate-100 border px-2 py-1 rounded-full">{p.rol_equipo || 'Miembro'}</span>
                </div>
                <div className="font-semibold text-sm mt-1">{p.titulo}</div>
              </div>
              <div className="text-right">
                <div className="font-black">{p._horas||0} h</div>
                <div className="text-xs text-slate-500">acumuladas</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 font-bold"><Calendar size={16}/> Ciclo y validación</div>
        <p className="text-xs text-slate-600 mt-1">
          Cada inscripción valida que tu <b>ciclo_numerico</b> sea mayor o igual al <b>ciclo_minimo_estudiante</b> del tipo de proyecto.
          Por ejemplo, Proyección Social requiere ciclo ≥ 5.
        </p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 font-bold"><AlertCircle size={16} className="text-amber-600"/> Sobre las horas</div>
        <p className="text-xs text-slate-600 mt-1">
          Las horas se calculan sumando la duración de las actividades de campo que registraste con sus evidencias.
          Con ese acumulado puedes solicitar tu constancia de horas.
        </p>
      </Card>
    </div>
  )
}
