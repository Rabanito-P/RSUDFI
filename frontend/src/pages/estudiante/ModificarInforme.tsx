import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
import { Link } from 'react-router-dom'

export default function ModificarInforme(){
  const {user}=useAuth()
  const [p,setP]=useState<any>(null)
  const [showForm,setShowForm]=useState(false)
  const [titulo,setTitulo]=useState('')
  const [motivo,setMotivo]=useState('')
  const [file,setFile]=useState<File|null>(null)
  const [msg,setMsg]=useState('')
  const [rows,setRows]=useState<any[]>([
    {id:1, proyecto:'Sistema inteligente... Cañete, 2026', motivo:'Modificación de fechas del cronograma', archivo:'PDF', fecha:'30/07/2026', estado:'Aprobado'},
    {id:2, proyecto:'Sistema inteligente...', motivo:'Actualizar población a 4 funcionarios Área de Rentas...', archivo:'PDF', fecha:'10/06/2026', estado:'Aprobado'},
    {id:3, proyecto:'Sistema inteligente...', motivo:'Actualizar grupo a 1 área: Área de Rentas...', archivo:'PDF', fecha:'08/06/2026', estado:'Observado'},
  ])
  useEffect(()=>{
    if(!user) return
    api.get(`/api/v1/estudiantes/${user.id}/proyectos`).then((r:any)=> setP((r.data||[])[0]||null)).catch(()=>{})
  },[user?.id])
  const guardar=()=>{
    if(!titulo || !motivo) { setMsg('Título y motivo son obligatorios'); return }
    const fecha=new Date().toLocaleDateString('es-PE')
    setRows(r=>[...r, {id:Date.now(), proyecto:p?.titulo || 'Sistema inteligente...', motivo: titulo+' — '+motivo, archivo: file? file.name : 'PDF', fecha, estado:'Pendiente'}])
    setMsg('Solicitud registrada. Estado: Pendiente. Podrás editar mientras esté Pendiente/Observado.')
    setTitulo(''); setMotivo(''); setFile(null); setShowForm(false)
    setTimeout(()=>setMsg(''),4000)
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-lg">Modificación de Informe Inicial</h2>
        <button onClick={()=>setShowForm(v=>!v)} className="px-3 py-1.5 bg-undc-700 text-white rounded-xl text-sm">{showForm?'Cancelar':'Nueva Modificación'}</button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs">
        <div className="font-semibold">Proyecto asignado: {p?.titulo || '—'}</div>
        <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2 leading-tight">
          <b>Instrucciones según estado:</b> Pendiente: puedes modificar/eliminar. Revisado: en proceso de validación. Aprobado: sin cambios. Rechazada: sin cambios. Observado: puedes editar.
        </div>
        {msg && <div className="mt-2 text-xs bg-emerald-50 border border-emerald-200 p-2 rounded">{msg}</div>}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={()=>setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-3" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h3 className="font-bold">Nueva Modificación</h3>
              <button onClick={()=>setShowForm(false)} className="w-8 h-8 rounded-full bg-slate-100 grid place-items-center">✕</button>
            </div>
            <div><label className="text-xs font-semibold">Título de la modificación *</label><input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ej. Cambio de fechas por coordinación municipal" className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
            <div><label className="text-xs font-semibold">Motivo detallado *</label><textarea value={motivo} onChange={e=>setMotivo(e.target.value)} rows={3} placeholder="Describe qué punto del Informe Inicial modificas y por qué" className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
            <div><label className="text-xs font-semibold">Nuevo Informe (PDF) *</label><input type="file" accept=".pdf" onChange={e=>setFile(e.target.files?.[0]||null)} className="mt-1 block text-xs w-full"/><div className="text-[11px] text-slate-500 mt-1">PDF máx 32MB — se sobrepone como ventana modal.</div></div>
            <div className="flex justify-end gap-2 pt-2"><button onClick={()=>setShowForm(false)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm">Cancelar</button><button onClick={guardar} className="px-4 py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Guardar</button></div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead><tr className="bg-[#0f2b24] text-white"><th className="px-3 py-2 text-left">Proyecto</th><th className="px-3 py-2 text-left">Motivos</th><th className="px-3 py-2">Archivo</th><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Acciones</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="border-b border-slate-100"><td className="px-3 py-2">{r.proyecto.slice(0,22)}...</td><td className="px-3 py-2">{r.motivo}</td><td className="px-3 py-2 text-center text-undc-700">{r.archivo.slice(0,10)}</td><td className="px-3 py-2">{r.fecha}</td><td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${r.estado==='Aprobado'?'bg-emerald-100 text-emerald-700':r.estado==='Observado'?'bg-amber-100 text-amber-700':'bg-slate-100'}`}>{r.estado}</span></td><td className="px-3 py-2 text-center">{r.estado==='Pendiente' || r.estado==='Observado' ? <button onClick={()=>{setTitulo(r.motivo); setShowForm(true)}} className="text-undc-700 underline">Editar</button> : '👁️'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
