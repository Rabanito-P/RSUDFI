import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api, asArray } from '../../api/client'
import { Link } from 'react-router-dom'

export default function ModificarInforme(){
  const {user}=useAuth()
  const [p,setP]=useState<any>(null)
  const [showForm,setShowForm]=useState(false)
  const [titulo,setTitulo]=useState('')
  const [motivo,setMotivo]=useState('')
  const [file,setFile]=useState<File|null>(null)
  const [msg,setMsg]=useState('')
  const [msgOk,setMsgOk]=useState(true)
  const [rows,setRows]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  useEffect(()=>{
    if(!user) return
    api.get(`/api/v1/estudiantes/${user.persona_id}/proyectos`).then((r:any)=> setP((r.data||[])[0]||null)).catch(()=>{})
  },[user?.persona_id])

  const cargar=()=>{
    if(!p) return
    setLoading(true)
    api.get(`/api/v1/proyectos/${p.id_proyecto}/modificaciones`)
      .then((r:any)=> setRows(asArray(r.data)))
      .catch(()=> setRows([]))
      .finally(()=> setLoading(false))
  }
  useEffect(()=>{ cargar() },[p?.id_proyecto])

  const guardar = async()=>{
    if(!titulo.trim() || !motivo.trim()){ setMsg('Título y motivo son obligatorios'); setMsgOk(false); return }
    if(!file){ setMsg('Adjunta el nuevo informe en PDF'); setMsgOk(false); return }
    if(!p){ setMsg('No tienes un proyecto activo asignado'); setMsgOk(false); return }
    setBusy(true)
    try{
      const fd=new FormData()
      fd.append('id_proyecto', String(p.id_proyecto))
      fd.append('motivo', titulo.trim()+' — '+motivo.trim())
      fd.append('archivo', file)
      await api.upload('/api/v1/modificaciones-informe', fd)
      setMsg('Solicitud registrada. Estado: PENDIENTE.'); setMsgOk(true)
      setTitulo(''); setMotivo(''); setFile(null); setShowForm(false)
      cargar()
    }catch(ex:any){ setMsg(ex?.message || 'No se pudo registrar la solicitud'); setMsgOk(false) }
    finally{ setBusy(false) }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="font-black text-lg">Modificación de Informe Inicial</h2>
        <button onClick={()=>setShowForm(v=>!v)} className="px-3 py-1.5 bg-undc-700 text-white rounded-xl text-sm w-full sm:w-auto">{showForm?'Cancelar':'Nueva Modificación'}</button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs">
        <div className="font-semibold">Proyecto asignado: {p?.titulo || '—'}</div>
        <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2 leading-tight">
          <b>Instrucciones según estado:</b> Pendiente: puedes modificar/eliminar. Revisado: en proceso de validación. Aprobado: sin cambios. Rechazada: sin cambios. Observado: puedes editar.
        </div>
        {msg && <div className={`mt-2 text-xs p-2 rounded border ${msgOk?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-red-50 border-red-200 text-red-700'}`}>{msg}</div>}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={()=>setShowForm(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-3" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h3 className="font-bold">Nueva Modificación</h3>
              <button onClick={()=>setShowForm(false)} className="w-9 h-9 rounded-full bg-slate-100 grid place-items-center shrink-0" aria-label="Cerrar">✕</button>
            </div>
            <div><label className="text-xs font-semibold">Título de la modificación *</label><input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ej. Cambio de fechas por coordinación municipal" className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
            <div><label className="text-xs font-semibold">Motivo detallado *</label><textarea value={motivo} onChange={e=>setMotivo(e.target.value)} rows={3} placeholder="Describe qué punto del Informe Inicial modificas y por qué" className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
            <div><label className="text-xs font-semibold">Nuevo Informe (PDF) *</label><input type="file" accept=".pdf" onChange={e=>setFile(e.target.files?.[0]||null)} className="mt-1 block text-xs w-full"/><div className="text-[11px] text-slate-500 mt-1">PDF máx 32MB — se adjunta como sustento de la solicitud.</div></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowForm(false)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm">Cancelar</button>
              <button onClick={guardar} disabled={busy} className="px-4 py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">{busy?'Guardando...':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[720px]">
          <thead><tr className="bg-[#0f2b24] text-white"><th className="px-3 py-2 text-left">Proyecto</th><th className="px-3 py-2 text-left">Motivos</th><th className="px-3 py-2">Archivo</th><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Acciones</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">Cargando solicitudes…</td></tr>
            : rows.length===0 ? <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">Sin solicitudes de modificación registradas</td></tr>
            : rows.map((r:any)=>{
              const editable = r.estado==='PENDIENTE' || r.estado==='OBSERVADO'
              return (
              <tr key={r.id_modificacion} className="border-b border-slate-100">
                <td className="px-3 py-2">{(r.proyecto?.titulo || p?.titulo || '—').slice(0,22)}{(r.proyecto?.titulo || p?.titulo || '').length>22?'…':''}</td>
                <td className="px-3 py-2">{r.motivo}</td>
                <td className="px-3 py-2 text-center">{r.id_documento_solicitud ? <a href={api.fileUrl(`/api/v1/documentos/${r.id_documento_solicitud}/archivo`)} target="_blank" rel="noreferrer" className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold">PDF</a> : '—'}</td>
                <td className="px-3 py-2">{r.fecha_solicitud?.slice(0,10) || '—'}</td>
                <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${r.estado==='APROBADO'?'bg-emerald-100 text-emerald-700':r.estado==='OBSERVADO'?'bg-amber-100 text-amber-700':r.estado==='RECHAZADO'?'bg-red-100 text-red-700':r.estado==='REVISADO'?'bg-sky-100 text-sky-700':'bg-slate-100'}`}>{r.estado}</span></td>
                <td className="px-3 py-2 text-center">{editable ? <button onClick={()=>{setTitulo(r.motivo); setShowForm(true)}} className="text-undc-700 underline">Editar</button> : '—'}</td>
              </tr>)
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
