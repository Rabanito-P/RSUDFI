import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api, asArray } from '../../api/client'

const MAX_JUSTIF = 2

export default function Justificacion(){
  const {user}=useAuth()
  const [p,setP]=useState<any>(null)
  const [showForm,setShowForm]=useState(false)
  const [actividad,setActividad]=useState('')
  const [fecha,setFecha]=useState('')
  const [horaInicio,setHoraInicio]=useState('')
  const [horaFin,setHoraFin]=useState('')
  const [motivo,setMotivo]=useState('')
  const [file,setFile]=useState<File|null>(null)
  const [msg,setMsg]=useState('')
  const [msgOk,setMsgOk]=useState(true)
  const [rows,setRows]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)

  useEffect(()=>{ if(!user) return; api.get(`/api/v1/estudiantes/${user.persona_id}/proyectos`).then((r:any)=>setP((r.data||[])[0]||null)).catch(()=>{}) },[user?.persona_id])

  // Datos reales desde el backend (sin mocks).
  const cargar = ()=>{
    if(!user) return
    setLoading(true)
    api.get(`/api/v1/estudiantes/${user.persona_id}/justificaciones`)
      .then((r:any)=> setRows(asArray(r.data)))
      .catch(()=> setRows([]))
      .finally(()=> setLoading(false))
  }
  useEffect(()=>{ cargar() },[user?.persona_id])

  const guardar = async()=>{
    if(!actividad.trim()){ setMsg('Indica la actividad a la que faltaste'); setMsgOk(false); return }
    if(!fecha){ setMsg('Indica la fecha de la actividad'); setMsgOk(false); return }
    if(!motivo.trim()){ setMsg('Describe el motivo de la falta'); setMsgOk(false); return }
    if(!file){ setMsg('Adjunta la evidencia en PDF'); setMsgOk(false); return }
    if(!p){ setMsg('No tienes un proyecto activo asignado'); setMsgOk(false); return }
    if(horaFin && horaInicio && horaFin <= horaInicio){ setMsg('La hora de fin debe ser posterior a la de inicio'); setMsgOk(false); return }
    setBusy(true)
    try{
      const fd=new FormData()
      fd.append('id_proyecto', String(p.id_proyecto))
      fd.append('id_estudiante', String(user?.persona_id||''))
      fd.append('id_actividad', String(p.id_proyecto))
      fd.append('fecha_ausencia', fecha)
      if(horaInicio) fd.append('hora_inicio', horaInicio)
      if(horaFin) fd.append('hora_fin', horaFin)
      fd.append('motivo', motivo)
      fd.append('archivo', file)
      await api.upload('/api/v1/justificaciones', fd)
      setMsg('Justificación registrada · Pendiente de revisión'); setMsgOk(true)
      setActividad(''); setFecha(''); setMotivo(''); setHoraInicio(''); setHoraFin(''); setFile(null); setShowForm(false)
      cargar()
    }catch(ex:any){
      setMsg(ex?.message || 'No se pudo registrar la justificación'); setMsgOk(false)
    }finally{ setBusy(false) }
  }

  const alMax = rows.length >= MAX_JUSTIF

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="font-black text-lg">Justificación de Faltas</h2>
        {alMax ? (
          <span className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-xl text-sm font-semibold">Máximo alcanzado ({rows.length}/{MAX_JUSTIF})</span>
        ) : (
          <button onClick={()=>setShowForm(v=>!v)} className="px-3 py-1.5 bg-undc-700 text-white rounded-xl text-sm w-full sm:w-auto">{showForm?'Cancelar':'Nueva Justificación'}</button>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs">
        <div>Proyecto asignado: <b>{p?.titulo||'—'}</b></div>
        <div className="mt-2 font-semibold">Cantidad máxima: Hasta dos (2) actividades programadas. ({rows.length}/{MAX_JUSTIF})</div>
        <div className="mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2">Pendiente: puedes modificar/eliminar. Revisado: en validación. Aprobada: sin cambios. Rechazada: sin cambios.</div>
        {msg && <div className={`mt-2 text-xs p-2 rounded border ${msgOk?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-red-50 border-red-200 text-red-700'}`}>{msg}</div>}
      </div>
      {showForm && !alMax && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={()=>setShowForm(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-3" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h3 className="font-bold">Nueva Justificación</h3>
              <button onClick={()=>setShowForm(false)} className="w-9 h-9 rounded-full bg-slate-100 grid place-items-center shrink-0" aria-label="Cerrar">✕</button>
            </div>
            <div><label className="text-xs font-semibold">Actividad a la que faltaste *</label><input value={actividad} onChange={e=>setActividad(e.target.value)} placeholder="Ej. Capacitación intermedia" className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
            <div><label className="text-xs font-semibold">Fecha de la actividad *</label><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} className="mt-1 w-full max-w-xs px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold">Hora inicio</label><input type="time" value={horaInicio} onChange={e=>setHoraInicio(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
              <div><label className="text-xs font-semibold">Hora fin</label><input type="time" value={horaFin} onChange={e=>setHoraFin(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
            </div>
            <div><label className="text-xs font-semibold">Motivo *</label><textarea value={motivo} onChange={e=>setMotivo(e.target.value)} rows={3} placeholder="Explica por qué faltaste" className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
            <div><label className="text-xs font-semibold">Evidencia (PDF) *</label><input type="file" accept=".pdf" onChange={e=>setFile(e.target.files?.[0]||null)} className="mt-1 block text-xs w-full"/><div className="text-[11px] text-slate-500 mt-1">PDF máx 32MB — se adjunta como sustento.</div></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowForm(false)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm">Cancelar</button>
              <button onClick={guardar} disabled={busy} className="px-4 py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">{busy?'Guardando...':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[620px]">
          <thead><tr className="bg-[#0f2b24] text-white"><th className="px-3 py-2">Proyecto</th><th className="px-3 py-2">Actividad</th><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Acciones</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">Cargando justificaciones…</td></tr>
            : rows.length===0 ? <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">Sin justificaciones registradas</td></tr>
            : rows.map((r:any)=>(<tr key={r.id_justificacion} className="border-b border-slate-100">
              <td className="px-3 py-2">{(r.actividad?.nombre || p?.titulo || '—').slice(0,24)}{(r.actividad?.nombre || p?.titulo || '').length>24?'…':''}</td>
              <td className="px-3 py-2">{r.actividad?.nombre || r.motivo?.slice(0,30) || '—'}</td>
              <td className="px-3 py-2">{r.fecha_ausencia?.slice(0,10) || '—'}</td>
              <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${r.estado==='APROBADO'?'bg-emerald-100 text-emerald-700':r.estado==='OBSERVADO'?'bg-amber-100 text-amber-700':r.estado==='RECHAZADO'?'bg-red-100 text-red-700':r.estado==='REVISADO'?'bg-sky-100 text-sky-700':'bg-slate-100'}`}>{r.estado}</span></td>
              <td className="px-3 py-2 text-center">{r.estado==='PENDIENTE' ? <button onClick={()=>{setMotivo(r.motivo); setFecha(r.fecha_ausencia?.slice(0,10)||''); setShowForm(true)}} className="text-undc-700 underline">Editar</button> : r.id_documento_evidencia ? <a href={api.fileUrl(`/api/v1/documentos/${r.id_documento_evidencia}/archivo`)} target="_blank" rel="noreferrer" className="text-undc-700 underline">Ver PDF</a> : '—'}</td>
            </tr>))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
