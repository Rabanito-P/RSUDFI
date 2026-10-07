import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label, Textarea, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Alert } from '../components/ui/Alert'
import { ClipboardList, Calendar, MapPin, Clock, Plus, Camera, Users, CheckCircle2 } from 'lucide-react'

export default function Actividades(){
  const [activs,setActivs]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [form,setForm]=useState({proyecto:'1', nombre:'', lugar:'', fecha:'', desc:''})

  const load = ()=>{
    setLoading(true)
    api.get('/api/v1/proyectos/1/actividades').then((r:any)=> setActivs(r.data||[])).catch(()=> setActivs([
      {id_actividad:1, nombre:'Jornada salud integral — San Vicente', descripcion:'Tamizaje anemia y charla preventiva', fecha_programada:'2026-05-12', lugar:'Posta San Vicente', estado:'PROGRAMADA', nro_beneficiarios:45, minutos:240},
      {id_actividad:2, nombre:'Taller emprendimiento juvenil', descripcion:'Plan de negocio canvas', fecha_programada:'2026-05-18', lugar:'I.E. Imperial', estado:'EJECUTADA', nro_beneficiarios:30},
      {id_actividad:3, nombre:'Campaña reciclaje — Quilmaná', lugar:'Plaza Quilmaná', fecha_programada:'2026-05-20', estado:'PROGRAMADA'},
    ])).finally(()=> setLoading(false))
  }
  useEffect(()=>{ load()},[])

  const submit = async(e:React.FormEvent)=>{
    e.preventDefault()
    try{
      await api.post('/api/v1/actividades', {id_proyecto:Number(form.proyecto), nombre: form.nombre, descripcion: form.desc, fecha_programada: form.fecha||null, lugar: form.lugar})
      setForm({...form, nombre:'', lugar:'', fecha:'', desc:''}); load()
    }catch{}
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Actividades de Campo"
        subtitle="RSU_Actividad_Campo + RSU_Actividad_Foto + RSU_Asistencia_Beneficiario. Programación, ejecución con hora inicio/fin y minutos, lugar, responsable y evidencia fotográfica."
        icon={<ClipboardList size={20}/>}
        badge={<span className="px-2.5 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full text-xs font-bold">{activs.length} actividades</span>}
      />

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card hover>
          <CardHeader>
            <CardTitle><Plus size={16} className="text-undc-700"/> Programar actividad</CardTitle>
            <p className="text-xs text-slate-500">Estado inicial PROGRAMADA · luego EJECUTADA / CANCELADA · Vinculable a entregable</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>ID Proyecto</Label><Input value={form.proyecto} onChange={e=>setForm({...form, proyecto:e.target.value})}/></div>
                <div><Label>Fecha programada</Label><Input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})}/></div>
              </div>
              <div><Label required>Nombre</Label><Input value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} placeholder="Jornada salud — San Vicente" required/></div>
              <div><Label>Lugar</Label><Input value={form.lugar} onChange={e=>setForm({...form, lugar:e.target.value})} placeholder="Posta, I.E., comunidad..."/></div>
              <div><Label>Descripción</Label><Textarea rows={3} value={form.desc} onChange={e=>setForm({...form, desc:e.target.value})} placeholder="Objetivo, metodología, beneficiarios esperados..."/></div>
              <Button type="submit" className="w-full bg-undc-700 hover:bg-undc-800">Programar actividad</Button>
              <Alert variant="info" className="text-xs">Cualquier miembro del equipo (líder o participante ACTIVO) puede registrar — validado por <code>canStudentRegisterActivity</code> en EN_EJECUCION / EN_MONITOREO.</Alert>
            </form>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle><Calendar size={16}/> Próximas actividades</CardTitle>
            <p className="text-xs text-slate-500">Click para ver detalle, fotos y asistencia con firma_url</p>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2"><Skeleton className="h-20"/><Skeleton className="h-20"/></div> :
              <div className="space-y-3">
                {activs.map(a=>(
                  <div key={a.id_actividad} className="border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${a.estado==='EJECUTADA'?'bg-emerald-600': a.estado==='PROGRAMADA'?'bg-amber-500':'bg-slate-400'}`}>{a.estado}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={12}/>{a.fecha_programada?.slice(0,10) || '—'}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/>{a.lugar || '—'}</span>
                    </div>
                    <div className="font-semibold text-slate-900 mt-2">{a.nombre}</div>
                    <div className="text-xs text-slate-500 mt-1">{a.descripcion}</div>
                    <div className="flex gap-2 mt-3 text-xs">
                      <span className="px-2 py-1 bg-slate-50 border rounded-full flex items-center gap-1"><Users size={12}/>{a.nro_beneficiarios||0} benef.</span>
                      {a.minutos ? <span className="px-2 py-1 bg-slate-50 border rounded-full flex items-center gap-1"><Clock size={12}/>{a.minutos} min</span> : null}
                      <span className="px-2 py-1 bg-slate-900 text-white rounded-full flex items-center gap-1"><Camera size={12}/> Fotos</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline">Ver fotos</Button>
                      <Button size="sm" variant="soft">Asistencia</Button>
                      {a.estado==='PROGRAMADA' && <Button size="sm" className="bg-undc-700 hover:bg-undc-800">Marcar ejecutada</Button>}
                    </div>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle><CheckCircle2 size={16}/> Flujo evidencia</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="border rounded-xl p-3 bg-amber-50 border-amber-200"><b>1. PROGRAMADA</b><div className="text-xs text-slate-600 mt-1">Se crea con fecha, lugar y entregable opcional</div></div>
          <div className="border rounded-xl p-3 bg-undc-50 border-undc-200"><b>2. EJECUTADA</b><div className="text-xs text-slate-600 mt-1">Se registra hora inicio/fin, minutos y asistencia con firma_url</div></div>
          <div className="border rounded-xl p-3 bg-emerald-50 border-emerald-200"><b>3. VERIFICADA</b><div className="text-xs text-slate-600 mt-1">Docente verifica + fotos RSU_Actividad_Foto</div></div>
        </CardContent>
      </Card>
    </div>
  )
}
