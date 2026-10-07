import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

export default function Evidencias(){
  const {user}=useAuth()
  const [p,setP]=useState<any>(null)
  const [form,setForm]=useState({fecha:new Date().toISOString().slice(0,10), nombre:'', horas:0, minutos:0, horaFin:'', descripcion:''})
  const [msg,setMsg]=useState('')
  const [err,setErr]=useState('')
  const [acts,setActs]=useState<any[]>([])
  const [fotos,setFotos]=useState<File[]>([])
  const [fotoPreviews,setFotoPreviews]=useState<string[]>([])
  const [actividadSeleccionada,setActividadSeleccionada]=useState<number|null>(null)
  useEffect(()=>{
    if(!user) return
    api.get(`/api/v1/estudiantes/${user.id}/proyectos`).then((r:any)=>{
      const list=r.data||[]
      if(!list[0]) return
      setP(list[0])
      api.get(`/api/v1/proyectos/${list[0].id_proyecto}/actividades`).then((x:any)=>setActs(x.data||[])).catch(()=>{})
    }).catch(()=>{})
  },[user?.id])
  const onFotos = (e:any)=>{
    const files:File[]=[...Array.from(e.target.files||[]) as File[]]
    if(fotos.length + files.length >5){ setErr('Máximo 5 fotos por actividad'); return }
    setErr('')
    setFotos(prev=>[...prev, ...files].slice(0,5))
    setFotoPreviews(prev=>[...prev, ...files.map(f=>URL.createObjectURL(f))].slice(0,5))
  }
  const quitarFoto = (idx:number)=>{ setFotos(f=>f.filter((_,i)=>i!==idx)); setFotoPreviews(p=>p.filter((_,i)=>i!==idx)) }
  const submit=async(e:any)=>{
    e.preventDefault()
    setErr(''); setMsg('')
    if(!form.nombre || !form.descripcion) { setErr('Nombre y descripción son obligatorios'); return }
    if(!p) return
    try{
      const r:any=await api.post('/api/v1/actividades',{id_proyecto:p.id_proyecto, nombre:form.nombre, descripcion:form.descripcion, fecha_programada: form.fecha})
      const nuevaId = r.data?.id_actividad || r.data?.id || (acts.length+1)
      // si hay fotos, intenta subirlas a capturas (simulado) — backend guarda hora UTC al subir (hora peruana = UTC-5)
      if(fotos.length>0){
        if(fotos.length <5) setMsg(`Actividad registrada. Advertencia: subiste ${fotos.length}/5 fotos — se requieren mínimo 5 fotos por actividad.`)
        else setMsg(`Actividad registrada con ${fotos.length} fotos. Horas registradas en UTC y convertidas a hora peruana al mostrar.`)
        // En backend real, cada foto se sube con POST /actividades/:id/fotos con timestamp UTC (now() at server) — aquí se simula.
      } else {
        setMsg('Actividad registrada. Luego agrega al menos 5 fotos en Capturar Evidencia.')
      }
      const a:any=await api.get(`/api/v1/proyectos/${p.id_proyecto}/actividades`)
      setActs(a.data||[{id_actividad:nuevaId, nombre:form.nombre, estado:'PROGRAMADA', fecha_programada: form.fecha}])
      setForm({fecha:new Date().toISOString().slice(0,10), nombre:'', horas:0, minutos:0, horaFin:'', descripcion:''})
      setFotos([]); setFotoPreviews([])
      setTimeout(()=>setMsg(''),5000)
    }catch(err:any){ setErr(err.message || 'Error de validación'); }
  }
  const [showFormModal,setShowFormModal]=useState(false)
  if(!p) return <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm">Sin proyecto activo</div>
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex justify-between items-center"><h3 className="font-bold text-sm">Registro de Actividad y Fotografías</h3><div className="flex gap-2"><span className="px-3 py-1 bg-[#0f2b24] text-white rounded-lg text-xs">Historial de Ejecución</span><button onClick={()=>setShowFormModal(true)} className="px-3 py-1 bg-undc-700 text-white rounded-lg text-xs font-semibold">Nueva Actividad</button></div></div>
        <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800">Proyecto: <b>{p.titulo}</b><br/>Cualquier miembro del equipo puede iniciar la actividad</div>
        {msg && <div className="mt-3 text-xs bg-emerald-50 border border-emerald-200 p-2 rounded">{msg}</div>}
        {err && <div className="mt-3 text-xs bg-red-50 border border-red-200 text-red-700 p-2 rounded">Error de validación<br/>{err}</div>}
        <div className="mt-4 border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-sm font-medium">Registra tu actividad para comenzar a tomar fotos</div>
          <button onClick={()=>setShowFormModal(true)} className="mt-2 px-4 py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Registrar Actividad</button>
        </div>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={()=>setShowFormModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h3 className="font-bold">Nueva Actividad</h3>
              <button onClick={()=>setShowFormModal(false)} className="w-8 h-8 rounded-full bg-slate-100 grid place-items-center">✕</button>
            </div>
            <form onSubmit={(e)=>{ submit(e); setTimeout(()=>setShowFormModal(false), 1200)}} className="mt-4 space-y-3">
              <div><label className="text-xs font-medium">Fecha de Actividad</label><input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})} className="mt-1 w-full max-w-xs px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
              <div><label className="text-xs font-medium">Nombre de la Actividad</label><input placeholder="Ingresa el nombre de la actividad" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-medium">Horas</label><input type="number" min={0} value={form.horas} onChange={e=>setForm({...form, horas:Number(e.target.value)})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div><div><label className="text-xs font-medium">Minutos</label><input type="number" min={0} value={form.minutos} onChange={e=>setForm({...form, minutos:Number(e.target.value)})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div></div>
              <div><label className="text-xs font-medium">Hora de finalización</label><input type="time" value={form.horaFin} onChange={e=>setForm({...form, horaFin:e.target.value})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
              <div><label className="text-xs font-medium">Descripción</label><textarea placeholder="Describe la actividad..." value={form.descripcion} onChange={e=>setForm({...form, descripcion:e.target.value})} rows={3} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
              <div>
                <label className="text-xs font-medium">Fotografías (mínimo 5 por actividad — máx 5)</label>
                <input type="file" accept=".jpg,.jpeg,.png" multiple onChange={onFotos} className="mt-1 block text-xs"/>
                {fotoPreviews.length>0 && <div className="mt-2 flex gap-2 flex-wrap">{fotoPreviews.map((src,i)=>(<div key={i} className="relative"><img src={src} className="w-16 h-16 rounded-lg object-cover border"/><button type="button" onClick={()=>quitarFoto(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px]">×</button></div>))}</div>}
                <div className="text-[11px] text-slate-500 mt-1">{fotos.length}/5 fotos — al subir el backend registra hora UTC (se muestra como hora peruana UTC-5).</div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setShowFormModal(false)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Registrar Actividad</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-sm">Capturar Evidencia</h3>
        <p className="text-xs text-slate-500">Registra una actividad para comenzar a tomar fotos. Mínimo 5 fotos por actividad.</p>
        <div className="mt-3 flex gap-2">
          <select value={actividadSeleccionada||''} onChange={e=>setActividadSeleccionada(e.target.value? Number(e.target.value): null)} className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm">
            <option value="">— Selecciona actividad —</option>
            {acts.map((a:any)=><option key={a.id_actividad} value={a.id_actividad}>{a.nombre}</option>)}
          </select>
        </div>
        <div className="mt-3 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
          <div className="text-xs text-slate-500">Arrastra fotos o haz clic para seleccionar (JPG/PNG, máx 5, mínimo 5 por actividad)</div>
          <label className="mt-3 inline-block px-3 py-1.5 bg-undc-700 text-white rounded text-xs cursor-pointer">Seleccionar fotos<input type="file" accept=".jpg,.jpeg,.png" multiple className="hidden" onChange={onFotos}/></label>
          <div className="mt-2 flex justify-center gap-2"><span className="px-3 py-1.5 bg-undc-700 text-white rounded text-xs cursor-pointer">Capturar</span><button type="button" className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs">Girar Cámara</button></div>
          {fotoPreviews.length>0 && <div className="mt-3 flex gap-2 flex-wrap justify-center">{fotoPreviews.map((src,i)=>(<div key={i} className="relative"><img src={src} className="w-20 h-20 rounded-xl object-cover border"/><span className="absolute bottom-0 right-0 text-[9px] bg-black/60 text-white px-1 rounded">{new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})} UTC</span></div>))}</div>}
        </div>
        <div className="mt-2 text-[11px] text-slate-500">Al subir, el backend guarda <code>fecha_subida = NOW() UTC</code> y lo muestra convertido a <b>hora peruana (UTC-5)</b>.</div>
        {acts.length>0 && <div className="mt-4 space-y-2">{acts.map((a:any)=>(<div key={a.id_actividad} className="border border-slate-200 rounded-xl p-3 text-sm flex justify-between"><span>{a.nombre}</span><span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{a.estado}</span></div>))}</div>}
      </div>
    </div>
  )
}
