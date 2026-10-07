import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
export default function EncuestaDocente(){
  const {user}=useAuth()
  const [p,setP]=useState<any>(null)
  const [habilitado,setHabilitado]=useState(false)
  useEffect(()=>{
    if(!user) return
    api.get(`/api/v1/estudiantes/${user.id}/proyectos`).then((r:any)=>{
      const list=r.data||[]
      const proj=list[0]
      setP(proj)
      const finalizado = proj?.estado_actual?.codigo==='CERRADO' || proj?.estado_actual?.codigo==='REPORTADO_SUNEDU' || proj?.porcentaje_avance>=100
      setHabilitado(!!finalizado)
    }).catch(()=>{})
  },[user?.id])
  if(!habilitado) return (
    <div className="space-y-4">
      <h2 className="font-black text-lg">Encuesta docente</h2>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <div className="text-sm text-amber-800">Esta encuesta se habilita <b>solo al finalizar todo el proyecto</b> (cuando el estado sea CERRADO/CONFORME y el progreso 100%).</div>
        <div className="text-xs text-slate-500 mt-2">Proyecto actual: {p?.estado_actual?.nombre || 'Informe Inicial'} — {p?.porcentaje_avance || 0}%</div>
      </div>
    </div>
  )
  return (
    <div className="space-y-4">
      <h2 className="font-black text-lg">Encuesta docente</h2>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-sm text-slate-600">Evalúa a tu docente asesor. Escala 1-5 por dimensión. Proyecto finalizado.</p>
        <div className="mt-4 grid gap-2 text-sm">
          {['Claridad en asesorías','Disponibilidad','Apoyo técnico','Retroalimentación'].map(q=>(
            <div key={q} className="flex justify-between border border-slate-200 rounded-xl p-3"><span>{q}</span><span className="flex gap-1">{[1,2,3,4,5].map(n=><span key={n} className="w-6 h-6 rounded-full border border-slate-300 grid place-items-center text-xs hover:bg-undc-700 hover:text-white cursor-pointer">{n}</span>)}</span></div>
          ))}
        </div>
        <button className="mt-4 px-4 py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Enviar encuesta</button>
      </div>
    </div>
  )
}
