import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label, Select, Textarea } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'
import { BarChart3, Star, ClipboardCheck, TrendingUp, Award, MessageSquare } from 'lucide-react'

export default function Encuestas(){
  const [preguntas,setPreguntas]=useState<any[]>([])
  const [encs,setEncs]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [form,setForm]=useState({proyecto:'1', benef:'1', fecha:'', modalidad:'PRESENCIAL', comentario:'', respuestas: {} as Record<number,number>})

  useEffect(()=>{
    api.get('/api/v1/catalogos/preguntas-encuesta').then((r:any)=> setPreguntas(r.data||[])).catch(()=> setPreguntas([
      {id_pregunta:1,codigo:'P01', texto_pregunta:'¿Utilidad del proyecto para resolver su necesidad?', dimension:'UTILIDAD', orden:1},
      {id_pregunta:2,codigo:'P02', texto_pregunta:'¿Calidad de las actividades realizadas?', dimension:'CALIDAD', orden:2},
      {id_pregunta:3,codigo:'P03', texto_pregunta:'¿Trato recibido por docentes y estudiantes?', dimension:'TRATO', orden:3},
      {id_pregunta:4,codigo:'P04', texto_pregunta:'¿El proyecto respondió a lo que necesitaba?', dimension:'PERTINENCIA', orden:4},
      {id_pregunta:5,codigo:'P05', texto_pregunta:'¿Recomendaría el proyecto?', dimension:'IMPACTO', orden:5},
      {id_pregunta:6,codigo:'P06', texto_pregunta:'¿Impacto en su vida diaria?', dimension:'IMPACTO', orden:6},
    ]))
    api.get('/api/v1/proyectos/1/encuestas').then((r:any)=> setEncs(r.data||[])).catch(()=> setEncs([
      {id_encuesta_benef:1, id_beneficiario:1, promedio_general:4.3, calificacion_cualitativa:'BUENO', modalidad:'PRESENCIAL', fecha_aplicacion:'2026-05-15', beneficiario:{nombres:'María', apellidos:'Quispe'}},
      {id_encuesta_benef:2, id_beneficiario:2, promedio_general:4.8, calificacion_cualitativa:'MUY_BUENO', modalidad:'PRESENCIAL', fecha_aplicacion:'2026-05-16', beneficiario:{nombres:'José', apellidos:'Flores'}},
    ])).finally(()=> setLoading(false))
  },[])

  const submit = async(e:React.FormEvent)=>{
    e.preventDefault()
    const respuestas = Object.entries(form.respuestas).map(([id,v])=> ({id_pregunta:Number(id), valor_numerico:v}))
    if(respuestas.length===0){ alert('Responde al menos 1 pregunta'); return}
    try{
      await api.post('/api/v1/encuestas/beneficiario', {id_proyecto:Number(form.proyecto), id_beneficiario:Number(form.benef), fecha_aplicacion: form.fecha || new Date().toISOString().slice(0,10), modalidad: form.modalidad, comentario_abierto: form.comentario||undefined, respuestas})
      const r:any= await api.get(`/api/v1/proyectos/${form.proyecto}/encuestas`); setEncs(r.data||encs)
    }catch(ex:any){ alert(ex.message?.slice(0,200) || 'Error — valida beneficiario vinculado')}
  }

  const avg = (n:number)=> {
    if(n>=4.5) return {label:'MUY BUENO', color:'#673AB7'}
    if(n>=3.5) return {label:'BUENO', color:'#4CAF50'}
    if(n>=2.5) return {label:'REGULAR', color:'#FF9800'}
    if(n>=1.5) return {label:'MALO', color:'#FF5722'}
    return {label:'MUY MALO', color:'#9E9E9E'}
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Encuestas"
        subtitle="Registra la satisfacción de los beneficiarios (1 a 5)."
        icon={<BarChart3 size={20}/>}
        badge={<span className="px-2.5 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full text-xs font-bold">{encs.length} encuestas</span>}
      />

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
        <Card hover>
          <CardHeader>
            <CardTitle><ClipboardCheck size={16} className="text-undc-700"/> Aplicar encuesta</CardTitle>
            <p className="text-xs text-slate-500">Selecciona 1 a 5 para cada pregunta. El beneficiario debe estar vinculado al proyecto.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>ID Proyecto</Label><Input value={form.proyecto} onChange={e=>setForm({...form, proyecto:e.target.value})}/></div>
                <div><Label>ID Beneficiario</Label><Input value={form.benef} onChange={e=>setForm({...form, benef:e.target.value})}/></div>
                <div><Label>Modalidad</Label><Select value={form.modalidad} onChange={e=>setForm({...form, modalidad:e.target.value})}><option>PRESENCIAL</option><option>TELEFONICA</option><option>VIRTUAL</option><option>WHATSAPP</option></Select></div>
              </div>
              <div><Label>Fecha aplicación</Label><Input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})}/></div>

              <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                {preguntas.map(p=>(
                  <div key={p.id_pregunta} className="border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center gap-2"><Badge color={p.dimension==='IMPACTO'?'#9C27B0': p.dimension==='UTILIDAD'?'#2196F3':'#009688'} variant="soft">{p.dimension}</Badge><span className="text-xs font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded">{p.codigo}</span></div>
                    <div className="text-sm font-medium mt-1">{p.texto_pregunta}</div>
                    <div className="flex gap-1 mt-2">
                      {[1,2,3,4,5].map(v=>(
                        <button key={v} type="button" onClick={()=> setForm({...form, respuestas:{...form.respuestas, [p.id_pregunta]:v}})}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${form.respuestas[p.id_pregunta]===v?'bg-undc-700 text-white border-undc-700 shadow':'bg-white hover:bg-slate-50 border-slate-200'}`}>
                          {v} · {['Muy malo','Malo','Regular','Bueno','Muy bueno'][v-1]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div><Label>Comentario abierto</Label><Textarea rows={2} value={form.comentario} onChange={e=>setForm({...form, comentario:e.target.value})} placeholder="Sugerencia de mejora..."/></div>
              <Button type="submit" className="w-full bg-undc-700 hover:bg-undc-800">Registrar encuesta</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle><Star size={16} className="text-amber-500"/> Resultados</CardTitle>
              <p className="text-xs text-slate-500">Promedio y calificación por beneficiario</p>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-32 w-full"/> :
                <div className="space-y-2">
                  {encs.map(en=>(
                    <div key={en.id_encuesta_benef} className="border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-undc-700 text-white grid place-items-center font-bold">{en.promedio_general?.toFixed(1)}</div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{en.beneficiario?.nombres} {en.beneficiario?.apellidos} · Benef {en.id_beneficiario}</div>
                        <div className="text-xs text-slate-500">{en.fecha_aplicacion?.slice(0,10)} · {en.modalidad} · <Badge color={avg(en.promedio_general).color} variant="soft">{en.calificacion_cualitativa || avg(en.promedio_general).label}</Badge></div>
                      </div>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(i=> <Star key={i} size={14} className={i<=Math.round(en.promedio_general)? 'fill-amber-400 text-amber-400':'text-slate-200'}/>)}</div>
                    </div>
                  ))}
                  {encs.length===0 && <div className="text-xs text-slate-500 text-center py-6">Aún sin encuestas</div>}
                </div>
              }
            </CardContent>
          </Card>

          <Card className="bg-undc-700 text-white border-undc-700">
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 font-bold"><TrendingUp size={16}/> Resumen</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/15 rounded-xl p-2">Promedio global<div className="font-black text-lg">{encs.length? (encs.reduce((a,c)=>a+c.promedio_general,0)/encs.length).toFixed(2):'—'} /5</div></div>
                <div className="bg-white/15 rounded-xl p-2">Total aplicadas<div className="font-black text-lg">{encs.length}</div></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
