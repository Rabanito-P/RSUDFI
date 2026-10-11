import { useEffect, useState } from 'react'
import { api, asArray } from '../../api/client'
import { KPI } from '../../types/models'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { Shield, ClipboardCheck, Wallet, TrendingUp, Award, FileText, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { rolLegible } from '../../lib/roles'
import { useCatalogoBpmn } from '../../hooks/useCatalogoBpmn'
import { Link } from 'react-router-dom'

function normKPI(d: any): KPI {
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

type Traz = {
  codigo_proyecto: string
  titulo: string
  estado_origen: string
  estado_destino: string
  rol_actor: string
  resultado: string
  fecha_transicion: string
  numero_resolucion?: string | null
}

const fecha = (v?: string) =>
  v ? new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export default function DirectivoDashboard() {
  const { user } = useAuth()
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [trazabilidad, setTrazabilidad] = useState<Traz[]>([])
  const [escuelas, setEscuelas] = useState<any[]>([])
  const [cargandoExtra, setCargandoExtra] = useState(true)

  const { lanes, flujo, loading: catLoading } = useCatalogoBpmn(user?.rol_actor_id)

  useEffect(() => {
    api
      .get<KPI>('/api/v1/dashboard/kpis')
      .then(r => setKpi(normKPI((r as any).data ?? r)))
      .catch(() => setKpi(null))
  }, [])

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/dashboard/trazabilidad?limit=6'),
      api.get('/api/v1/escuelas'),
    ])
      .then(([t, e]: any[]) => {
        setTrazabilidad(asArray<Traz>(t?.data))
        setEscuelas(asArray<any>(e?.data))
      })
      .catch(() => undefined)
      .finally(() => setCargandoExtra(false))
  }, [])

  if (!kpi)
    return (
      <div className="p-8 text-sm text-slate-500">
        No se pudieron cargar los indicadores. Verifica tu conexión e inténtalo de nuevo.
      </div>
    )

  const porEstado = Array.isArray((kpi as any).proyectos_por_estado) ? (kpi as any).proyectos_por_estado : []
  const porFacultad = Array.isArray((kpi as any).proyectos_por_facultad) ? (kpi as any).proyectos_por_facultad : []

  const pctPresupuesto = kpi.presupuesto_aprobado > 0 ? (kpi.presupuesto_ejecutado / kpi.presupuesto_aprobado) * 100 : 0
  const misLanes = lanes.slice(0, 4)

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-undc-700 to-slate-800 rounded-[24px] p-5 sm:p-6 text-white flex flex-col lg:flex-row lg:flex-wrap gap-4 justify-between">
        <div className="min-w-0">
          <div className="text-sm opacity-80 flex items-center gap-2 flex-wrap">
            <Shield size={16} /> {user?.rol_actor} · {user?.tipo_actor}
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1">Panel Directivo — Supervisión</h1>
          <p className="text-sm opacity-80 mt-1">Bandeja por estado · Presupuesto y reportes</p>
        </div>
        <div className="flex gap-2 items-start flex-wrap">
          <span className="px-3 py-2 bg-white text-undc-700 rounded-xl text-sm font-bold">
            {kpi.total_proyectos} proyectos totales
          </span>
          <span className="px-3 py-2 bg-white/15 rounded-xl text-sm">{kpi.proyectos_en_ejecucion} en ejecución</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="text-xs font-bold text-amber-800 flex items-center gap-1">
            <ClipboardCheck size={14} /> Mi bandeja ({user?.rol_actor})
          </div>
          <div className="mt-2 space-y-2">
            {catLoading ? (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Leyendo matriz de transiciones…
              </div>
            ) : misLanes.length ? (
              misLanes.map(l => (
                <div
                  key={l.codigo}
                  className="bg-white rounded-xl border border-amber-200 p-2 flex justify-between items-center text-sm gap-2"
                >
                  <span className="font-semibold truncate">{l.nombre}</span>
                  <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs shrink-0">
                    → {l.destinoNombre}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500">Tu rol no tiene estados asignados en la matriz</div>
            )}
          </div>
          <Link
            to="/bandeja"
            className="mt-3 block w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold text-center"
          >
            Ir a bandeja de aprobación
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Wallet size={14} /> Presupuesto
          </div>
          <div className="font-black text-lg mt-1">
            S/ {kpi.presupuesto_aprobado.toLocaleString()}{' '}
            <span className="text-sm font-normal text-slate-500">aprobado</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-2">
            <div
              className="h-full bg-undc-600 rounded-full transition-all"
              style={{ width: `${Math.min(100, pctPresupuesto)}%` }}
            />
          </div>
          <div className="text-xs mt-1 text-slate-600">
            {pctPresupuesto.toFixed(1)}% ejecutado — S/ {kpi.presupuesto_ejecutado.toLocaleString()}
          </div>
          <Link
            to="/presupuesto"
            className="mt-3 block w-full py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-bold text-center"
          >
            Ver movimientos
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Cobertura</div>
          <div className="font-black text-2xl text-undc-700">
            {kpi.total_beneficiarios} <span className="text-sm font-normal text-slate-500">beneficiarios</span>
          </div>
          <div className="text-xs text-slate-500">
            {kpi.total_docentes} docentes · {kpi.total_estudiantes} estudiantes
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {escuelas.length ? (
              escuelas.slice(0, 4).map((e: any) => (
                <span key={e.id_escuela} className="px-2 py-1 bg-slate-100 rounded-lg text-xs">
                  {e.nombre}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">Sin escuelas registradas</span>
            )}
          </div>
          <Link
            to="/estructura"
            className="mt-3 block text-xs text-undc-700 hover:underline font-semibold"
          >
            Ver estructura →
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold">Proyectos por estado</h3>
          <p className="text-xs text-slate-500">Cada barra es un estado del catálogo.</p>
          <div className="h-[220px] sm:h-[280px] mt-3">
            {porEstado.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porEstado}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="estado" tick={{ fontSize: 10 }} interval={0} angle={-14} dy={10} height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {porEstado.map((e: any, i: number) => (
                      <Cell key={i} fill={e.color || '#1b5e20'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-xl p-4">
                Sin datos por estado — crea proyectos.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold">Proyectos por Facultad</h3>
          <div className="h-[220px] sm:h-[280px] mt-3">
            {porFacultad.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={porFacultad} dataKey="total" nameKey="facultad" cx="50%" cy="50%" outerRadius={95} label>
                    {porFacultad.map((_: any, i: number) => (
                      <Cell key={i} fill={['#1b5e20', '#2e7d32', '#66bb6a', '#a5d6a7', '#81c784'][i % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-xl p-4">
                Sin cobertura — registra proyectos por escuela.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:col-span-1">
          <h3 className="font-bold flex items-center gap-2">
            <TrendingUp size={16} /> Trazabilidad
          </h3>
          <p className="text-xs text-slate-500 mt-1">Últimas transiciones registradas</p>
          <div className="mt-3 space-y-2 max-h-[200px] sm:max-h-[220px] overflow-auto pr-1">
            {cargandoExtra ? (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Cargando…
              </div>
            ) : trazabilidad.length ? (
              trazabilidad.map(t => (
                <div key={`${t.codigo_proyecto}-${t.fecha_transicion}`} className="border border-slate-200 rounded-xl p-2 text-xs">
                  <div className="font-mono text-[11px] text-undc-700 font-bold">{t.codigo_proyecto}</div>
                  <div className="text-slate-700 leading-snug">{t.estado_origen} → {t.estado_destino}</div>
                  <div className="text-slate-500 mt-0.5">
                    {t.rol_actor} · {t.resultado} · {fecha(t.fecha_transicion)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400">Sin transiciones registradas</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold flex items-center gap-2">
            <Award size={16} /> Satisfacción
          </h3>
          {kpi.promedio_satisfaccion == null ? (
            <div className="text-sm text-slate-400 mt-3">Aún sin encuestas respondidas</div>
          ) : (
            <>
              <div className="text-3xl font-black text-violet-600 mt-1">
                {kpi.promedio_satisfaccion.toFixed(2)} <span className="text-base">/5</span>
              </div>
              <div className="text-xs text-slate-500">Promedio Likert de beneficiarios</div>
            </>
          )}
          <Link to="/encuestas" className="mt-3 block text-xs text-undc-700 hover:underline font-semibold">
            Ver encuestas →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold flex items-center gap-2">
            <FileText size={16} /> Reportes
          </h3>
          <p className="text-xs text-slate-500 mt-1">Indicadores SUNEDU / SINEACE</p>
          <Link
            to="/reportes"
            className="mt-3 block w-full py-2 bg-undc-700 hover:bg-undc-900 text-white rounded-xl text-sm font-bold text-center"
          >
            Generar memoria anual
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold">Flujo completo del proyecto</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Los {flujo.length} estados del ciclo RSU. Los marcados son los que pasan por ti.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {flujo.map((e, i) => {
            const esMio = lanes.some(l => l.codigo === e.codigo)
            return (
              <span
                key={e.codigo}
                title={esMio ? `${e.nombre} — participas en este estado` : e.nombre}
                className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                  esMio
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {i + 1}. {e.codigo}
              </span>
            )
          })}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          {lanes.length > 0
            ? `${lanes.length} de ${flujo.length} estados requieren tu rol (${rolLegible(user?.rol)}).`
            : 'Tu rol no participa en las transiciones del flujo: solo supervisas y administras el sistema.'}
        </div>
      </div>
    </div>
  )
}