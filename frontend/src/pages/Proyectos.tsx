import { useEffect, useState } from 'react'
import { api, asArray } from '../api/client'
import { Proyecto } from '../types/models'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton'
import { EmptySearch } from '../components/ui/Empty'
import { PageHeader } from '../components/ui/PageHeader'
import { Search, Plus, Eye, ArrowRight, Filter, FolderKanban, Layers, GraduationCap, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mensajeError } from '../lib/errores'
import { UserPlus, Users } from 'lucide-react'

const LIMIT = 10

export default function Proyectos(){
  const {user} = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [items,setItems]=useState<Proyecto[]>([])
  const [search,setSearch]=useState('')
  const [estado,setEstado]=useState('')
  const [escuela,setEscuela]=useState('')
  const [escuelas,setEscuelas]=useState<any[]>([])
  const [meta,setMeta]=useState<any>(null)
  const [page,setPage]=useState(1)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const isEstudiante = user?.rol==='ESTUDIANTE'
  const isDocente = user?.rol==='DOCENTE'

  // PEPs abiertos para unirse (HU-063): el estudiante descubre aquí dónde
  // pedir cupo sin tener que pasar por "Proponer proyecto".
  const [peps,setPeps]=useState<any[]>([])
  const [pepsCerrados,setPepsCerrados]=useState(0)
  const [pepsCupos,setPepsCupos]=useState<Record<number,string>>({})
  const [pepsLoading,setPepsLoading]=useState(false)
  const [pepsError,setPepsError]=useState('')
  useEffect(()=>{
    if(!isEstudiante) return
    setPepsLoading(true); setPepsError('')
    api.get('/api/v1/proyectos?modalidad=PEP_FINANCIADO,PEP_AUTOFINANCIADO&limit=12')
      .then(async (r:any)=>{
        const FINALES = ['CERRADO','REPORTADO_SUNEDU','EVALUACION_VALIDADA']
        const todos = asArray<any>(r.data)
        const lista = todos.filter((p:any)=> !FINALES.includes(String(p.estado_actual?.codigo || '')))
        setPepsCerrados(todos.length - lista.length)
        setPeps(lista)
        const cupos: Record<number,string> = {}
        await Promise.all(lista.map(async (p:any)=>{
          try{
            const m:any = await api.get(`/api/v1/proyectos/${p.id_proyecto}/estudiantes`)
            const ms = asArray<any>(m.data)
            const ids = ms.map((x:any)=> x.id_estudiante)
            const ocup = ms.length + ((p.id_estudiante_lider && !ids.includes(p.id_estudiante_lider)) ? 1 : 0)
            cupos[p.id_proyecto] = `${ocup}/5`
          }catch{ cupos[p.id_proyecto] = '—/5' }
        }))
        setPepsCupos(cupos)
      })
      .catch((e:any)=> setPepsError(mensajeError(e, 'No se pudieron cargar los PEPs abiertos.')))
      .finally(()=> setPepsLoading(false))
  },[isEstudiante])

  useEffect(()=>{
    if(isEstudiante && (location.pathname==='/proyectos' || location.pathname==='/proyectos/')){
      navigate('/mis-proyectos', { replace: true })
    }
  },[isEstudiante, location.pathname, navigate])

  useEffect(()=>{
    api.get('/api/v1/escuelas').then((r:any)=> setEscuelas(asArray(r.data))).catch(()=> setEscuelas([]))
  },[])

  const load = async()=>{
    setLoading(true); setError('')
    try{
      const q = new URLSearchParams()
      if(search) q.set('search',search)
      q.set('page',String(page)); q.set('limit',String(LIMIT))
      if(isEstudiante && user?.persona_id){
        const r:any = await api.get(`/api/v1/estudiantes/${user.persona_id}/proyectos?${q.toString()}`)
        const all = asArray<Proyecto>(r.data)
        setItems(estado? all.filter(p=> String(p.estado_actual?.id_estado)===estado) : all)
        setMeta(r.meta); return
      }
      if(isDocente && user?.persona_id){
        const r:any = await api.get(`/api/v1/docentes/${user.persona_id}/proyectos?${q.toString()}`)
        const all = asArray<Proyecto>(r.data)
        setItems(estado? all.filter(p=> String(p.estado_actual?.id_estado)===estado) : all)
        setMeta(r.meta); return
      }
      if(estado) q.set('estado',estado)
      if(escuela) q.set('escuela',escuela)
      const r:any = await api.get(`/api/v1/proyectos?${q.toString()}`)
      setItems(asArray(r.data)); setMeta(r.meta)
    }catch(e:any){
      setItems([]); setMeta(null)
      setError(e?.message || 'No se pudieron cargar los proyectos')
    }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ load() },[page])

  const aplicar = ()=>{ if(page===1){ load() } else { setPage(1) } }
  const limpiar = ()=>{ setSearch(''); setEstado(''); setEscuela(''); if(page===1){ load() } else { setPage(1) } }
  const totalPages = Math.max(1, Number(meta?.pages||1))
  const totalRegistros = Number(meta?.total ?? items.length)

  return (
    <div className="space-y-6 animate-fade-in">
      {isEstudiante && <div className="rounded-2xl bg-undc-50 border border-undc-200 p-3 text-xs flex gap-2 items-center"><span className="w-2 h-2 rounded-full bg-undc-700 animate-pulse"/> <b>Mi proyecto:</b> solo ves el proyecto donde estás incluido (grupo con líder + docente). Si te retiran, quedas libre.</div>}

      {/* ── PEPs abiertos para unirse (HU-063) ── */}
      {isEstudiante && (
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><UserPlus size={16} className="text-undc-700"/> PEPs abiertos — pide tu cupo</h3>
            {pepsLoading && <span className="text-xs text-slate-400">Cargando…</span>}
          </div>
          <p className="text-xs text-slate-500 mt-1">Son proyectos con financiamiento dirigidos por un docente responsable. Entra, revisa y solicita unirte desde la pestaña <b>Equipo</b>.</p>
          {pepsError && <Alert variant="error" className="mt-3 text-xs">{pepsError}</Alert>}
          {!pepsLoading && !pepsError && peps.length===0 && (
            <div className="text-xs text-slate-500 mt-3">
              {pepsCerrados > 0
                ? `No hay PEPs abiertos por ahora (${pepsCerrados} cerrado(s) no se muestran). Vuelve más tarde o propone tu propio proyecto.`
                : 'No hay PEPs abiertos por ahora. Vuelve más tarde o propone tu propio proyecto.'}
            </div>
          )}
          {peps.length>0 && (
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {peps.map((p:any)=>(
                <div key={p.id_proyecto} className="border border-slate-200 rounded-2xl p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono bg-slate-900 text-white px-2 py-0.5 rounded-lg">{p.codigo_proyecto}</span>
                    <Badge color={p.estado_actual?.color_ui} variant="soft" dot>{p.estado_actual?.nombre}</Badge>
                    <span className="text-[11px] bg-violet-50 border border-violet-200 text-violet-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Users size={10}/> {pepsCupos[p.id_proyecto] || '—/5'}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-800 leading-tight">{p.titulo}</div>
                  <div className="text-[11px] text-slate-500">Asesor: {p.docente_asesor ? `${p.docente_asesor.nombres} ${p.docente_asesor.apellidos}` : '—'} · {p.escuela?.nombre || ''}</div>
                  <Link to={`/proyectos/${p.id_proyecto}?tab=equipo`} className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-undc-700 text-white text-xs font-bold hover:bg-undc-800">
                    <UserPlus size={13}/> Ver y pedir unirme
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      <PageHeader
        title={isEstudiante ? 'Mis proyectos — aislados' : isDocente ? 'Proyectos asesorados' : 'Proyectos — Supervisión'}
        subtitle={isEstudiante ? 'Tu único proyecto activo (grupo con líder y docente asesor)' : isDocente ? 'Proyectos donde eres docente asesor' : 'Tus proyectos vigentes'}
        icon={<FolderKanban size={20}/>}
        badge={<span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-xs font-bold">{loading? 'Cargando…' : `${totalRegistros} proyectos`}</span>}
        actions={
          <>
            {(isEstudiante || user?.rol==='ADMIN') && <Link to="/proyectos/nuevo" className="inline-flex items-center gap-2 bg-undc-700 hover:bg-undc-800 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm btn-press"><Plus size={18}/> Proponer proyecto</Link>}
            {isDocente && <span className="text-xs bg-undc-50 border border-undc-200 text-undc-700 rounded-xl px-3 py-2">Solo ves proyectos donde eres asesor</span>}
            {!isEstudiante && !isDocente && <Link to="/proyectos/nuevo" className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold"><Plus size={16}/> Nuevo</Link>}
          </>
        }
      />

      {user && <div className="flex gap-2 text-xs flex-wrap"><span className="px-2.5 py-1 bg-undc-700 text-white rounded-full text-xs font-bold">{user.rol_actor}</span>{isEstudiante && <span className="px-2 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full">Grupo con líder + asesor</span>}{isDocente && <span className="px-2 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full">Solo asesorados</span>}</div>}

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 lg:items-center">
          <div className="relative flex-1 min-w-0 lg:min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <Input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&aplicar()} placeholder="Buscar por título, código o escuela..." className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"/>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0"/>
            <Select value={estado} onChange={e=>setEstado(e.target.value)} className="w-full lg:w-auto lg:min-w-[170px] bg-slate-50">
              <option value="">Todos los estados</option>
              <option value="1">Borrador</option>
              <option value="2">En revisión Escuela</option>
              <option value="6">Aprobado con Resolución</option>
              <option value="9">En ejecución</option>
              <option value="10">En monitoreo</option>
              <option value="13">Cerrado</option>
            </Select>
          </div>
          {escuelas.length>0 && (
            <div className="flex items-center gap-2">
              <Select value={escuela} onChange={e=>setEscuela(e.target.value)} className="w-full lg:w-auto lg:min-w-[180px] bg-slate-50">
                <option value="">Todas las escuelas</option>
                {escuelas.map(e=> <option key={e.id_escuela} value={String(e.id_escuela)}>{e.nombre}</option>)}
              </Select>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={aplicar} variant="secondary" leftIcon={<Search size={14}/>} className="flex-1 lg:flex-none">Filtrar</Button>
            <Button onClick={limpiar} variant="outline" className="flex-1 lg:flex-none">Limpiar</Button>
          </div>
        </div>
      </Card>

      {error && <Alert variant="error"><div className="flex items-center justify-between gap-3"><span>{error}</span><Button size="sm" variant="outline" onClick={load}>Reintentar</Button></div></Alert>}

      {loading ? (
        <div className="grid gap-4">{[1,2,3].map(i=><CardSkeleton key={i}/>)}</div>
      ) : !error && items.length===0 ? (
        <Card><EmptySearch query={search}/></Card>
      ) : (
        <div className="grid gap-4">
          {items.map(p=>(
            <Card key={p.id_proyecto} hover className="p-5">
              <div className="flex flex-wrap gap-3 items-start justify-between">
                <div className="flex-1 min-w-0 sm:min-w-[300px]">
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
                  <Link to={`/proyectos/${p.id_proyecto}?tab=flujo`} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold hover:bg-slate-50 inline-flex items-center gap-1">Flujo <ArrowRight size={14}/></Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && totalRegistros>0 && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Página <b className="text-slate-800">{page}</b> de {totalPages} · {totalRegistros} proyectos
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} leftIcon={<ChevronLeft size={14}/>}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} rightIcon={<ChevronRight size={14}/>}>Siguiente</Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="bg-slate-900 text-white border-slate-800">
        <div className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-200">Consulta el resumen de tus proyectos, indicadores y satisfacción</div>
          <Link to="/reportes" className="px-3 py-2 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-100 inline-flex items-center gap-1.5"><FileText size={14}/> Ver reportes</Link>
        </div>
      </Card>
    </div>
  )
}
