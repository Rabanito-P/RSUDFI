import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label, Select, Textarea } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Alert } from '../components/ui/Alert'
import { CheckCircle, Activity, ShieldCheck, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

export default function Monitoreo(){
  const [reuniones,setReuniones]=useState<any[]>([
    {id:1, fecha:'2026-06-10', lugar:'Campus UNDC - Aula 101', estado:'PROGRAMADA'},
    {id:2, fecha:'2026-07-15', lugar:'Municipalidad Nuevo Imperial', estado:'PROGRAMADA'},
  ])
  const [nueva,setNueva]=useState({fecha:'', lugar:''})
  const [msg,setMsg]=useState('')
  const agregar=()=>{
    if(!nueva.fecha) return
    setReuniones(r=>[...r, {id:Date.now(), fecha:nueva.fecha, lugar:nueva.lugar||'Por definir', estado:'PROGRAMADA'}])
    setMsg('Reunión registrada. El día que te toca podrás subir fotos, encuesta o informe del estudiante.')
    setNueva({fecha:'', lugar:''})
    setTimeout(()=>setMsg(''),3000)
  }
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Monitoreo"
        subtitle="Registra los días de reunión con tus estudiantes. En cada fecha podrás subir evidencias e informes."
        icon={<Activity size={20}/>}
        badge={<span className="px-2.5 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full text-xs font-bold">{reuniones.length} reuniones</span>}
      />

      <Card>
        <CardHeader>
          <CardTitle><Clock size={16} className="text-undc-700"/> Programar reunión</CardTitle>
          <p className="text-xs text-slate-500">Indica cuándo y dónde te reunirás con el grupo.</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
            <div><Label>Fecha</Label><Input type="date" value={nueva.fecha} onChange={e=>setNueva({...nueva, fecha:e.target.value})}/></div>
            <div><Label>Lugar</Label><Input value={nueva.lugar} onChange={e=>setNueva({...nueva, lugar:e.target.value})} placeholder="Ej. Campus, Municipalidad..."/></div>
            <div className="flex items-end"><Button onClick={agregar} className="w-full bg-undc-700">Registrar</Button></div>
          </div>
          {msg && <div className="mt-3 text-xs bg-undc-50 border border-undc-200 text-undc-700 rounded-xl p-2">{msg}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle><TrendingUp size={16}/> Calendario de monitoreo</CardTitle>
          <p className="text-xs text-slate-500">En la fecha programada podrás registrar fotos, encuestas o informes del estudiante.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {reuniones.map(r=>(
              <div key={r.id} className="border border-slate-200 rounded-xl p-4 flex gap-3 items-center">
                <div className="w-12 h-12 rounded-xl bg-undc-700 text-white grid place-items-center text-sm font-bold">{r.fecha.slice(5,10)}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{r.fecha} · {r.lugar}</div>
                  <div className="text-xs text-slate-500">Estado: {r.estado} · El día de la reunión habilita acciones</div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" className="bg-undc-700">Subir fotos</Button>
                  <Button size="sm" variant="outline">Encuesta</Button>
                  <Button size="sm" variant="outline">Informe estudiante</Button>
                </div>
              </div>
            ))}
            {reuniones.length===0 && <div className="text-xs text-slate-500 text-center py-6">Sin reuniones programadas</div>}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-undc-700 text-white border-undc-700">
        <CardContent className="pt-4">
          <div className="text-sm"><b>Flujo docente:</b> Programa la reunión → el día que te toca registra evidencias y sube el informe del estudiante indicando si cumple (asistencia, entregables, justificación).</div>
        </CardContent>
      </Card>
    </div>
  )
}
