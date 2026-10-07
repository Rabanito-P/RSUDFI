import { useAuth } from '../context/AuthContext'
import { ESTADOS } from '../utils/permissions'
import { CheckCircle, Clock, FileText } from 'lucide-react'

export default function Bandeja(){
  const {user}=useAuth()
  const pendientes = [
    {codigo:'RSU-2026-011', titulo:'Campaña anemia - San Luis', estado:'EN_REVISION_ESCUELA', solicitante:'Ana Quispe (Estudiante)', escuela:'Enfermería', fecha:'10/05/2026'},
    {codigo:'RSU-2026-014', titulo:'Reciclaje comunitario - Quilmaná', estado:'EN_PRIORIZACION_FACULTAD', solicitante:'Carlos Ramos', escuela:'Ing. Sistemas', fecha:'08/05/2026'},
    {codigo:'RSU-2026-009', titulo:'Alfabetización digital', estado:'EN_DICTAMEN_CONSEJO', solicitante:'Mg. Torres', escuela:'Ing. Sistemas', fecha:'05/05/2026'},
  ].filter(p=> {
    const e = ESTADOS.find(x=>x.label.toUpperCase().replace(/ /g,'_')===p.estado || x.codigo===p.estado)
    return e?.actor===user?.rol_actor || user?.rol==='ADMIN'
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">Bandeja de aprobación — {user?.rol_actor}</h1>
        <p className="text-sm text-slate-500">Solo ves proyectos cuyo <b>estado_actual</b> permite transición por tu rol (RSU_Transicion_Estado). Acción: APROBADO / OBSERVADO / RECHAZADO / DEVUELTO</p>
      </div>

      <div className="bg-undc-50 border border-undc-200 rounded-2xl p-3 text-xs">Lane BPMN actual: <b>{ESTADOS.find(e=>e.actor===user?.rol_actor)?.label || '—'}</b> · Si no es tu lane, verás lista vacía (correcto por flujo).</div>

      <div className="grid gap-3">
        {pendientes.length? pendientes.map(p=>(
          <div key={p.codigo} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
            <div className="flex-1">
              <div className="flex gap-2 items-center"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{p.codigo}</span><span className="px-2 py-1 bg-undc-700 text-white rounded-full text-xs font-bold">{p.estado}</span><span className="text-xs text-slate-500">{p.escuela} · {p.fecha}</span></div>
              <div className="font-semibold mt-1">{p.titulo}</div>
              <div className="text-xs text-slate-500">Solicitante: {p.solicitante} · Estado origen según RSU_Estado_Proyecto</div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 bg-undc-700 hover:bg-undc-800 text-white rounded-xl text-sm font-semibold flex items-center gap-1"><CheckCircle size={14}/> Aprobar</button>
              <button className="px-3 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold">Observar</button>
              <button className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm">Ver expediente</button>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <Clock className="mx-auto text-slate-400"/>
            <div className="font-bold mt-2">Sin pendientes para tu rol</div>
            <div className="text-sm text-slate-500">Cuando un proyecto llegue a tu estado, aparecerá aquí. Consulta flujo en Dashboard directivo.</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold flex items-center gap-2"><FileText size={16}/> Resoluciones</h3>
        <p className="text-xs text-slate-500">RSU_Resolucion (APROBACION / CIERRE / CONFORMIDAD_EVALUACION) — emite Consejo Facultad y se adjunta como documento con hash</p>
        <div className="mt-3 text-sm border border-slate-200 rounded-xl p-3">Última: <b>Res. N° 123-2026-UNDC</b> — Aprobación RSU-2026-007 · Consejo Facultad · 01/04/2026</div>
      </div>
    </div>
  )
}
