import { useEffect, useState } from 'react'
import { Users, Clock, CheckCircle, ClipboardList, BarChart3 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'

// El backend puede devolver el estado como string o como objeto
// RSU_Estado_Proyecto; React no renderiza objetos como hijo.
function nombreEstado(v: any): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  return v.nombre || v.codigo || ''
}

export default function DocenteDashboard(){
  const {user} = useAuth()
  const [proyectos,setProyectos]=useState<any[]>([])
  const [docente,setDocente]=useState<any>(null)
  const [actividades,setActividades]=useState<any[]>([])
  const [entregables,setEntregables]=useState<any[]>([])
  const [monitoreos,setMonitoreos]=useState<any[]>([])
  const [err,setErr]=useState('')

  useEffect(()=>{
    if(!user) return
    api.get(`/api/v1/docentes/${user.persona_id}/proyectos`).then((r:any)=> setProyectos(r.data||[])).catch(()=> setProyectos([]))
    api.get(`/api/v1/docentes/${user.persona_id}`).then((r:any)=> setDocente(r.data||null)).catch(()=> setDocente(null))
    api.get('/api/v1/entregables/por-verificar').then((r:any)=> setEntregables(r.data||[])).catch(()=> setEntregables([]))
  },[user?.persona_id])

  useEffect(()=>{
    const p = proyectos[0]
    if(!p) return
    api.get(`/api/v1/proyectos/${p.id_proyecto}/actividades`).then((r:any)=> setActividades(r.data||[])).catch(()=> setActividades([]))
    api.get(`/api/v1/proyectos/${p.id_proyecto}/monitoreos`).then((r:any)=> setMonitoreos(r.data||[])).catch(()=> setMonitoreos([]))
  },[proyectos])

  const ahora = new Date().toISOString().slice(0,10)
  const pendientes = actividades.filter(a=> a.estado!=='EJECUTADA' && a.fecha_programada >= ahora)
  const porVerificar = entregables.filter(e=> e.estado==='ENVIADO')
  const enEjec = proyectos.filter(p=> p.estado_actual?.codigo==='EN_EJECUCION').length

  // Carga no lectiva real (Art.79/86 Ley 30220), calculada por el backend.
  const cargaMax = docente?.carga_no_lectiva_max ?? 0
  const cargaUsada = docente?.horas_asignadas_total ?? 0
  const cargaDisponible = docente?.carga_disponible ?? cargaMax - cargaUsada
  const excede = docente?.excede_carga_max ?? cargaUsada > cargaMax
  const pctCarga = cargaMax > 0 ? Math.round((cargaUsada / cargaMax) * 100) : 0

  return (
    <div className="space-y-6">
      {err && <Alert variant="error">{err}</Alert>}

      <div className="bg-gradient-to-r from-undc-700 to-undc-900 rounded-[24px] p-5 sm:p-6 text-white">
        <div className="text-sm opacity-80">{user?.nombre || user?.correo} · {user?.rol_actor}</div>
        <h1 className="text-xl sm:text-2xl font-black mt-1">Panel Docente</h1>
        <p className="text-sm opacity-90 mt-1">Tus proyectos asesorados</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 flex items-center gap-1"><Clock size={14}/> Carga no lectiva (Art.79/86)</div>
          <div className="font-black text-xl mt-1">
            {cargaUsada} <span className="text-sm font-normal text-slate-400">/ {cargaMax} h</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${excede ? 'bg-red-500' : pctCarga > 75 ? 'bg-amber-500' : 'bg-emerald-600'}`}
              style={{width:`${Math.min(100, pctCarga)}%`}}
            />
          </div>
          <div className={`text-xs mt-1 font-semibold ${excede ? 'text-red-600' : 'text-slate-500'}`}>
            {excede
              ? `Excede el tope por ${(cargaUsada - cargaMax).toFixed(1)} h`
              : `Disponible: ${cargaDisponible.toFixed(1)} h`}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-xs text-slate-500">Proyectos asesorados</div><div className="font-black text-xl">{proyectos.length}</div><div className="text-xs text-slate-500">{enEjec} en ejecución</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-xs text-slate-500">Entregables por verificar</div><div className="font-black text-xl">{porVerificar.length}</div><div className="text-xs text-slate-500">ENVIADO por equipos</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-xs text-slate-500">Actividades próximas</div><div className="font-black text-xl">{pendientes.length}</div><div className="text-xs text-slate-500">Programadas por ejecutar</div></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <h3 className="font-bold flex items-center gap-2"><Users size={16}/> Proyectos bajo mi asesoría</h3>
          <p className="text-xs text-slate-500">Solo ves proyectos donde eres asesor / supervisor.</p>
          <div className="mt-4 space-y-3">
            {proyectos.length===0 ? (
              <div className="text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">Aún no tienes proyectos asignados como asesor.<br/><span className="text-xs">Te aparecerán aquí cuando un estudiante te seleccione o te asignen carga.</span></div>
            ) : proyectos.map((p:any)=>(
              <div key={p.id_proyecto || p.codigo} className="border border-slate-200 rounded-2xl p-4">
                <div className="flex gap-2 items-center"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{p.codigo_proyecto || p.codigo}</span><span className="text-xs px-2 py-1 rounded-full text-white font-semibold" style={{background:p.estado_actual?.color_ui || p.color || '#1b5e20'}}>{nombreEstado(p.estado_actual) || nombreEstado(p.estado)}</span></div>
                <div className="font-semibold mt-1">{p.titulo}</div>
                <div className="text-xs text-slate-500 mt-1">{p.escuela?.nombre || ''} · {p.tipo?.nombre || ''}</div>
                <div className="flex gap-2 mt-3">
                  <Link to={`/proyectos/${p.id_proyecto}`} className="px-3 py-1.5 bg-undc-700 text-white rounded-xl text-xs font-semibold">Ver expediente</Link>
                  <Link to={`/proyectos/${p.id_proyecto}?tab=evidencias`} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs">Evidencias</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <h3 className="font-bold flex items-center gap-2"><ClipboardList size={16}/> Actividades próximas por ejecutar</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {pendientes.length===0 ? (
                <li className="text-xs text-slate-500 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">Sin actividades programadas próximas</li>
              ) : pendientes.slice(0,5).map(a=>(
                <li key={a.id_actividad} className="border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2 justify-between">
                  <div><div className="font-semibold">{a.nombre}</div><div className="text-xs text-slate-500">{a.fecha_programada?.slice(0,10) || ''} · {a.lugar || 'Sin lugar'}</div></div>
                  <span className="h-fit px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">{a.estado}</span>
                </li>
              ))}
            </ul>
            {proyectos[0] && <Link to={`/proyectos/${proyectos[0].id_proyecto}?tab=evidencias`} className="mt-3 block w-full py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold text-center">+ Programar actividad</Link>}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <h3 className="font-bold flex items-center gap-2"><CheckCircle size={16}/> Entregables por verificar</h3>
            {porVerificar.length===0 ? (
              <div className="text-xs text-slate-500 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center mt-2">Sin entregables ENVIADOS por verificar</div>
            ) : (
              <ul className="mt-2 text-sm space-y-2">
                {porVerificar.slice(0,6).map(e=>(
                  <li key={e.id_entregable} className="flex flex-wrap gap-2 justify-between items-center border border-amber-200 bg-amber-50 rounded-xl p-3">
                    <span>{e.nombre} — {(e as any).codigo_proyecto || ''}</span>
                    <Link to="/docente/entregables" className="px-2 py-1 bg-amber-500 text-white rounded-full text-xs">Verificar</Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 text-xs bg-emerald-50 border border-emerald-200 rounded-xl p-2">Al verificar cambia a APROBADO / OBSERVADO</div>
            <Link to="/docente/entregables" className="mt-2 inline-block text-xs font-semibold text-undc-700">Ir a verificación de entregables →</Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <h3 className="font-bold flex items-center gap-2"><BarChart3 size={16}/> Monitoreo reciente</h3>
            {monitoreos.length===0 ? (
              <div className="text-xs text-slate-500 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center mt-2">Sin monitoreos registrados</div>
            ) : (
              <div className="text-sm border border-slate-200 rounded-xl p-3 mt-2">
                Monitoreo · {monitoreos[0].fecha_monitoreo?.slice(0,10) || monitoreos[0].fecha_monitoreo} · {monitoreos[0].porcentaje_avance ?? 0}% avance · {monitoreos[0].resultado || ''}
                {monitoreos[0].docente?.nombres && <span className="text-xs text-slate-500"> · Registrado por {monitoreos[0].docente.nombres} {monitoreos[0].docente.apellidos||''}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
