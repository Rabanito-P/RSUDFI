import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Proyecto } from '../types/models'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton'
import { EmptySearch } from '../components/ui/Empty'
import { PageHeader } from '../components/ui/PageHeader'
import { Search, Plus, Eye, ArrowRight, Filter, FolderKanban, Layers, GraduationCap } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Proyectos(){
  const {user} = useAuth()
  const location = useLocation()
  const [items,setItems]=useState<Proyecto[]>([])
  const [search,setSearch]=useState('')
  const [estado,setEstado]=useState('')
  const [meta,setMeta]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const isEstudiante = user?.rol==='ESTUDIANTE'
  const isDocente = user?.rol==='DOCENTE'

  // V3: estudiante aislado — /proyectos (todos) redirige a /mis-proyectos
  if(isEstudiante && (location.pathname==='/proyectos' || location.pathname==='/proyectos/')){
    return <Navigate to="/mis-proyectos" replace />
  }

  const load = async()=>{
    setLoading(true)
    try{
      if(isEstudiante && user?.id){
        const r:any = await api.get(`/api/v1/estudiantes/${user.id}/proyectos?search=${encodeURIComponent(search)}&page=1&limit=20`)
        setItems(r.data||[]); setMeta(r.meta); return
      }
      if(isDocente && user?.id){
        const r:any = await api.get(`/api/v1/docentes/${user.id}/proyectos?search=${encodeURIComponent(search)}&page=1&limit=20`)
        setItems(r.data||[]); setMeta(r.meta); return
      }
      const q = new URLSearchParams()
      if(search) q.set('search',search)
      if(estado) q.set('estado',estado)
      q.set('page','1'); q.set('limit','20')
      const r:any = await api.get(`/api/v1/proyectos?${q.toString()}`)
      setItems(r.data||[]); setMeta(r.meta)
    }catch(e){ setItems([]) }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  // demo solo para directivo (no filtrado). Estudiante/docente con 0 proyectos muestra vacío, no demo de otros.
  const demo:Proyecto[] = items.length ? items : (loading ? [] : (isEstudiante||isDocente ? [] : [
    {id_proyecto:1,codigo_proyecto:'RSU-2026-001',titulo:'Campaña de salud integral en San Vicente de Cañete',id_escuela:1,id_tipo:1,id_estado_actual:9,estado_actual:{id_estado:9,codigo:'EN_EJECUCION',nombre:'En ejecución',color_ui:'#2196F3',orden_flujo:9},escuela:{id_escuela:1,nombre:'Enfermería',facultad:{nombre:'Ciencias de la Salud'}},presupuesto_aprobado:12000,monto_ejecutado:4500,porcentaje_avance:38,created_at:''},
    {id_proyecto:2,codigo_proyecto:'RSU-2026-002',titulo:'Alfabetización digital para adultos mayores - Imperial',id_escuela:1,id_tipo:2,id_estado_actual:6,estado_actual:{id_estado:6,codigo:'APROBADO_CON_RESOLUCION',nombre:'Aprobado con Resolución',color_ui:'#4CAF50',orden_flujo:6},escuela:{id_escuela:2,nombre:'Ing. Sistemas'},presupuesto_aprobado:8000,monto_ejecutado:0,porcentaje_avance:0,created_at:''},
    {id_proyecto:3,codigo_proyecto:'RSU-2026-003',titulo:'Reciclaje comunitario y gestión ambiental - Quilmaná',id_escuela:1,id_tipo:1,id_estado_actual:1,estado_actual:{id_estado:1,codigo:'BORRADOR',nombre:'Borrador',color_ui:'#9E9E9E',orden_flujo:1},escuela:{id_escuela:1,nombre:'Ing. Ambiental'},presupuesto_aprobado:5000,monto_ejecutado:0,porcentaje_avance:0,created_at:''},
  ] as any))

  return (
    <div className="space-y-6 animate-fade-in">
      {isEstudiante && <div className="rounded-2xl bg-undc-50 border border-undc-200 p-3 text-xs flex gap-2 items-center"><span className="w-2 h-2 rounded-full bg-undc-700 animate-pulse"/> <b>Mi proyecto:</b> solo ves el proyecto donde estás incluido (grupo con líder + docente). Si te retiran, quedas libre.</div>}
      <PageHeader
        title={isEstudiante ? 'Mis proyectos — aislados' : isDocente ? 'Proyectos asesorados' : 'Proyectos — Supervisión'}
        subtitle={isEstudiante ? 'Tu único proyecto activo (grupo con líder y docente asesor)' : isDocente ? 'Proyectos donde eres docente asesor' : 'Tus proyectos vigentes'}
        icon={<FolderKanban size={20}/>}
        badge={<span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-xs font-bold">{meta? `${meta.total} proyectos` : `${demo.length} demo`}</span>}
        actions={
          <>
            {(isEstudiante || user?.rol==='ADMIN') && <Link to="/proyectos/nuevo" className="inline-flex items-center gap-2 bg-undc-700 hover:bg-undc-800 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm btn-press"><Plus size={18}/> Proponer proyecto</Link>}
            {isDocente && <span className="text-xs bg-undc-50 border border-undc-200 text-undc-700 rounded-xl px-3 py-2">Solo ves proyectos donde eres asesor</span>}
            {!isEstudiante && !isDocente && <Link to="/proyectos/nuevo" className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold"><Plus size={16}/> Nuevo</Link>}
          </>
        }
      />

      {user && <div className="flex gap-2 text-xs flex-wrap"><span className="px-2.5 py-1 bg-undc-700 text-white rounded-full text-xs font-bold">{user.rol_actor}</span>{isEstudiante && <span className="px-2 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full">Grupo con líder + asesor</span>}{isDocente && <span className="px-2 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full">Solo asesorados</span>}</div>}

      {!isEstudiante && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <Input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="Buscar por título, código o escuela..." className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"/>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400"/>
              <Select value={estado} onChange={e=>setEstado(e.target.value)} className="min-w-[170px] bg-slate-50">
                <option value="">Todos los estados</option>
                <option value="1">Borrador</option>
                <option value="2">En revisión Escuela</option>
                <option value="6">Aprobado con Resolución</option>
                <option value="9">En ejecución</option>
                <option value="10">En monitoreo</option>
                <option value="13">Cerrado</option>
              </Select>
            </div>
            <Button onClick={load} variant="secondary" leftIcon={<Search size={14}/>}>Filtrar</Button>
            <Button onClick={()=>{setSearch(''); setEstado(''); setTimeout(load,0)}} variant="outline">Limpiar</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4">{[1,2,3].map(i=><CardSkeleton key={i}/>)}</div>
      ) : demo.length===0 ? (
        <Card><EmptySearch query={search}/></Card>
      ) : (
        <div className="grid gap-4">
          {demo.map(p=>(
            <Card key={p.id_proyecto} hover className="p-5">
              <div className="flex flex-wrap gap-3 items-start justify-between">
                <div className="flex-1 min-w-[300px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono bg-slate-900 text-white px-2 py-1 rounded-lg">{p.codigo_proyecto}</span>
                    <Badge color={p.estado_actual?.color_ui} variant="soft" dot>{p.estado_actual?.nombre}</Badge>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Layers size={12}/>{p.escuela?.facultad?.nombre} · {p.escuela?.nombre}</span>
                    <span className="text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded-full flex items-center gap-1"><GraduationCap size={12}/> {p.tipo?.nombre || 'RSU'}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mt-2.5 leading-tight text-[15px]">{p.titulo}</h3>
                  <div className="flex gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                    <span className="flex items-center gap-1">Avance <b className="text-slate-900">{p.porcentaje_avance}%</b> <span className="w-16 h-1.5 bg-slate-100 rounded-full inline-block overflow-hidden"><span className="h-full bg-undc-600 block" style={{width:`${p.porcentaje_avance}%`}}/></span></span>
                    <span>Presupuesto <b className="text-slate-900">S/ {p.presupuesto_aprobado?.toLocaleString()}</b> · Ejecutado <b className={p.monto_ejecutado>0?'text-emerald-600':'text-slate-500'}>S/ {p.monto_ejecutado?.toLocaleString()}</b></span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-undc-600 to-emerald-500 rounded-full transition-all" style={{width:`${p.porcentaje_avance}%`}}/>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link to={`/proyectos/${p.id_proyecto}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 shadow-sm btn-press"><Eye size={16}/> Ver expediente</Link>
                  <Link to={`/proyectos/${p.id_proyecto}`} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold hover:bg-slate-50 inline-flex items-center gap-1">Flujo <ArrowRight size={14}/></Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-slate-900 text-white border-slate-800">
        <div className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-200">Consulta el resumen de tus proyectos</div>
          <a href="/api/v1/proyectos/resumen" target="_blank" className="px-3 py-2 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-100">Ver resumen</a>
        </div>
      </Card>
    </div>
  )
}
