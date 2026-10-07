import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { FileText, Award, Clock, Download, Send, CheckCircle } from 'lucide-react'

export default function EstudianteConstancias(){
  const {user}=useAuth()
  const [p,setP]=useState<any>(null)
  const [habilitado,setHabilitado]=useState(false)
  useEffect(()=>{
    if(!user) return
    api.get(`/api/v1/estudiantes/${user.id}/proyectos`).then((r:any)=>{
      const proj=(r.data||[])[0]
      setP(proj)
      const finalizado = proj?.estado_actual?.codigo==='CERRADO' || proj?.estado_actual?.codigo==='REPORTADO_SUNEDU' || proj?.porcentaje_avance>=100
      setHabilitado(!!finalizado)
    }).catch(()=>{})
  },[user?.id])
  if(!habilitado) return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Solicitud constancia" subtitle="Se habilita solo al finalizar todo el proyecto." icon={<Award size={20}/>} />
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <div className="text-sm text-amber-800">Las constancias se habilitan <b>solo al finalizar</b> (proyecto cerrado y con progreso 100%).</div>
        <div className="text-xs text-slate-500 mt-1">Estado actual: {p?.estado_actual?.nombre || 'Informe Inicial'} — {p?.porcentaje_avance || 0}%</div>
      </div>
    </div>
  )
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Solicitud constancia"
        subtitle="Descarga tus constancias — proyecto finalizado."
        icon={<Award size={20}/>}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card hover className="p-4">
          <FileText size={18} className="text-undc-700"/>
          <div className="font-bold mt-2">Constancia de Participación</div>
          <div className="text-xs text-slate-500 mt-1">Acredita tu participación en el proyecto.</div>
          <Button size="sm" className="mt-3 w-full bg-undc-700 hover:bg-undc-800">Solicitar</Button>
        </Card>
        <Card hover className="p-4">
          <Clock size={18} className="text-undc-700"/>
          <div className="font-bold mt-2">Constancia de Horas</div>
          <div className="text-xs text-slate-500 mt-1">Horas y créditos registrados.</div>
          <Button size="sm" className="mt-3 w-full bg-undc-700 hover:bg-undc-800">Solicitar</Button>
        </Card>
        <Card hover className="p-4">
          <Award size={18} className="text-undc-700"/>
          <div className="font-bold mt-2">Constancia de Culminación</div>
          <div className="text-xs text-slate-500 mt-1">Disponible al finalizar el proyecto.</div>
          <Button size="sm" variant="outline" className="mt-3 w-full border-undc-700 text-undc-700">Solicitar</Button>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle><FileText size={16}/> Mis solicitudes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            {id:1, proyecto:'Taller emprendimiento — RSU-2026-007', fecha:'18/05/2026', estado:'Pendiente', horas:'18h'},
            {id:2, proyecto:'Campaña anemia — RSU-2026-011', fecha:'20/04/2026', estado:'Emitida', horas:'14h', doc:'CONST-2026-012.pdf'},
          ].map(s=>(
            <div key={s.id} className="border border-slate-200 rounded-xl p-4 flex gap-3 items-center">
              <div className={`w-10 h-10 rounded-xl grid place-items-center text-white ${s.estado==='Emitida'?'bg-undc-700':'bg-amber-500'}`}>{s.estado==='Emitida'? <CheckCircle size={18}/>: <Clock size={18}/>}</div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{s.proyecto}</div>
                <div className="text-xs text-slate-500 flex gap-2">{s.fecha} · {s.horas} · <Badge color={s.estado==='Emitida'?'#1b5e20':'#f59e0b'} variant="soft">{s.estado}</Badge></div>
                {s.doc && <div className="text-xs font-mono bg-slate-100 border px-2 py-0.5 rounded inline-block mt-1">{s.doc}</div>}
              </div>
              {s.estado==='Emitida' ? <Button size="sm" leftIcon={<Download size={14}/>}>Descargar</Button> : <Button size="sm" variant="outline" leftIcon={<Send size={14}/>}>Pendiente</Button>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
