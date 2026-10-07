import { useEffect, useState } from 'react'
import { Users, Clock, CheckCircle, ClipboardList, BarChart3 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
import { Link } from 'react-router-dom'

export default function DocenteDashboard(){
  const {user} = useAuth()
  const [proyectos,setProyectos]=useState<any[]>([])
  useEffect(()=>{
    if(!user) return
    api.get(`/api/v1/docentes/${user.id}/proyectos`).then((r:any)=> setProyectos(r.data||[])).catch(()=> setProyectos([]))
  },[user?.id])
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-undc-700 to-undc-900 rounded-[24px] p-6 text-white">
        <div className="text-sm opacity-80">{user?.nombre} · {user?.rol_actor}</div>
        <h1 className="text-2xl font-black mt-1">Panel Docente</h1>
        <p className="text-sm opacity-90 mt-1">Tus proyectos asesorados</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-xs text-slate-500 flex items-center gap-1"><Clock size={14}/> Carga no lectiva</div><div className="font-black text-xl mt-1">6.5 / 8 h</div><div className="w-full h-2 bg-slate-100 rounded-full mt-2"><div className="h-full bg-emerald-600 rounded-full" style={{width:'81%'}}/></div><div className="text-xs text-amber-600 mt-1">Quedan 1.5h disponibles</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-xs text-slate-500">Proyectos asesorados</div><div className="font-black text-xl">3</div><div className="text-xs text-slate-500">2 en ejecución</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-xs text-slate-500">Entregables por verificar</div><div className="font-black text-xl">5</div><div className="text-xs text-red-600">2 vencidos</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-xs text-slate-500">Horas asignadas este ciclo</div><div className="font-black text-xl">6.5h</div><div className="text-xs text-slate-500">Asignación aprobada</div></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold flex items-center gap-2"><Users size={16}/> Proyectos bajo mi asesoría</h3>
          <p className="text-xs text-slate-500">Solo ves proyectos donde eres asesor / supervisor.</p>
          <div className="mt-4 space-y-3">
            {proyectos.length===0 ? (
              <div className="text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">Aún no tienes proyectos asignados como asesor.<br/><span className="text-xs">Te aparecerán aquí cuando un estudiante te seleccione o te asignen carga.</span></div>
            ) : proyectos.map((p:any)=>(
              <div key={p.id_proyecto || p.codigo} className="border border-slate-200 rounded-2xl p-4">
                <div className="flex gap-2 items-center"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{p.codigo_proyecto || p.codigo}</span><span className="text-xs px-2 py-1 rounded-full text-white font-semibold" style={{background:p.estado_actual?.color_ui || p.color || '#1b5e20'}}>{p.estado_actual?.nombre || p.estado}</span></div>
                <div className="font-semibold mt-1">{p.titulo}</div>
                <div className="text-xs text-slate-500 mt-1">{p.escuela?.nombre || ''} · {p.tipo?.nombre || ''}</div>
                <div className="flex gap-2 mt-3">
                  <Link to={`/proyectos/${p.id_proyecto}`} className="px-3 py-1.5 bg-undc-700 text-white rounded-xl text-xs font-semibold">Ver expediente</Link>
                  <Link to={`/proyectos/${p.id_proyecto}?tab=evidencias`} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs">Evidencias</Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-undc-50 border border-undc-200 rounded-xl">
            <div className="text-xs font-bold text-undc-700">Informes de estudiantes</div>
            <div className="text-xs text-slate-600 mt-1">Sube un informe por cada estudiante indicando si cumple (avance, asistencia, justificación). Los estudiantes deben entregar evidencias y tú validas.</div>
            <button className="mt-2 w-full py-2 bg-undc-700 text-white rounded-xl text-xs font-semibold">+ Subir informe de estudiante</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold flex items-center gap-2"><ClipboardList size={16}/> Actividades de campo por ejecutar</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="border border-slate-200 rounded-xl p-3 flex justify-between"><div><div className="font-semibold">Jornada salud — San Vicente</div><div className="text-xs text-slate-500">12/05/2026 · 08:00 · 6 beneficiarios esperados</div></div><span className="h-fit px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">PROGRAMADA</span></li>
              <li className="border border-slate-200 rounded-xl p-3 flex justify-between"><div><div className="font-semibold">Capacitación docentes</div><div className="text-xs text-slate-500">15/05/2026 · Aula RSU</div></div><span className="h-fit px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">EN_EJECUCION</span></li>
            </ul>
            <button className="mt-3 w-full py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold">+ Programar actividad</button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold flex items-center gap-2"><CheckCircle size={16}/> Entregables por verificar</h3>
            <ul className="mt-2 text-sm space-y-2">
              <li className="flex justify-between items-center border border-amber-200 bg-amber-50 rounded-xl p-3"><span>Informe parcial — RSU-2026-007</span><span className="px-2 py-1 bg-amber-500 text-white rounded-full text-xs">SUBIDO</span></li>
              <li className="flex justify-between items-center border border-slate-200 rounded-xl p-3"><span>Ficha asistencia — 12/05</span><span className="px-2 py-1 bg-slate-200 rounded-full text-xs">PENDIENTE</span></li>
            </ul>
            <div className="mt-3 text-xs bg-emerald-50 border border-emerald-200 rounded-xl p-2">Al verificar cambia a APROBADO / OBSERVADO / RECHAZADO</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold flex items-center gap-2"><BarChart3 size={16}/> Monitoreo reciente</h3>
            <div className="text-sm border border-slate-200 rounded-xl p-3 mt-2">Monitoreo · 10/05/2026 · 62% avance · CON_OBSERVACIONES · <span className="text-xs text-slate-500">Registrado por {user?.nombre}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
