import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

export default function Fases(){
  const {user}=useAuth()
  const [p,setP]=useState<any>(null)
  useEffect(()=>{
    if(!user) return
    api.get(`/api/v1/estudiantes/${user.id}/proyectos`).then((r:any)=>{
      const list=r.data||[]
      if(list[0]) api.get(`/api/v1/proyectos/${list[0].id_proyecto}`).then((x:any)=>setP(x.data||list[0])).catch(()=>setP(list[0]))
      else setP(null)
    }).catch(()=>{})
  },[user?.id])
  if(!p) return <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">No tienes proyecto activo.<br/><Link to="/proyectos/nuevo" className="text-undc-700 font-bold">Proponer Informe Inicial</Link></div>
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h1 className="text-xl font-black text-slate-900">{p.titulo}</h1>
        <div className="text-sm text-slate-500">{p.escuela?.facultad?.nombre} · {p.escuela?.nombre} · {p.tipo?.nombre} · {p.estado_actual?.nombre}</div>
        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
          {[
            ['Líder','KEVIN ANTHONY CAMA SANCHEZ'],
            ['Semestre','2026-1'],
            ['Tipología','Proyección social'],
            ['Docente Asesor','EDWIN ROQUE TITO'],
            ['Sector Beneficiados','Municipalidad Distrital de Nuevo Imperial'],
            ['Número Beneficiados','4'],
            ['Fecha Inicio','13/05/2026'],
            ['Fecha Fin','31/08/2026'],
            ['Estado',p.estado_actual?.nombre || 'Informe Inicial'],
          ].map(([k,v])=>(
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

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex justify-between text-xs"><span className="font-bold">Progreso del proyecto</span><span>5 / 5 completados</span></div>
        <div className="w-full h-2 bg-slate-100 rounded-full mt-2"><div className="h-full bg-undc-700 rounded-full" style={{width:'100%'}}/></div>
        <table className="w-full text-xs mt-4 border-collapse">
          <thead><tr className="bg-[#0f2b24] text-white"><th className="px-2 py-2 text-left">ENTREGA</th><th className="px-2 py-2">EJEMPLARES - GUIAS</th><th className="px-2 py-2">FECHA LÍMITE</th><th className="px-2 py-2">ARCHIVO</th><th className="px-2 py-2">HORAS</th><th className="px-2 py-2">ESTADO</th></tr></thead>
          <tbody>
            {[
              ['PRIMER ENTREGABLE','05/07/2026','22 horas','APROBADO'],
              ['SEGUNDO ENTREGABLE','02/08/2026','16 horas','APROBADO'],
              ['TERCER ENTREGABLE','06/09/2026','22 horas','APROBADO'],
              ['ENCUESTA','No aplica','No Aplica','APROBADO'],
              ['INFORME FINAL','No aplica','No Aplica','APROBADO'],
            ].map(r=>(
              <tr key={r[0]} className="border-b border-slate-100"><td className="px-2 py-2 font-medium">{r[0]}</td><td className="px-2 py-2 text-center"><span className="w-5 h-5 bg-sky-600 text-white rounded inline-grid place-items-center text-[10px]">W</span></td><td className="px-2 py-2 text-center">{r[1]}</td><td className="px-2 py-2 text-center"><span className="w-5 h-5 bg-red-600 text-white rounded inline-grid place-items-center text-[10px]">PDF</span></td><td className="px-2 py-2 text-center">{r[2]}</td><td className="px-2 py-2 text-center"><span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px]">APROBADO</span></td></tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-between text-xs"><span className="font-bold">Proceso de finalización</span><span>3 de 3 completados · 100%</span></div>
        <div className="w-full h-2 bg-slate-100 rounded-full mt-1"><div className="h-full bg-undc-700 rounded-full" style={{width:'100%'}}/></div>
      </div>
    </div>
  )
}
