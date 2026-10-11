import { useEffect, useState } from 'react'
import { api, asArray } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Empty } from '../components/ui/Empty'
import { FileText, Download, Award, Building2, Users, TrendingUp, Layers, Printer } from 'lucide-react'

// El estado puede venir como string (vista resumen) o como objeto
// RSU_Estado_Proyecto (endpoint de proyectos). Se normaliza siempre a texto.
function nombreEstado(v:any):string{
  if(!v) return '—'
  if(typeof v === 'string') return v
  return v.nombre || v.codigo || '—'
}

export default function Reportes(){
  const [resumen,setResumen]=useState<any[]>([])
  const [kpi,setKpi]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')

  const load = ()=>{
    setLoading(true); setError('')
    api.get('/api/v1/proyectos/resumen')
      .then((r:any)=> setResumen(asArray(r.data)))
      .catch(()=> setResumen([]))
    api.get('/api/v1/dashboard/kpis')
      .then((r:any)=> setKpi(r.data ?? null))
      .catch((e:any)=>{ setKpi(null); setError(e?.message||'No se pudieron cargar los indicadores del dashboard') })
      .finally(()=> setLoading(false))
  }
  useEffect(()=>{ load() },[])

  const exportarCSV = ()=>{
    const cols = ['codigo_proyecto','titulo','facultad','escuela','tipo_proyecto','estado_actual','semestre','presupuesto_aprobado','monto_ejecutado','porcentaje_avance','total_beneficiarios','promedio_satisfaccion']
    const esc = (v:any)=> `"${String(v ?? '').replace(/"/g,'""')}"`
    const rows = resumen.map(r=> cols.map(c=> esc((r as any)[c])).join(','))
    const csv = [cols.join(','), ...rows].join('\r\n')
    const blob = new Blob(['﻿'+csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_proyectos_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportarPDF = ()=> window.print()

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reportes"
        subtitle="Resumen anual de tus proyectos"
        icon={<FileText size={20}/>}
        badge={<span className="px-2.5 py-1 bg-undc-700 text-white rounded-full text-xs font-bold">{loading? 'Cargando…': `${resumen.length} proyectos`}</span>}
        actions={
          <>
            <Button onClick={exportarCSV} variant="outline" leftIcon={<Download size={14}/>} disabled={resumen.length===0}>Exportar CSV</Button>
            <Button onClick={exportarPDF} className="bg-undc-700" leftIcon={<Printer size={14}/>}>Exportar memoria anual (PDF)</Button>
          </>
        }
      />

      {error && <Alert variant="error"><div className="flex items-center justify-between gap-3"><span>{error}</span><Button size="sm" variant="outline" onClick={load}>Reintentar</Button></div></Alert>}

      {loading ? <Skeleton className="h-24 w-full"/> :
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-4 text-center border-t-4 border-t-undc-600"><div className="text-xs text-slate-500">Proyectos</div><div className="text-2xl font-black">{kpi?.total_proyectos ?? resumen.length}</div><div className="text-xs text-slate-500">Registrados</div></Card>
          <Card className="p-4 text-center border-t-4 border-t-emerald-500"><div className="text-xs text-slate-500">Beneficiarios</div><div className="text-2xl font-black text-emerald-700">{kpi?.total_beneficiarios ?? 0}</div><div className="text-xs text-slate-500">Atendidos</div></Card>
          <Card className="p-4 text-center border-t-4 border-t-amber-500"><div className="text-xs text-slate-500">Presupuesto</div><div className="text-lg font-black">S/ {(kpi?.presupuesto_aprobado??0).toLocaleString()}</div><div className="text-xs text-slate-500">Asignado</div></Card>
          <Card className="p-4 text-center border-t-4 border-t-undc-600"><div className="text-xs text-slate-500">Satisfacción</div><div className="text-2xl font-black text-undc-700">{kpi?.promedio_satisfaccion!=null? Number(kpi.promedio_satisfaccion).toFixed(2):'—'} /5</div><div className="text-xs text-slate-500">Promedio general</div></Card>
        </div>
      }

      <Card hover>
        <CardHeader>
          <CardTitle><Layers size={16}/> Detalle por proyecto</CardTitle>
          <p className="text-xs text-slate-500">Código, título, facultad/escuela, tipo, estado, semestre, presupuesto, avance y métricas</p>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full"/> :
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-slate-50 text-xs text-slate-500 border-b">
                  <tr><th className="text-left px-3 py-2">Código</th><th className="text-left px-3 py-2">Proyecto</th><th className="text-left px-3 py-2">Facultad / Escuela</th><th className="text-left px-3 py-2">Estado</th><th className="text-right px-3 py-2">Presupuesto</th><th className="text-right px-3 py-2">Avance</th><th className="text-center px-3 py-2">Benef.</th><th className="text-center px-3 py-2">Sat.</th></tr>
                </thead>
                <tbody>
                  {resumen.length===0 ? (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-500">Sin datos — crea un proyecto para ver el reporte.</td></tr>
                  ) : resumen.map(r=>(
                    <tr key={r.id_proyecto ?? r.codigo_proyecto} className="border-t hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-xs bg-slate-900 text-white rounded-lg inline-block mt-1">{r.codigo_proyecto}</td>
                      <td className="px-3 py-2"><div className="font-semibold leading-tight max-w-[260px] truncate">{r.titulo}</div><div className="text-xs text-slate-500">{r.tipo_proyecto} · {r.semestre || '—'}</div></td>
                      <td className="px-3 py-2"><div className="font-medium">{r.facultad}</div><div className="text-xs text-slate-500">{r.escuela}</div></td>
                      <td className="px-3 py-2"><Badge color="#1b5e20" variant="soft">{nombreEstado(r.estado_actual)}</Badge></td>
                      <td className="px-3 py-2 text-right"><div className="font-semibold">S/ {Number(r.presupuesto_aprobado||0).toLocaleString()}</div><div className="text-xs text-slate-500">Ejec S/ {Number(r.monto_ejecutado||0).toLocaleString()}</div></td>
                      <td className="px-3 py-2 text-right"><span className="font-bold">{r.porcentaje_avance}%</span><div className="w-16 h-1 bg-slate-100 rounded-full ml-auto mt-1"><div className="h-full bg-undc-600 rounded-full" style={{width:`${r.porcentaje_avance}%`}}/></div></td>
                      <td className="px-3 py-2 text-center font-bold">{r.total_beneficiarios}</td>
                      <td className="px-3 py-2 text-center">{r.promedio_satisfaccion ? <span className="px-2 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full text-xs font-bold">{Number(r.promedio_satisfaccion).toFixed(2)}</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
          <div className="mt-3 flex gap-2">            <Button size="sm" variant="outline" onClick={exportarCSV} disabled={resumen.length===0} leftIcon={<Download size={14}/>}>Exportar Excel (CSV)</Button>
            <Button size="sm" variant="outline" onClick={exportarPDF} leftIcon={<FileText size={14}/>}>Generar PDF memoria</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-2 font-bold"><Building2 size={16} className="text-undc-700"/> Actividad RSU</div><p className="text-xs text-slate-600 mt-1">Este reporte reúne tus proyectos y beneficiarios.</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2 font-bold"><Award size={16} className="text-undc-700"/> Formación</div><p className="text-xs text-slate-600 mt-1">Responsabilidad social articulada a formación y extensión.</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2 font-bold"><TrendingUp size={16} className="text-undc-700"/> Historial</div><p className="text-xs text-slate-600 mt-1">Cada flujo validado con resolución y auditoría.</p></Card>
      </div>
    </div>
  )
}
