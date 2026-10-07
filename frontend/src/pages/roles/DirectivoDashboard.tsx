import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { KPI } from '../../types/models'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from 'recharts'
import { Shield, ClipboardCheck, Wallet, Building2, TrendingUp, Award, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ESTADOS } from '../../utils/permissions'

function normKPI(d:any):KPI{
  return {
    total_proyectos: d?.total_proyectos ?? 0,
    proyectos_en_ejecucion: d?.proyectos_en_ejecucion ?? 0,
    total_beneficiarios: d?.total_beneficiarios ?? 0,
    total_docentes: d?.total_docentes ?? 0,
    total_estudiantes: d?.total_estudiantes ?? 0,
    presupuesto_aprobado: d?.presupuesto_aprobado ?? 0,
    presupuesto_ejecutado: d?.presupuesto_ejecutado ?? 0,
    promedio_satisfaccion: d?.promedio_satisfaccion ?? null,
    proyectos_por_estado: Array.isArray(d?.proyectos_por_estado) ? d.proyectos_por_estado : [],
    proyectos_por_facultad: Array.isArray(d?.proyectos_por_facultad) ? d.proyectos_por_facultad : [],
  } as KPI
}
export default function DirectivoDashboard(){
  const {user} = useAuth()
  const [kpi,setKpi]=useState<KPI|null>(null)
  useEffect(()=>{
    api.get<KPI>('/api/v1/dashboard/kpis').then(r=> setKpi(normKPI((r as any).data ?? r))).catch(()=>setKpi(normKPI({
      total_proyectos:24, proyectos_en_ejecucion:8, total_beneficiarios:1240, total_docentes:45, total_estudiantes:320,
      presupuesto_aprobado: 185000, presupuesto_ejecutado:112000, promedio_satisfaccion:4.2,
      proyectos_por_estado:[{estado:'Borrador',total:4,color:'#9E9E9E'},{estado:'En revisión Escuela',total:3,color:'#FFC107'},{estado:'Con V°B° Escuela',total:2,color:'#FF9800'},{estado:'En priorización Facultad',total:2,color:'#FF5722'},{estado:'Aprobado con Resolución',total:5,color:'#4CAF50'},{estado:'En ejecución',total:8,color:'#2196F3'}],
      proyectos_por_facultad:[{facultad:'Ing. Sistemas',total:10},{facultad:'Administración',total:7},{facultad:'Agronomía',total:7}]
    } as any)))
  },[])

  if(!kpi) return <div className="p-8">Cargando indicadores...</div>
  const porEstado = Array.isArray((kpi as any).proyectos_por_estado) ? (kpi as any).proyectos_por_estado : []
  const porFacultad = Array.isArray((kpi as any).proyectos_por_facultad) ? (kpi as any).proyectos_por_facultad : []

  // bandeja filtrada por rol actual
  const miBandeja = ESTADOS.filter(e=> e.actor===user?.rol_actor).slice(0,3)

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-undc-700 to-slate-800 rounded-[24px] p-6 text-white flex flex-wrap gap-4 justify-between">
        <div>
          <div className="text-sm opacity-80 flex items-center gap-2"><Shield size={16}/> {user?.rol_actor} · {user?.tipo_actor} · {user?.correo}</div>
          <h1 className="text-2xl font-black mt-1">Panel Directivo — Supervisión</h1>
          <p className="text-sm opacity-80 mt-1">Bandeja por estado · Presupuesto y reportes</p>
        </div>
        <div className="flex gap-2 items-start">
          <span className="px-3 py-2 bg-white text-undc-700 rounded-xl text-sm font-bold">{kpi.total_proyectos} proyectos totales</span>
          <span className="px-3 py-2 bg-white/15 rounded-xl text-sm">{kpi.proyectos_en_ejecucion} en ejecución</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="text-xs font-bold text-amber-800 flex items-center gap-1"><ClipboardCheck size={14}/> Mi bandeja ({user?.rol_actor})</div>
          <div className="mt-2 space-y-2">
            {miBandeja.length? miBandeja.map(e=>(
              <div key={e.codigo} className="bg-white rounded-xl border border-amber-200 p-2 flex justify-between items-center text-sm"><span className="font-semibold">{e.label}</span><span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs">{e.orden}</span></div>
            )): <div className="text-xs text-slate-500">Sin pendientes para tu rol en este momento</div>}
          </div>
          <button className="mt-3 w-full py-2 bg-amber-600 text-white rounded-xl text-sm font-bold">Ir a bandeja de aprobación</button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Presupuesto</div>
          <div className="font-black text-lg mt-1">S/ {kpi.presupuesto_aprobado.toLocaleString()} <span className="text-sm font-normal text-slate-500">aprobado</span></div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-2"><div className="h-full bg-undc-600 rounded-full" style={{width:`${(kpi.presupuesto_ejecutado/kpi.presupuesto_aprobado)*100}%`}}/></div>
          <div className="text-xs mt-1">{((kpi.presupuesto_ejecutado/kpi.presupuesto_aprobado)*100).toFixed(1)}% ejecutado — S/ {kpi.presupuesto_ejecutado.toLocaleString()}</div>
          <div className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2">Ver movimientos de asignación y ejecución</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Cobertura</div>
          <div className="font-black text-2xl text-undc-700">{kpi.total_beneficiarios} <span className="text-sm font-normal text-slate-500">beneficiarios</span></div>
          <div className="text-xs text-slate-500">{kpi.total_docentes} docentes · {kpi.total_estudiantes} estudiantes</div>
          <div className="mt-2 flex gap-1.5"><span className="px-2 py-1 bg-slate-100 rounded-lg text-xs">Cañete</span><span className="px-2 py-1 bg-slate-100 rounded-lg text-xs">Imperial</span><span className="px-2 py-1 bg-slate-100 rounded-lg text-xs">San Vicente</span></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold">Proyectos por estado</h3>
          <p className="text-xs text-slate-500">Cada barra es un estado. Tu rol solo ve sus proyectos.</p>
          <div className="h-[280px] mt-3">
            {porEstado.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porEstado}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="estado" tick={{fontSize:10}} interval={0} angle={-14} dy={10} height={60}/>
                  <YAxis/>
                  <Tooltip/>
                  <Bar dataKey="total" radius={[8,8,0,0]}>{porEstado.map((e:any,i:number)=><Cell key={i} fill={e.color||'#1b5e20'}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-xl p-4">Sin datos por estado — crea proyectos.</div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold">Proyectos por Facultad</h3>
          <div className="h-[280px] mt-3">
            {porFacultad.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={porFacultad} dataKey="total" nameKey="facultad" cx="50%" cy="50%" outerRadius={95} label>{porFacultad.map((_:any,i:number)=><Cell key={i} fill={['#1b5e20','#2e7d32','#66bb6a','#a5d6a7','#81c784'][i%5]}/>)}</Pie><Tooltip/></PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-xl p-4">Sin cobertura — registra proyectos por escuela.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold flex items-center gap-2"><TrendingUp size={16}/> Trazabilidad</h3>
          <p className="text-xs text-slate-500 mt-1">Historial — cada cambio con responsable, documento y resolución</p>
          <div className="mt-3 text-sm border border-slate-200 rounded-xl p-3">Último: <b>CON_VB_ESCUELA → EN_PRIORIZACION_FACULTAD</b> por DIR_RS_FACULTAD · APROBADO</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold flex items-center gap-2"><Award size={16}/> Satisfacción</h3>
          <div className="text-3xl font-black text-violet-600 mt-1">{kpi.promedio_satisfaccion?.toFixed(2)} <span className="text-base">/5</span></div>
          <div className="text-xs text-slate-500">P01-P06 Likert</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold flex items-center gap-2"><FileText size={16}/> Reporte</h3>
          <p className="text-xs text-slate-500 mt-1">Resumen de proyectos y cobertura</p>
          <button className="mt-3 w-full py-2 bg-undc-700 text-white rounded-xl text-sm font-bold">Exportar memoria anual</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold">Flujo completo (referencia)</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ESTADOS.map(e=>(
            <span key={e.codigo} className={`px-2 py-1 rounded-full text-xs font-semibold border ${e.actor===user?.rol_actor?'bg-amber-500 text-white border-amber-600':'bg-slate-100 border-slate-200'}`}>{e.orden}. {e.label}</span>
          ))}
        </div>
        <div className="text-xs text-slate-500 mt-2">Resaltado tu rol actual ({user?.rol_actor}). Cada cambio registra origen, destino y responsable.</div>
      </div>
    </div>
  )
}
