import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label, Select } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'
import { Wallet, TrendingUp, ArrowDownRight, ArrowUpRight, Plus, Building2, FileText } from 'lucide-react'

export default function Presupuesto(){
  const { user } = useAuth()
  const [movs,setMovs]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [proyectoId,setProyectoId]=useState<number|null>(null)
  const [form,setForm]=useState({proyecto:'', facultad:'', tipo:'ASIGNACION', monto:'', fecha:'', obs:''})
  const [kpi,setKpi]=useState<{aprob:number; ejec:number}|null>(null)
  const [proyectos,setProyectos]=useState<any[]>([])
  const [facultades,setFacultades]=useState<any[]>([])

  useEffect(()=>{
    if(!user) return
    const endpoint = user.rol === 'ESTUDIANTE'
      ? `/api/v1/estudiantes/${user.persona_id}/proyectos`
      : `/api/v1/docentes/${user.persona_id}/proyectos`
    api.get(endpoint).then((r:any)=> {
      const list = r.data || []
      if (list[0]) setProyectoId(list[0].id_proyecto)
    }).catch(()=>{})
    // Catálogos reales para los selects del formulario (nunca IDs escritos a mano)
    api.get('/api/v1/proyectos?limit=200').then((r:any)=> setProyectos(r.data||[])).catch(()=> setProyectos([]))
    api.get('/api/v1/facultades').then((r:any)=> setFacultades(r.data||[])).catch(()=> setFacultades([]))
  },[user?.persona_id, user?.rol])

  useEffect(()=>{
    if (!proyectoId) return
    api.get('/api/v1/dashboard/kpis').then((r:any)=> {
      const d:any = r.data ?? {}
      setKpi({aprob: d.presupuesto_aprobado ?? 0, ejec: d.presupuesto_ejecutado ?? 0})
    }).catch(()=> setKpi({aprob:0, ejec:0}))
    api.get(`/api/v1/proyectos/${proyectoId}/presupuesto`).then((r:any)=> setMovs(r.data||[])).catch(()=> setMovs([])).finally(()=> setLoading(false))
  },[proyectoId])

  const [msg,setMsg]=useState<{type:'ok'|'err', text:string}|null>(null)
  const [saving,setSaving]=useState(false)

  const submit = async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!form.proyecto){ setMsg({type:'err', text:'Selecciona el proyecto'}); return }
    if(!form.facultad){ setMsg({type:'err', text:'Selecciona la facultad'}); return }
    if(!form.monto || Number(form.monto)<=0){ setMsg({type:'err', text:'El monto debe ser mayor a 0'}); return }
    setSaving(true); setMsg(null)
    try{
      await api.post('/api/v1/presupuesto/movimientos', {id_proyecto:Number(form.proyecto), id_facultad:Number(form.facultad), tipo: form.tipo, monto: Number(form.monto), fecha: form.fecha || new Date().toISOString().slice(0,10), observaciones: form.obs})
      setForm(f=>({...f, monto:'', obs:''}))
      const r:any=await api.get(`/api/v1/proyectos/${form.proyecto}/presupuesto`); setMovs(r.data||[])
      setMsg({type:'ok', text:'Movimiento registrado'})
    }catch(ex:any){
      setMsg({type:'err', text: ex?.message?.slice(0,300) || 'No se pudo registrar el movimiento'})
    }finally{ setSaving(false) }
  }

  const pct = kpi && kpi.aprob ? (kpi.ejec/kpi.aprob)*100 : 0
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Presupuesto & Vouchers"
        subtitle="Movimientos por facultad — asignaciones y ejecuciones"
        icon={<Wallet size={20}/>}
        badge={<span className="px-2.5 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full text-xs font-bold">{pct.toFixed(1)}% ejecutado</span>}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-undc-600"><div className="text-xs text-slate-500">Aprobado</div><div className="text-xl font-black">S/ {kpi ? kpi.aprob.toLocaleString() : '—'}</div><div className="text-xs text-slate-500 flex items-center gap-1"><Building2 size={12}/> Total institucional</div></Card>
        <Card className="p-4 border-l-4 border-l-emerald-500"><div className="text-xs text-slate-500">Ejecutado</div><div className="text-xl font-black text-emerald-700">S/ {kpi ? kpi.ejec.toLocaleString() : '—'}</div><div className="text-xs text-slate-500">{kpi ? `${pct.toFixed(1)}% · Comprobante` : 'Sin datos'}</div></Card>
        <Card className="p-4 border-l-4 border-l-amber-500"><div className="text-xs text-slate-500">Por ejecutar</div><div className="text-xl font-black">S/ {kpi ? (kpi.aprob - kpi.ejec).toLocaleString() : '—'}</div><div className="text-xs text-amber-700">Saldo disponible</div></Card>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card hover>
          <CardHeader>
            <CardTitle><TrendingUp size={16} className="text-undc-700"/> Registrar movimiento</CardTitle>
            <p className="text-xs text-slate-500">Solo UNIDAD_ABAST / CONSEJO FACULTAD. Requiere sustento documental.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label required>Proyecto</Label><Select value={form.proyecto} onChange={e=>setForm({...form, proyecto:e.target.value})}>
                  <option value="">-- seleccionar --</option>
                  {proyectos.map((p:any)=> <option key={p.id_proyecto} value={String(p.id_proyecto)}>{p.codigo_proyecto} — {p.titulo}</option>)}
                </Select></div>
                <div><Label required>Facultad</Label><Select value={form.facultad} onChange={e=>setForm({...form, facultad:e.target.value})}>
                  <option value="">-- seleccionar --</option>
                  {facultades.map((f:any)=> <option key={f.id_facultad} value={String(f.id_facultad)}>{f.nombre}</option>)}
                </Select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Tipo</Label><Select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})}><option>ASIGNACION</option><option>EJECUCION</option><option>TRANSFERENCIA</option><option>DEVOLUCION</option></Select></div>
                <div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})}/></div>
              </div>
              <div><Label>Monto (S/)</Label><Input type="number" value={form.monto} onChange={e=>setForm({...form, monto:e.target.value})} placeholder="4500" required/></div>
              <div><Label>Observaciones</Label><Input value={form.obs} onChange={e=>setForm({...form, obs:e.target.value})} placeholder="Detalle pecosa, resolución..."/></div>
              <Button type="submit" leftIcon={<Plus size={14}/>} className="w-full" loading={saving} disabled={!form.proyecto || !form.facultad}>Registrar movimiento</Button>
              {msg && <Alert variant={msg.type==='ok'?'success':'error'} className="text-xs">{msg.text}</Alert>}
            </form>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle><FileText size={16}/> Movimientos recientes</CardTitle>
            <p className="text-xs text-slate-500">Por proyecto — orden fecha reciente</p>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2"><Skeleton className="h-14 w-full"/><Skeleton className="h-14 w-full"/><Skeleton className="h-14 w-full"/></div> :
              <div className="space-y-2">
                {movs.map(m=>(
                  <div key={m.id_movimiento} className={`border rounded-xl p-3 flex flex-wrap gap-2 justify-between items-center ${m.tipo==='ASIGNACION'?'bg-undc-50 border-undc-200': m.tipo==='EJECUCION'?'bg-undc-50 border-undc-200':'bg-slate-50'}`}>
                    <div>
                      <div className="flex items-center gap-2"><span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${m.tipo==='ASIGNACION'?'bg-undc-700':'bg-undc-700'}`}>{m.tipo}</span><span className="text-xs text-slate-500">{m.fecha?.slice(0,10)}</span></div>
                      <div className="text-sm font-semibold mt-1">S/ {Number(m.monto).toLocaleString()}</div>
                      <div className="text-xs text-slate-500">{m.observaciones}</div>
                    </div>
                    <div className={`${m.tipo==='EJECUCION'?'text-red-600':'text-emerald-600'}`}>{m.tipo==='EJECUCION' ? <ArrowDownRight size={18}/>:<ArrowUpRight size={18}/>}</div>
                  </div>
                ))}
              </div>
            }
            <div className="mt-4 text-xs bg-amber-50 border border-amber-200 rounded-xl p-2.5">Voucher: cada ejecución debe adjuntar comprobante con número de operación y banco.</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle><Wallet size={16}/> Cumplimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-undc-600" style={{width:`${Math.min(100, pct)}%`}}/></div>
          <div className="flex justify-between text-xs text-slate-500 mt-1"><span>0%</span><span>2% mínimo legal</span><span>100%</span></div>
        </CardContent>
      </Card>
    </div>
  )
}
