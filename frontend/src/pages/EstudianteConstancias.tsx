import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { FileText, Award, Clock, Download, Send, CheckCircle } from 'lucide-react'

const TIPOS = [
  { key:'PARTICIPACION', titulo:'Constancia de Participación', desc:'Acredita tu participación en el proyecto.', icon:<FileText size={18} className="text-undc-700"/> },
  { key:'HORAS', titulo:'Constancia de Horas', desc:'Horas acumuladas registradas.', icon:<Clock size={18} className="text-undc-700"/> },
  { key:'CULMINACION', titulo:'Constancia de Culminación', desc:'Disponible al finalizar el proyecto.', icon:<Award size={18} className="text-undc-700"/> },
]

export default function EstudianteConstancias(){
  const {user}=useAuth()
  const [p,setP]=useState<any>(null)
  const [solicitudes,setSolicitudes]=useState<any[]>([])
  const [habilitado,setHabilitado]=useState(false)
  const [loading,setLoading]=useState(true)
  const [err,setErr]=useState('')
  const [msg,setMsg]=useState('')

  useEffect(()=>{
    if(!user){ setLoading(false); return }
    api.get(`/api/v1/estudiantes/${user.persona_id}/proyectos`).then((r:any)=>{
      const proj=(r.data||[])[0]
      setP(proj)
      setHabilitado(!!(proj?.estado_actual?.codigo==='CERRADO' || proj?.estado_actual?.codigo==='REPORTADO_SUNEDU' || (proj?.porcentaje_avance??0)>=100))
    }).catch(()=> setErr('Error al cargar tu proyecto'))
    api.get(`/api/v1/estudiantes/${user.persona_id}/constancias`).then((r:any)=> setSolicitudes(r.data||[])).catch(()=> setSolicitudes([])).finally(()=> setLoading(false))
  },[user?.persona_id])

  const solicitar = async(tipo:string)=>{
    if(!p){ return }
    setErr(''); setMsg('')
    try{
      await api.post('/api/v1/constancias', {id_proyecto: p.id_proyecto, id_estudiante: user?.persona_id, tipo_constancia: tipo})
      setMsg('Solicitud registrada correctamente')
      const r:any = await api.get(`/api/v1/estudiantes/${user!.persona_id}/constancias`)
      setSolicitudes(r.data||[])
    }catch(ex:any){ setErr(ex.message?.slice(0,200) || 'Error al solicitar') }
  }

  const descargar = (doc:string)=>{ window.open(api.fileUrl(doc), '_blank') }

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
      {err && <Alert variant="error">{err}</Alert>}
      {msg && <Alert variant="success">{msg}</Alert>}

      <div className="grid md:grid-cols-3 gap-4">
        {TIPOS.map(t=>(
          <Card hover key={t.key} className="p-4">
            {t.icon}
            <div className="font-bold mt-2">{t.titulo}</div>
            <div className="text-xs text-slate-500 mt-1">{t.desc}</div>
            <Button size="sm" className="mt-3 w-full bg-undc-700 hover:bg-undc-800" onClick={()=>solicitar(t.key)}>Solicitar</Button>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle><FileText size={16}/> Mis solicitudes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? <div className="text-sm text-slate-400 text-center py-6">Cargando solicitudes…</div> :
           solicitudes.length===0 ? <div className="text-sm text-slate-400 text-center py-6">Sin solicitudes registradas — solicita tu constancia arriba.</div> :
           solicitudes.map(s=>(
            <div key={s.id_solicitud} className="border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
              <div className={`w-10 h-10 rounded-xl grid place-items-center text-white ${s.estado==='EMITIDA'?'bg-undc-700': s.estado==='APROBADA'?'bg-emerald-600':'bg-amber-500'}`}>{s.estado==='EMITIDA'? <CheckCircle size={18}/>: <Clock size={18}/>}</div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{s.proyecto?.titulo || 'Proyecto'} · {s.tipo_constancia}</div>
                <div className="text-xs text-slate-500 flex gap-2">{s.fecha_solicitud?.slice(0,10) || ''} · <Badge color={s.estado==='EMITIDA'?'#1b5e20': s.estado==='APROBADA'?'#10b981':'#f59e0b'} variant="soft">{s.estado}</Badge></div>
              </div>
              {s.estado==='EMITIDA' && s.documento ? <Button size="sm" leftIcon={<Download size={14}/>} onClick={()=>descargar(s.documento.url_archivo)}>Descargar</Button> : <Button size="sm" variant="outline" leftIcon={<Send size={14}/>} disabled>Pendiente</Button>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
