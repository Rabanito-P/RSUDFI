import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
export default function Justificacion(){
  const {user}=useAuth()
  const [p,setP]=useState<any>(null)
  const [showForm,setShowForm]=useState(false)
  const [actividad,setActividad]=useState('')
  const [fecha,setFecha]=useState('')
  const [motivo,setMotivo]=useState('')
  const [file,setFile]=useState<File|null>(null)
  const [msg,setMsg]=useState('')
  const [rows,setRows]=useState<any[]>([
    {id:1, proyecto:'Sistema inteligente...', actividad:'Capacitación intermedia: Validación de prototipos interactivos', fecha:'22/07/2026', estado:'Aprobada'},
  ])
  useEffect(()=>{ if(!user) return; api.get(`/api/v1/estudiantes/${user.id}/proyectos`).then((r:any)=>setP((r.data||[])[0]||null)).catch(()=>{}) },[user?.id])
  const guardar=()=>{
    if(rows.length>=2){ setMsg('Ya alcanzaste el máximo de 2 justificaciones'); return }
    if(!actividad || !fecha || !motivo){ setMsg('Completa actividad, fecha y motivo'); return }
    setRows(r=>[...r, {id:Date.now(), proyecto:p?.titulo || 'Sistema inteligente...', actividad, fecha, estado:'Pendiente'}])
    setMsg('Justificación registrada. Estado: Pendiente.')
    setActividad(''); setFecha(''); setMotivo(''); setFile(null); setShowForm(false)
    setTimeout(()=>setMsg(''),4000)
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h2 className="font-black text-lg">Justificación de Faltas</h2><button onClick={()=>setShowForm(v=>!v)} className="px-3 py-1.5 bg-undc-700 text-white rounded-xl text-sm">{showForm?'Cancelar':'Nueva Justificación'}</button></div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs">
        <div>Proyecto asignado: <b>{p?.titulo||'—'}</b></div>
        <div className="mt-2 font-semibold">Cantidad máxima: Hasta dos (2) actividades programadas. ({rows.length}/2)</div>
        <div className="mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2">Pendiente: puedes modificar/eliminar. Revisado: en validación. Aprobada: sin cambios. Rechazada: sin cambios.</div>
        {msg && <div className="mt-2 text-xs bg-emerald-50 border border-emerald-200 p-2 rounded">{msg}</div>}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={()=>setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-3" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h3 className="font-bold">Nueva Justificación</h3>
              <button onClick={()=>setShowForm(false)} className="w-8 h-8 rounded-full bg-slate-100 grid place-items-center">✕</button>
            </div>
            <div><label className="text-xs font-semibold">Actividad a la que faltaste *</label><input value={actividad} onChange={e=>setActividad(e.target.value)} placeholder="Ej. Capacitación intermedia" className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
            <div><label className="text-xs font-semibold">Fecha de la actividad *</label><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} className="mt-1 w-full max-w-xs px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
            <div><label className="text-xs font-semibold">Motivo *</label><textarea value={motivo} onChange={e=>setMotivo(e.target.value)} rows={3} placeholder="Explica por qué faltaste" className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
            <div><label className="text-xs font-semibold">Evidencia (PDF) *</label><input type="file" accept=".pdf" onChange={e=>setFile(e.target.files?.[0]||null)} className="mt-1 block text-xs w-full"/><div className="text-[11px] text-slate-500 mt-1">PDF máx 32MB — ventana superpuesta.</div></div>
            <div className="flex justify-end gap-2 pt-2"><button onClick={()=>setShowForm(false)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm">Cancelar</button><button onClick={guardar} className="px-4 py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Guardar</button></div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead><tr className="bg-[#0f2b24] text-white"><th className="px-3 py-2">Proyecto</th><th className="px-3 py-2">Actividad</th><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Acciones</th></tr></thead>
          <tbody>{rows.map(r=>(
            <tr key={r.id} className="border-b border-slate-100"><td className="px-3 py-2">{r.proyecto.slice(0,20)}...</td><td className="px-3 py-2">{r.actividad}</td><td className="px-3 py-2">{r.fecha}</td><td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${r.estado==='Aprobada'?'bg-emerald-100 text-emerald-700':r.estado==='Observado'?'bg-amber-100 text-amber-700':r.estado==='Rechazada'?'bg-red-100 text-red-700':'bg-slate-100'}`}>{r.estado}</span></td><td className="px-3 py-2 text-center">{r.estado==='Pendiente' || r.estado==='Observado' ? <button onClick={()=>{setActividad(r.actividad); setFecha(r.fecha); setShowForm(true)}} className="text-undc-700 underline">Editar</button> : '👁️'}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
