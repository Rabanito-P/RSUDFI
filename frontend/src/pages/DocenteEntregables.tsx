import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { CheckCircle, Clock, Eye, FileCheck, Download } from 'lucide-react'

const norm = (e?: string)=>{
  if(e==='PENDIENTE') return 'POR_ENVIAR'
  if(e==='REGISTRADO'||e==='SUBIDO') return 'ENVIADO'
  if(e==='CORRECTO') return 'APROBADO'
  return e || 'POR_ENVIAR'
}
const ETIQ: Record<string,string> = { TODOS:'TODOS', POR_ENVIAR:'POR ENVIAR', ENVIADO:'ENVIADO', OBSERVADO:'OBSERVADO', APROBADO:'CORRECTO' }

export default function DocenteEntregables(){
  const {user}=useAuth()
  const [all,setAll]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [accionando,setAccionando]=useState<number|null>(null)
  const [filtro,setFiltro]=useState('ENVIADO')
  const [search,setSearch]=useState('')
  const esFacultad = user?.rol_actor==='DIR_RS_FACULTAD'

  // Carga TODOS los estados una vez: así las 4 tarjetas de conteo son reales
  // y no se recalcen sobre una lista ya filtrada (contadores falsos).
  const cargar = async()=>{
    try{
      const qs = new URLSearchParams({ ...(search? {search}: {}) })
      const r:any=await api.get(`/api/v1/entregables/por-verificar?${qs}`)
      setAll(r.data||[])
    }catch{
      setAll([])
    }
  }
  useEffect(()=>{ cargar().finally(()=> setLoading(false)) },[])
  useEffect(()=>{ const t=setTimeout(cargar,400); return ()=>clearTimeout(t) },[search])

  // Filtro de presentación (cliente): no afecta los conteos de las tarjetas.
  const ents = filtro==='TODOS' ? all : all.filter(e=>norm(e.estado)===filtro)

  const verificar = async(e:any, estado:'APROBADO'|'OBSERVADO')=>{
    if(accionando) return
    let observaciones: string | undefined
    if(estado==='OBSERVADO'){
      observaciones = prompt('Motivo de la observación (obligatorio):') || ''
      if(!observaciones.trim()){ alert('Observar requiere indicar el motivo.'); return }
    }
    setAccionando(e.id_entregable)
    try{
      await api.patch(`/api/v1/entregables/${e.id_entregable}`, { estado, observaciones, id_verificador: user?.persona_id })
      await cargar()
    }catch(err:any){ alert(err.message||'Error al verificar') }
    finally{ setAccionando(null) }
  }

  const counts = (s:string)=> all.filter(e=>norm(e.estado)===s).length

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={esFacultad ? 'Entregables — Oficina RSU Facultad' : 'Entregables por verificar'}
        subtitle={esFacultad ? 'Ves lo ENVIADO de tu facultad: descargas el PDF y lo marcas CORRECTO u OBSERVADO.' : 'Revisa lo ENVIADO por tus estudiantes: aprueba (correcto) u observa con motivo.'}
        icon={<FileCheck size={20}/>}
        badge={<span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold">{counts('ENVIADO')} por verificar</span>}
      />

      <div className="flex flex-wrap gap-2 items-center">
        {['TODOS','ENVIADO','OBSERVADO','APROBADO','POR_ENVIAR'].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${filtro===f?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-600 border-slate-200'}`}>{ETIQ[f]}</button>
        ))}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar proyecto / código..." className="ml-auto text-sm border border-slate-200 rounded-xl px-3 py-1.5 w-64"/>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 text-center"><div className="text-xs text-slate-500">Por enviar</div><div className="text-xl font-black">{counts('POR_ENVIAR')}</div></Card>
        <Card className="p-4 text-center border-sky-200 bg-sky-50"><div className="text-xs text-sky-800 font-bold">Enviados</div><div className="text-xl font-black text-sky-700">{counts('ENVIADO')}</div></Card>
        <Card className="p-4 text-center border-amber-200 bg-amber-50"><div className="text-xs text-amber-800 font-bold">Observados</div><div className="text-xl font-black text-amber-700">{counts('OBSERVADO')}</div></Card>
        <Card className="p-4 text-center border-emerald-200 bg-emerald-50"><div className="text-xs text-emerald-700 font-bold">Correctos</div><div className="text-xl font-black text-emerald-700">{counts('APROBADO')}</div></Card>
      </div>

      <Card hover>
        <CardHeader>
          <CardTitle><Clock size={16}/> Bandeja de verificación</CardTitle>
          <p className="text-xs text-slate-500">ENVIADO → CORRECTO u OBSERVADO (con motivo). OBSERVADO lo corrige el equipo y vuelve a ENVIADO.</p>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40 w-full"/> :
            <div className="space-y-2">
              {ents.length===0 && <div className="text-sm text-slate-500 text-center py-8">Sin entregables en {ETIQ[filtro]}</div>}
              {ents.map(e=>{
                const s = norm(e.estado)
                const pdf = api.fileUrl(e.documento?.url_archivo)
                return (
                <div key={e.id_entregable} className={`border rounded-xl p-4 flex flex-wrap gap-3 items-start sm:items-center ${s==='ENVIADO'?'bg-amber-50 border-amber-200':'border-slate-200'}`}>
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white grid place-items-center font-bold">{e.orden}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{e.nombre}</div>
                    <div className="text-xs text-slate-500">{e.codigo_proyecto || e.proyecto} · {e.proyecto_titulo} · {e.fecha_limite || e.fecha || 'sin fecha límite'} · ID {e.id_entregable}</div>
                    {e.observaciones && <div className="text-xs text-amber-700 mt-0.5">Obs: {e.observaciones}</div>}
                  </div>
                  <Badge color={s==='APROBADO'?'#10b981': s==='ENVIADO'?'#0284c7': s==='OBSERVADO'?'#ef4444':'#94a3b8'} variant="soft">{ETIQ[s]||s}</Badge>
                  {pdf && <a href={pdf} download title="Descargar PDF enviado" className="px-2 py-1.5 bg-red-600 text-white rounded-lg text-xs inline-flex items-center gap-1 hover:bg-red-700"><Download size={12}/>PDF</a>}
                  {s==='ENVIADO' ? (
                    <div className="flex gap-1">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={accionando===e.id_entregable} onClick={()=>verificar(e,'APROBADO')}>Correcto</Button>
                      <Button size="sm" variant="outline" disabled={accionando===e.id_entregable} onClick={()=>verificar(e,'OBSERVADO')}>Observar</Button>
                    </div>
                  ) : s==='OBSERVADO' ? (
                    <span className="text-xs text-amber-700 font-semibold">Esperando corrección del equipo</span>
                  ) : s==='APROBADO' ? (
                    <span className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1"><CheckCircle size={12}/>Correcto</span>
                  ) : (
                    <span className="text-xs text-slate-500">Aún por enviar</span>
                  )}
                  {!pdf && <Button size="sm" variant="ghost"><Eye size={14}/></Button>}
                </div>
              )})}
            </div>
          }
        </CardContent>
      </Card>

      <Card className="bg-undc-700 text-white border-undc-700">
        <CardContent className="pt-5 flex gap-3 items-start">
          <CheckCircle size={18} className="text-white mt-0.5"/>
          <div className="text-sm">
            <b>Flujo:</b> Estudiante envía PDF (POR_ENVIAR → ENVIADO, desactivado) → tú marcas CORRECTO u OBSERVADO con motivo → si es OBSERVADO el equipo usa Actualizar y re-envía.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
