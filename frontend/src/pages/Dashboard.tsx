import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { KPI } from '../types/models'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts'
import { FolderKanban, Users, Wallet, TrendingUp, Award, ArrowUpRight, Building2, GraduationCap, ShieldCheck, Activity } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { Alert } from '../components/ui/Alert'

const FALLBACK: KPI = {
  total_proyectos: 24, proyectos_en_ejecucion: 8, total_beneficiarios: 1240, total_docentes: 45, total_estudiantes: 320,
  presupuesto_aprobado: 185000, presupuesto_ejecutado: 112000, promedio_satisfaccion: 4.2,
  proyectos_por_estado: [
    {estado:'Borrador',total:4,color:'#9E9E9E'},{estado:'En revisión',total:3,color:'#FFC107'},{estado:'Con V°B°',total:2,color:'#FF9800'},
    {estado:'Aprobado',total:5,color:'#4CAF50'},{estado:'En ejecución',total:8,color:'#2196F3'},{estado:'En monitoreo',total:2,color:'#03A9F4'}
  ],
  proyectos_por_facultad: [{facultad:'Ing. Sistemas',total:10},{facultad:'Administración',total:7},{facultad:'Agronomía',total:7}]
}

function normalizeKPI(d:any):KPI{
  if(!d) return FALLBACK
  return {
    total_proyectos: d.total_proyectos ?? 0,
    proyectos_en_ejecucion: d.proyectos_en_ejecucion ?? 0,
    total_beneficiarios: d.total_beneficiarios ?? 0,
    total_docentes: d.total_docentes ?? 0,
    total_estudiantes: d.total_estudiantes ?? 0,
    presupuesto_aprobado: d.presupuesto_aprobado ?? 0,
    presupuesto_ejecutado: d.presupuesto_ejecutado ?? 0,
    promedio_satisfaccion: d.promedio_satisfaccion ?? null,
    proyectos_por_estado: Array.isArray(d.proyectos_por_estado) ? d.proyectos_por_estado : [],
    proyectos_por_facultad: Array.isArray(d.proyectos_por_facultad) ? d.proyectos_por_facultad : [],
  } as KPI
}

export default function Dashboard(){
  const [kpi,setKpi]=useState<KPI|null>(null)
  const [loading,setLoading]=useState(true)
  const [err,setErr]=useState('')

  useEffect(()=>{
    api.get<KPI>('/api/v1/dashboard/kpis').then(r=>{
      const raw:any = (r as any).data ?? r
      // API wrapper returns {success,data,...} but client unwraps; handle both
      const d = (raw && raw.total_proyectos!==undefined) ? raw : (r as any).data
      setKpi(normalizeKPI(d))
    }).catch(e=>{
      setErr(e.message?.slice(0,180) || 'API no disponible — mostrando datos demo')
      setKpi(FALLBACK as any)
    }).finally(()=>setLoading(false))
  },[])

  if(loading) return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-20 w-full"/>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-24"/>)} </div>
      <div className="grid lg:grid-cols-2 gap-6"><Skeleton className="h-[340px]"/><Skeleton className="h-[340px]"/></div>
    </div>
  )
  if(!kpi) return <div className="p-8 text-center text-slate-500">Sin datos</div>

  // defensiva total: nunca null
  const porEstado = Array.isArray((kpi as any).proyectos_por_estado) ? (kpi as any).proyectos_por_estado : []
  const porFacultad = Array.isArray((kpi as any).proyectos_por_facultad) ? (kpi as any).proyectos_por_facultad : []
  const hasEstado = porEstado.length > 0
  const hasFacultad = porFacultad.length > 0
  const pctEjec = kpi.presupuesto_aprobado ? (kpi.presupuesto_ejecutado/kpi.presupuesto_aprobado)*100 : 0
  const cards = [
    {label:'Proyectos totales', value:kpi.total_proyectos, sub:'Registrados RSU', icon:FolderKanban, color:'bg-blue-600', trend:'up' as const},
    {label:'En ejecución', value:kpi.proyectos_en_ejecucion, sub:'Activos campo', icon:Activity, color:'bg-emerald-600', trend:'up' as const},
    {label:'Beneficiarios', value:kpi.total_beneficiarios.toLocaleString(), sub:'Únicos Cañete', icon:Users, color:'bg-amber-500', trend:'up' as const},
    {label:'S/ Aprobado', value:`S/ ${(kpi.presupuesto_aprobado/1000).toFixed(0)}k`, sub: kpi.presupuesto_aprobado.toLocaleString(), icon:Wallet, color:'bg-undc-700'},
    {label:'S/ Ejecutado', value:`S/ ${(kpi.presupuesto_ejecutado/1000).toFixed(0)}k`, sub:`${pctEjec.toFixed(1)}%`, icon:TrendingUp, color:'bg-slate-700'},
    {label:'Satisfacción', value: kpi.promedio_satisfaccion ? `${kpi.promedio_satisfaccion.toFixed(2)} /5` : '—', sub:'Likert P01-P06', icon:Award, color:'bg-violet-600'},
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Panel — Universidad Nacional de Cañete"
        subtitle="Resumen general de tus proyectos y beneficiarios"
        icon={<ShieldCheck size={20}/>}
        badge={<span className="px-2.5 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full text-xs font-bold">Actualizado</span>}
        actions={<a href="/proyectos" className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800">Ver proyectos <ArrowUpRight size={14}/></a>}
      />
      {err && <Alert variant="warning" className="text-xs">{err}</Alert>}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map(c=>(
          <div key={c.label} className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm flex items-center gap-3 hover:shadow-medium hover:-translate-y-0.5 transition-all">
            <div className={`w-11 h-11 rounded-xl grid place-items-center text-white shadow-sm ${c.color}`}><c.icon size={20}/></div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500 leading-none">{c.label}</div>
              <div className="text-[18px] font-extrabold text-slate-900 leading-tight truncate">{c.value}</div>
              <div className="text-xs text-slate-500 leading-none">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card hover>
          <CardHeader>
            <CardTitle><Building2 size={16} className="text-undc-700"/> Proyectos por estado</CardTitle>
            <p className="text-xs text-slate-500">Distribución por estado actual</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {hasEstado ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porEstado} barCategoryGap="18%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                    <XAxis dataKey="estado" tick={{fontSize:11, fill:'#64748b'}} interval={0} angle={-14} dy={10} height={60}/>
                    <YAxis tick={{fontSize:11, fill:'#64748b'}}/>
                    <Tooltip cursor={{fill:'#f8fafc'}} contentStyle={{borderRadius:12, border:'1px solid #e2e8f0'}}/>
                    <Bar dataKey="total" radius={[10,10,0,0]}>
                      {porEstado.map((e:any,i:number)=><Cell key={i} fill={e.color||'#1b5e20'}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full grid place-items-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-slate-200 grid place-items-center mx-auto"><Building2 size={18} className="text-slate-500"/></div>
                    <div className="text-sm font-semibold text-slate-700 mt-2">Sin proyectos por estado</div>
                    <div className="text-xs text-slate-500 max-w-[28ch]">Crea tu primer proyecto para ver el resumen.</div>
                    <a href="/proyectos/nuevo" className="inline-flex mt-3 px-3 py-1.5 bg-undc-700 text-white rounded-xl text-xs font-bold">Crear proyecto</a>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {hasEstado ? porEstado.slice(0,6).map((e:any)=>(
                <span key={e.estado} className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs"><span className="w-2 h-2 rounded-full" style={{background:e.color}}/>{e.estado} · {e.total}</span>
              )) : <span className="text-xs text-slate-400">Sin datos — se mostrará tras registrar proyectos.</span>}
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle><GraduationCap size={16} className="text-undc-700"/> Cobertura por Facultad</CardTitle>
            <p className="text-xs text-slate-500">Distribución de proyectos por unidad académica</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {hasFacultad ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={porFacultad} dataKey="total" nameKey="facultad" cx="50%" cy="45%" outerRadius={98} innerRadius={42} paddingAngle={2} label={({name, percent})=> `${name} ${(percent*100).toFixed(0)}%`}>
                      {porFacultad.map((_:any,i:number)=><Cell key={i} fill={['#1b5e20','#2e7d32','#43a047','#66bb6a','#a5d6a7','#c8e6c9'][i%6]}/>)}
                    </Pie>
                    <Tooltip/>
                    <Legend wrapperStyle={{fontSize:12}}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full grid place-items-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-slate-200 grid place-items-center mx-auto"><GraduationCap size={18} className="text-slate-500"/></div>
                    <div className="text-sm font-semibold text-slate-700 mt-2">Sin cobertura por facultad</div>
                    <div className="text-xs text-slate-500">Distribución aparecerá al registrar proyectos por escuela.</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card hover className="overflow-hidden">
          <CardHeader>
            <CardTitle><Wallet size={16} className="text-undc-700"/> Avance financiero</CardTitle>
            <p className="text-xs text-slate-500">Presupuesto asignado y ejecutado</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Aprobado</span><span className="font-mono font-semibold">S/ {kpi.presupuesto_aprobado.toLocaleString()}</span></div>
              <div className="w-full h-3 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-undc-600 to-undc-700 rounded-full transition-all" style={{width:`${Math.min(100, pctEjec)}%`}}/>
              </div>
              <div className="flex justify-between text-xs mt-1"><span className="text-slate-500">{pctEjec.toFixed(1)}% ejecutado</span><span className="font-semibold">S/ {kpi.presupuesto_ejecutado.toLocaleString()} ejecutado</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5"><div className="text-slate-500">Por ejecutar</div><div className="font-bold">S/ {(kpi.presupuesto_aprobado - kpi.presupuesto_ejecutado).toLocaleString()}</div></div>
              <div className="bg-undc-50 border border-undc-200 rounded-xl p-2.5"><div className="text-undc-700">% ejecutado</div><div className="font-bold text-undc-700">{pctEjec.toFixed(1)}%</div></div>
            </div>
            <Alert variant="info" className="text-xs">Resumen disponible en tus proyectos</Alert>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle><Users size={16} className="text-undc-700"/> Comunidad impactada</CardTitle>
            <p className="text-xs text-slate-500">Beneficiarios únicos · Cañete, Imperial, San Vicente</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight text-undc-700">{kpi.total_beneficiarios.toLocaleString()}</span><span className="text-sm text-slate-500">beneficiarios</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 rounded-xl p-2 border"><div className="font-black text-slate-900">{kpi.total_docentes}</div><div className="text-slate-500">Docentes</div></div>
              <div className="bg-slate-50 rounded-xl p-2 border"><div className="font-black text-slate-900">{kpi.total_estudiantes}</div><div className="text-slate-500">Estudiantes</div></div>
              <div className="bg-undc-50 rounded-xl p-2 border border-undc-200"><div className="font-black text-undc-700">{kpi.total_proyectos}</div><div className="text-slate-500">Proyectos</div></div>
            </div>
            <div className="mt-3 flex gap-1.5 flex-wrap">
              {['Cañete','Imperial','San Vicente','San Luis','Quilmaná'].map(d=><span key={d} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs">{d}</span>)}
            </div>
            <div className="mt-3 text-xs bg-amber-50 border border-amber-200 rounded-xl p-2.5">Cobertura por periodo disponible.</div>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle><Award size={16} className="text-violet-600"/> Satisfacción promedio</CardTitle>
            <p className="text-xs text-slate-500">Escala Likert 1-5 · P01-P06 RSU</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-violet-600">{kpi.promedio_satisfaccion?.toFixed(2) ?? '—'}</span><span className="text-lg font-semibold text-slate-500 mb-1">/ 5</span>
              <span className="ml-auto px-2 py-1 bg-violet-50 border border-violet-200 text-violet-700 rounded-full text-xs font-bold">
                {kpi.promedio_satisfaccion && kpi.promedio_satisfaccion>=4.5? 'MUY BUENO': kpi.promedio_satisfaccion && kpi.promedio_satisfaccion>=3.5? 'BUENO':'REGULAR'}
              </span>
            </div>
            <div className="flex gap-1 mt-3">
              {[1,2,3,4,5].map(i=><div key={i} className={`h-2.5 flex-1 rounded-full transition-all ${i <= Math.round(kpi.promedio_satisfaccion||0) ? 'bg-violet-600 shadow-sm':'bg-slate-200'}`}/>)}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-slate-50 rounded-xl border"><div className="font-bold">P01-P02</div><div className="text-slate-500">Utilidad/Calidad</div></div>
              <div className="text-center p-2 bg-slate-50 rounded-xl border"><div className="font-bold">P03-P04</div><div className="text-slate-500">Trato/Pertinencia</div></div>
              <div className="text-center p-2 bg-violet-50 rounded-xl border border-violet-200"><div className="font-bold text-violet-700">P05-P06</div><div className="text-slate-500">Impacto</div></div>
            </div>
            <div className="text-xs text-slate-500 mt-2">Fuente: encuestas registradas</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-slate-600">¿Necesitas ver el historial completo? Revisa el historial.</span>
          <a href="/api/v1/proyectos/resumen" target="_blank" className="px-3 py-2 bg-undc-700 text-white rounded-xl text-xs font-bold hover:bg-undc-800">Ver resumen</a>
        </CardContent>
      </Card>
    </div>
  )
}
