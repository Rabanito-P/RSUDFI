import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { CheckCircle, Clock, Eye, AlertTriangle, FileCheck } from 'lucide-react'

export default function DocenteEntregables(){
  const [ents,setEnts]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    api.get('/api/v1/proyectos/1/entregables').then((r:any)=> setEnts(r.data||[])).catch(()=> setEnts([
      {id_entregable:1, nombre:'Perfil de Proyecto (PDF)', orden:1, estado:'APROBADO', id_proyecto:1, proyecto:'RSU-2026-007'},
      {id_entregable:2, nombre:'Informe parcial — San Vicente', orden:2, estado:'SUBIDO', proyecto:'RSU-2026-007', fecha:'2026-05-18'},
      {id_entregable:3, nombre:'Ficha de asistencia 12/05', orden:3, estado:'SUBIDO', proyecto:'RSU-2026-011'},
      {id_entregable:4, nombre:'Evidencia fotográfica', orden:4, estado:'PENDIENTE', proyecto:'RSU-2026-011'},
    ])).finally(()=> setLoading(false))
  },[])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Entregables por verificar"
        subtitle="Revisa los entregables que tus estudiantes han subido y aprueba u observa."
        icon={<FileCheck size={20}/>}
        badge={<span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold">{ents.filter(e=>e.estado==='SUBIDO').length} por verificar</span>}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 text-center"><div className="text-xs text-slate-500">Pendientes</div><div className="text-xl font-black">{ents.filter(e=>e.estado==='PENDIENTE').length}</div></Card>
        <Card className="p-4 text-center border-amber-200 bg-amber-50"><div className="text-xs text-amber-800 font-bold">Por verificar (SUBIDO)</div><div className="text-xl font-black text-amber-700">{ents.filter(e=>e.estado==='SUBIDO').length}</div></Card>
        <Card className="p-4 text-center border-emerald-200 bg-emerald-50"><div className="text-xs text-emerald-700 font-bold">Aprobados</div><div className="text-xl font-black text-emerald-700">{ents.filter(e=>e.estado==='APROBADO').length}</div></Card>
      </div>

      <Card hover>
        <CardHeader>
          <CardTitle><Clock size={16}/> Bandeja de verificación</CardTitle>
          <p className="text-xs text-slate-500">Filtra por proyecto — acción verifica con id_verificador</p>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40 w-full"/> :
            <div className="space-y-2">
              {ents.map(e=>(
                <div key={e.id_entregable} className={`border rounded-xl p-4 flex gap-3 items-center ${e.estado==='SUBIDO'?'bg-amber-50 border-amber-200':'border-slate-200'}`}>
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white grid place-items-center font-bold">{e.orden}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{e.nombre}</div>
                    <div className="text-xs text-slate-500">{e.proyecto} · {e.fecha || 'sin fecha límite'} · ID {e.id_entregable}</div>
                  </div>
                  <Badge color={e.estado==='APROBADO'?'#10b981': e.estado==='SUBIDO'?'#f59e0b': e.estado==='OBSERVADO'?'#ef4444':'#94a3b8'} variant="soft">{e.estado}</Badge>
                  {e.estado==='SUBIDO' ? (
                    <div className="flex gap-1">
                      <Button size="sm" className="bg-undc-700 hover:bg-undc-800">Aprobar</Button>
                      <Button size="sm" variant="outline">Observar</Button>
                      <Button size="sm" variant="ghost"><Eye size={14}/></Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" leftIcon={<Eye size={12}/>}>Ver</Button>
                  )}
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>

      <Card className="bg-undc-700 text-white border-undc-700">
        <CardContent className="pt-5 flex gap-3 items-start">
          <CheckCircle size={18} className="text-white mt-0.5"/>
          <div className="text-sm">
            <b>Flujo:</b> Estudiante sube PDF → SUBIDO → tú apruebas u observas.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
