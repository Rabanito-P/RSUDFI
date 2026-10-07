import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label, Select } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'
import { Wallet, TrendingUp, ArrowDownRight, ArrowUpRight, Plus, Building2, FileText } from 'lucide-react'

export default function Presupuesto(){
  const [movs,setMovs]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [form,setForm]=useState({proyecto:'1', facultad:'1', tipo:'ASIGNACION', monto:'', fecha:'', obs:''})
  const [kpi,setKpi]=useState({aprob:185000, ejec:112000})

  useEffect(()=>{
    api.get('/api/v1/dashboard/kpis').then((r:any)=> {
      const d:any = r.data ?? {}
      setKpi({aprob: d.presupuesto_aprobado ?? 185000, ejec: d.presupuesto_ejecutado ?? 112000})
    }).catch(()=>{})
    api.get('/api/v1/proyectos/1/presupuesto').then((r:any)=> setMovs(r.data||[])).catch(()=> setMovs([
      {id_movimiento:1, tipo:'ASIGNACION', monto:12000, fecha:'2026-04-01', observaciones:'Resolución Decanal 023-2026'},
      {id_movimiento:2, tipo:'EJECUCION', monto:4500, fecha:'2026-05-10', observaciones:'Compra pecosa EPP y materiales'},
      {id_movimiento:3, tipo:'EJECUCION', monto:2800, fecha:'2026-05-18', observaciones:'Movilidad campo San Vicente'},
    ])).finally(()=> setLoading(false))
  },[])

  const submit = async(e:React.FormEvent)=>{
    e.preventDefault()
    try{
      await api.post('/api/v1/presupuesto/movimientos', {id_proyecto:Number(form.proyecto), id_facultad:Number(form.facultad), tipo: form.tipo, monto: Number(form.monto), fecha: form.fecha || new Date().toISOString().slice(0,10), observaciones: form.obs})
      setForm({...form, monto:'', obs:''}); const r:any=await api.get('/api/v1/proyectos/1/presupuesto'); setMovs(r.data||movs)
    }catch{}
  }

  const pct = kpi.aprob ? (kpi.ejec/kpi.aprob)*100 : 0
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Presupuesto & Vouchers"
        subtitle="Movimientos por facultad — asignaciones y ejecuciones"
        icon={<Wallet size={20}/>}
        badge={<span className="px-2.5 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full text-xs font-bold">{pct.toFixed(1)}% ejecutado</span>}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-undc-600"><div className="text-xs text-slate-500">Aprobado</div><div className="text-xl font-black">S/ {kpi.aprob.toLocaleString()}</div><div className="text-xs text-slate-500 flex items-center gap-1"><Building2 size={12}/> Total institucional</div></Card>
        <Card className="p-4 border-l-4 border-l-emerald-500"><div className="text-xs text-slate-500">Ejecutado</div><div className="text-xl font-black text-emerald-700">S/ {kpi.ejec.toLocaleString()}</div><div className="text-xs text-slate-500">{pct.toFixed(1)}% · Comprobante</div></Card>
        <Card className="p-4 border-l-4 border-l-amber-500"><div className="text-xs text-slate-500">Por ejecutar</div><div className="text-xl font-black">S/ {(kpi.aprob - kpi.ejec).toLocaleString()}</div><div className="text-xs text-amber-700">Saldo disponible</div></Card>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card hover>
          <CardHeader>
            <CardTitle><TrendingUp size={16} className="text-undc-700"/> Registrar movimiento</CardTitle>
            <p className="text-xs text-slate-500">Solo UNIDAD_ABAST / CONSEJO FACULTAD. Requiere sustento documental.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>ID Proyecto</Label><Input value={form.proyecto} onChange={e=>setForm({...form, proyecto:e.target.value})} placeholder="1"/></div>
                <div><Label>ID Facultad</Label><Input value={form.facultad} onChange={e=>setForm({...form, facultad:e.target.value})} placeholder="1"/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tipo</Label><Select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})}><option>ASIGNACION</option><option>EJECUCION</option><option>TRANSFERENCIA</option><option>DEVOLUCION</option></Select></div>
                <div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})}/></div>
              </div>
              <div><Label>Monto (S/)</Label><Input type="number" value={form.monto} onChange={e=>setForm({...form, monto:e.target.value})} placeholder="4500" required/></div>
              <div><Label>Observaciones</Label><Input value={form.obs} onChange={e=>setForm({...form, obs:e.target.value})} placeholder="Detalle pecosa, resolución..."/></div>
              <Button type="submit" leftIcon={<Plus size={14}/>} className="w-full">Registrar movimiento</Button>
              <Alert variant="info" className="text-xs">Valida monto y tipo. Actualiza el monto ejecutado.</Alert>
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
                  <div key={m.id_movimiento} className={`border rounded-xl p-3 flex justify-between items-center ${m.tipo==='ASIGNACION'?'bg-undc-50 border-undc-200': m.tipo==='EJECUCION'?'bg-undc-50 border-undc-200':'bg-slate-50'}`}>
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
