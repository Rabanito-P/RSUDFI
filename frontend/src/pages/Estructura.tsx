import { useEffect, useState } from 'react'
import { api, asArray } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Alert } from '../components/ui/Alert'
import { Modal } from '../components/ui/Modal'
import { Building2, GraduationCap, Calendar, Plus, Layers, MapPin, Check, Clock } from 'lucide-react'

export default function Estructura(){
  const [fac,setFac]=useState<any[]>([])
  const [esc,setEsc]=useState<any[]>([])
  const [ciclos,setCiclos]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [loadError,setLoadError]=useState('')
  const [showFac,setShowFac]=useState(false)
  const [facForm,setFacForm]=useState({codigo:'', nombre:''})
  const [facMsg,setFacMsg]=useState('')
  const [showCiclo,setShowCiclo]=useState(false)
  const [cicloForm,setCicloForm]=useState({nombre:'', fecha_inicio:'', fecha_fin:'', activo:false})
  const [cicloMsg,setCicloMsg]=useState<{type:'ok'|'err', text:string}|null>(null)
  const [cicloBusy,setCicloBusy]=useState(false)

  const load = ()=>{
    setLoading(true); setLoadError('')
    Promise.all([
      api.get('/api/v1/facultades').then((r:any)=> setFac(asArray(r.data))),
      api.get('/api/v1/escuelas').then((r:any)=> setEsc(asArray(r.data))),
      api.get('/api/v1/ciclos').then((r:any)=> setCiclos(asArray(r.data))),
    ]).catch((e:any)=> setLoadError(e?.message||'No se pudo cargar la estructura')).finally(()=> setLoading(false))
  }
  useEffect(()=>{ load() },[])

  const createFac = async(e:React.FormEvent)=>{
    e.preventDefault()
    setFacMsg('')
    try{
      await api.post('/api/v1/facultades', {codigo: facForm.codigo, nombre: facForm.nombre})
      setFacForm({codigo:'',nombre:''}); setShowFac(false); load()
    }catch(ex:any){ setFacMsg(ex?.message||'No se pudo crear la facultad') }
  }

  const createCiclo = async()=>{
    setCicloMsg(null)
    if(!cicloForm.nombre || !cicloForm.fecha_inicio || !cicloForm.fecha_fin){
      setCicloMsg({type:'err', text:'Nombre, fecha de inicio y fecha de fin son obligatorios'}); return
    }
    setCicloBusy(true)
    try{
      await api.post('/api/v1/ciclos', {
        nombre: cicloForm.nombre,
        fecha_inicio: cicloForm.fecha_inicio,
        fecha_fin: cicloForm.fecha_fin,
        activo: cicloForm.activo
      })
      setCicloMsg({type:'ok', text:'Ciclo creado'})
      setCicloForm({nombre:'', fecha_inicio:'', fecha_fin:'', activo:false})
      load()
      setTimeout(()=> setShowCiclo(false), 700)
    }catch(ex:any){ setCicloMsg({type:'err', text: ex?.message||'No se pudo crear el ciclo'}) }
    finally{ setCicloBusy(false) }
  }

  if(loading) return <div className="space-y-4"><Skeleton className="h-20 w-full"/><div className="grid md:grid-cols-2 gap-6"><Skeleton className="h-64"/><Skeleton className="h-64"/></div></div>

  if(loadError) return <Alert variant="error"><div className="flex items-center justify-between gap-3"><span>{loadError}</span><Button size="sm" variant="outline" onClick={load}>Reintentar</Button></div></Alert>

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Estructura Organizacional UNDC"
        subtitle="Facultades, Escuelas y Ciclos académicos"
        icon={<Building2 size={20}/>}
        badge={<span className="px-2.5 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full text-xs font-bold">{fac.length} facultades · {esc.length} escuelas</span>}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card hover>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle><Building2 size={16} className="text-undc-700"/> Facultades</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Decanato · activo/inactivo</p>
            </div>
            <Button size="sm" variant="outline" onClick={()=>setShowFac(!showFac)} leftIcon={<Plus size={14}/>}>{showFac?'Cerrar':'Nueva'}</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {showFac && (
              <form onSubmit={createFac} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label required>Código (10)</Label><Input value={facForm.codigo} onChange={e=>setFacForm({...facForm,codigo:e.target.value})} placeholder="FIA" maxLength={10}/></div>
                <div><Label required>Nombre</Label><Input value={facForm.nombre} onChange={e=>setFacForm({...facForm,nombre:e.target.value})} placeholder="Facultad de..."/></div>
                <div className="col-span-2 flex justify-end gap-2"><Button type="submit" size="sm">Guardar</Button><Button type="button" size="sm" variant="outline" onClick={()=>setShowFac(false)}>Cancelar</Button></div>
                {facMsg && <div className="col-span-2"><Alert variant="error" className="text-xs">{facMsg}</Alert></div>}
              </form>
            )}
            <div className="space-y-2">
              {fac.map(f=>(
                <div key={f.id_facultad} className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded-lg">{f.codigo}</span>
                    <span className="font-semibold text-slate-900">{f.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={f.activo? '#10b981':'#94a3b8'} variant="soft" dot>{f.activo?'Activo':'Inactivo'}</Badge>
                    <span className="text-xs text-slate-400">ID {f.id_facultad}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle><GraduationCap size={16} className="text-undc-700"/> Escuelas Profesionales</CardTitle>
            <p className="text-xs text-slate-500">Pertenece a facultad · La escuela define el proyecto</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {esc.map(e=>(
                <div key={e.id_escuela} className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-3 hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2"><span className="font-mono text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">{e.codigo}</span><span className="font-semibold">{e.nombre}</span></div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Layers size={12}/>{e.facultad?.nombre || `Facultad ID ${e.id_facultad}`}</div>
                  </div>
                  <span className="text-xs font-mono bg-slate-50 px-2 py-1 rounded-full border">ID {e.id_escuela}</span>
                </div>
              ))}
            </div>
            <Alert variant="info" className="mt-4 text-xs">Cada proyecto se ancla a una <b>Escuela</b> → Facultad para tus reportes.</Alert>
          </CardContent>
        </Card>
      </div>

      <Card hover>
        <CardHeader>
          <CardTitle><Calendar size={16} className="text-undc-700"/> Ciclos Académicos</CardTitle>
          <p className="text-xs text-slate-500">Ciclo activo determina la inscripción según ciclo mínimo y ciclo del estudiante</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
            {ciclos.map(c=>(
              <div key={c.id_ciclo} className={`border rounded-2xl p-4 ${c.activo?'border-undc-200 bg-undc-50/50':'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div className="font-black text-slate-900 flex items-center gap-2"><Calendar size={16} className={c.activo?'text-undc-700':'text-slate-400'}/>{c.nombre}</div>
                  {c.activo ? <span className="inline-flex items-center gap-1 px-2 py-1 bg-undc-700 text-white rounded-full text-xs font-bold"><Check size={12}/> Activo</span> : <span className="px-2 py-1 bg-slate-100 rounded-full text-xs flex items-center gap-1"><Clock size={12}/> Programado</span>}
                </div>
                <div className="text-xs text-slate-500 mt-1">{new Date(c.fecha_inicio).toLocaleDateString('es-PE')} — {new Date(c.fecha_fin).toLocaleDateString('es-PE')}</div>
                <div className="mt-2 text-xs">ID {c.id_ciclo} · {c.activo?'Determina validación ciclo mínimo':''}</div>
                {c.activo && <div className="mt-2 text-xs bg-white border border-undc-200 rounded-xl p-2">Estudiantes en este ciclo</div>}
              </div>
            ))}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 grid place-items-center text-center">
              <div><Plus size={20} className="mx-auto text-slate-400"/>                <div className="text-sm font-semibold mt-1">Nuevo ciclo</div><div className="text-xs text-slate-500">POST /api/v1/ciclos</div><Button size="sm" variant="outline" className="mt-2" onClick={()=>{ setCicloMsg(null); setShowCiclo(true) }}>Crear ciclo</Button></div>
            </div>
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-3 text-xs">
            <Alert variant="warning">Valida <b>ciclo_minimo_estudiante</b>: Voluntariado ciclo ≥1, Extensión ≥3, Proyección Social ≥5, Investigación ≥7</Alert>
            <Alert variant="info">La estructura es base para tus reportes.</Alert>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={showCiclo}
        busy={cicloBusy}
        onClose={()=> setShowCiclo(false)}
        title="Crear ciclo académico"
        desc="POST /api/v1/ciclos"
        footer={<>
          <Button variant="outline" onClick={()=> setShowCiclo(false)} disabled={cicloBusy}>Cancelar</Button>
          <Button onClick={createCiclo} loading={cicloBusy}>Crear ciclo</Button>
        </>}
      >
        <div className="space-y-3">
          <div><Label required>Nombre</Label><Input value={cicloForm.nombre} onChange={e=>setCicloForm({...cicloForm, nombre:e.target.value})} placeholder="2026-II"/></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label required>Fecha inicio</Label><Input type="date" value={cicloForm.fecha_inicio} onChange={e=>setCicloForm({...cicloForm, fecha_inicio:e.target.value})}/></div>
            <div><Label required>Fecha fin</Label><Input type="date" value={cicloForm.fecha_fin} onChange={e=>setCicloForm({...cicloForm, fecha_fin:e.target.value})}/></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={cicloForm.activo} onChange={e=>setCicloForm({...cicloForm, activo:e.target.checked})}/>
            Ciclo activo
          </label>
          {cicloMsg && <Alert variant={cicloMsg.type==='ok'?'success':'error'} className="text-xs">{cicloMsg.text}</Alert>}
        </div>
      </Modal>
    </div>
  )
}
