import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
export default function AutorizacionImagen(){
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
    <div className="space-y-4">
      <h2 className="font-black text-lg">Autorización de imagen</h2>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <div className="text-sm text-amber-800">Se habilita solo al finalizar el proyecto.</div>
        <div className="text-xs text-slate-500 mt-1">Estado actual: {p?.estado_actual?.nombre || 'Informe Inicial'}</div>
      </div>
    </div>
  )
  return (
    <div className="space-y-4">
      <h2 className="font-black text-lg">Autorización de imagen</h2>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-sm text-slate-600">Autorizo el uso de mi imagen para difusión del proyecto (proyecto finalizado).</p>
        <div className="mt-4 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
          <div className="text-sm">Sube tu autorización firmada en PDF</div>
          <label className="mt-2 inline-block px-4 py-2 bg-undc-700 text-white rounded-xl text-sm cursor-pointer">Seleccionar PDF<input type="file" accept=".pdf" className="hidden"/></label>
        </div>
      </div>
    </div>
  )
}
