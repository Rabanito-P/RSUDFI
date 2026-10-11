import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
import { FileText, Plus } from 'lucide-react'

export default function Fases(){
  const {user}=useAuth()
  const [p,setP]=useState<any>(null)
  const [entregables,setEntregables]=useState<any[]>([])
  const [err,setErr]=useState('')

  useEffect(()=>{
    if(!user) return
    api.get(`/api/v1/estudiantes/${user.persona_id}/proyectos`).then((r:any)=>{
      const list=r.data||[]
      if(list[0]){
        api.get(`/api/v1/proyectos/${list[0].id_proyecto}`).then((x:any)=>{
          const proj=x.data||list[0]
          setP(proj)
          api.get(`/api/v1/proyectos/${proj.id_proyecto}/entregables`).then((e:any)=> setEntregables(e.data||[])).catch(()=> setEntregables([]))
        }).catch(()=>{ setP(list[0]); setErr('No se pudo cargar el detalle completo') })
      } else setP(null)
    }).catch(()=> setErr('Error al cargar tus proyectos'))
  },[user?.persona_id])

  if(err) return <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">{err}</div>
  if(!p) return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-undc-50 text-undc-700 grid place-items-center mx-auto">
          <FileText size={26}/>
        </div>
        <h2 className="font-bold text-slate-800 mt-3">Aún no tienes proyecto</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Como estudiante proponente puedes crear tu Informe Inicial. Solo necesitas el documento en PDF,
          la planificación de actividades en Excel y registrar tu equipo.
        </p>
        <Link to="/proyectos/nuevo"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-undc-700 text-white rounded-xl text-sm font-bold hover:bg-undc-800">
          <Plus size={16}/> Proponer Informe Inicial
        </Link>
      </div>
    </div>
  )

  const lider = p.estudiante_lider ? `${p.estudiante_lider.nombres||''} ${p.estudiante_lider.apellidos||''}`.trim() : '—'
  const asesor = p.docente_asesor ? `${p.docente_asesor.nombres||''} ${p.docente_asesor.apellidos||''}`.trim() : '—'
  const ficha: [string,string][] = [
    ['Líder', lider],
    ['Semestre', p.semestre || '—'],
    ['Tipología', p.tipo?.nombre || '—'],
    ['Docente Asesor', asesor],
    ['Sector Beneficiados', p.lugar_intervencion || '—'],
    ['Número Beneficiados', p.total_beneficiarios != null ? String(p.total_beneficiarios) : (p.nro_beneficiarios != null ? String(p.nro_beneficiarios) : '—')],
    ['Fecha Inicio', p.fecha_inicio_plan?.slice(0,10) || '—'],
    ['Fecha Fin', p.fecha_fin_plan?.slice(0,10) || '—'],
    ['Estado', p.estado_actual?.nombre || '—'],
  ]

  const completados = entregables.filter(e=> e.estado==='APROBADO').length
  const pct = entregables.length ? Math.round(completados/entregables.length*100) : 0

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h1 className="text-xl font-black text-slate-900">{p.titulo}</h1>
        <div className="text-sm text-slate-500">{p.escuela?.facultad?.nombre||'—'} · {p.escuela?.nombre||'—'} · {p.tipo?.nombre||'—'} · {p.estado_actual?.nombre||'—'}</div>
        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
          {ficha.map(([k,v])=>(
            <div key={k} className="flex gap-2 border-b border-slate-100 py-2"><span className="text-slate-500 min-w-[140px]">{k}</span><span className="font-semibold">{v}</span></div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/ejecucion" className="px-4 py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Ejecutar proyecto</Link>
          <Link to="/modificar-informe" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold">Modificar Informe Inicial</Link>
          <Link to="/solicitud-constancia" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold">Solicitar Constancia</Link>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800"><b>Nota:</b> Si decides desistir de un proyecto aprobado y/o conforme, envía el formato adjunto a <a href="mailto:rsu.serviciosocial@undc.edu.pe" className="underline">rsu.serviciosocial@undc.edu.pe</a> — Retiro de participante / Cambio de asesor / Carta de suspensión en la sección de formatos.</div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
        <div className="flex justify-between text-xs gap-2"><span className="font-bold">Progreso del proyecto</span><span>{completados} / {entregables.length||0} completados</span></div>
        <div className="w-full h-2 bg-slate-100 rounded-full mt-2"><div className="h-full bg-undc-700 rounded-full" style={{width:`${pct}%`}}/></div>
        <div className="overflow-x-auto mt-4 -mx-1 px-1">
        <table className="w-full text-xs border-collapse min-w-[560px]">
          <thead><tr className="bg-[#0f2b24] text-white"><th className="px-2 py-2 text-left">ENTREGA</th><th className="px-2 py-2">FECHA LÍMITE</th><th className="px-2 py-2">ARCHIVO</th><th className="px-2 py-2">HORAS</th><th className="px-2 py-2">ESTADO</th></tr></thead>
          <tbody>
            {entregables.length ? entregables.map(e=>(
              <tr key={e.id_entregable} className="border-b border-slate-100">
                <td className="px-2 py-2 font-medium">{e.nombre}</td>
                <td className="px-2 py-2 text-center">{e.fecha_limite?.slice(0,10) || 'No aplica'}</td>
                <td className="px-2 py-2 text-center">{e.documento?.url_archivo ? <a href={api.fileUrl(e.documento.url_archivo)} target="_blank" rel="noreferrer" className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold">PDF</a> : '—'}</td>
                <td className="px-2 py-2 text-center">{e.horas_asignadas ? `${e.horas_asignadas} horas` : 'No aplica'}</td>
                <td className="px-2 py-2 text-center"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${e.estado==='APROBADO'?'bg-emerald-100 text-emerald-700': e.estado==='OBSERVADO'?'bg-amber-100 text-amber-700': e.estado==='ENVIADO'?'bg-sky-100 text-sky-700':'bg-slate-100 text-slate-600'}`}>{e.estado}</span></td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="px-2 py-6 text-center text-slate-400">Sin entregables registrados para este proyecto</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
