import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'
import { Empty } from '../components/ui/Empty'
import { GraduationCap, Users, Search, Plus, Mail, CreditCard, Building2, Clock, BookOpen } from 'lucide-react'

export default function Personas(){
  const [tab,setTab]=useState<'docentes'|'estudiantes'>('docentes')
  const [docs,setDocs]=useState<any[]>([])
  const [ests,setEsts]=useState<any[]>([])
  const [search,setSearch]=useState('')
  const [loading,setLoading]=useState(true)
  const [loadError,setLoadError]=useState('')
  const [estMsg,setEstMsg]=useState<{type:'ok'|'err', text:string}|null>(null)
  const [docMsg,setDocMsg]=useState<{type:'ok'|'err', text:string}|null>(null)
  const [saving,setSaving]=useState(false)
  const [formEst,setFormEst]=useState({codigo:'', dni:'', nombres:'', apellidos:'', correo:'', escuela:'', crearUsuario:true, password:'', rolActor:'ESTUDIANTE_PROP'})
  const [formDoc,setFormDoc]=useState({codigo:'', dni:'', nombres:'', apellidos:'', correo:'', escuela:'', tipo:'ORDINARIO_TC', carga:'8'})
  const [escuelas,setEscuelas]=useState<any[]>([])

  const load = async()=>{
    setLoading(true); setLoadError('')
    try{
      const [d,e,esc]=await Promise.all([
        api.get(`/api/v1/docentes?search=${encodeURIComponent(search)}&limit=50`).then((r:any)=> r.data||[]),
        api.get(`/api/v1/estudiantes?search=${encodeURIComponent(search)}&limit=50`).then((r:any)=> r.data||[]),
        api.get('/api/v1/escuelas').then((r:any)=> r.data||[]).catch(()=>[]),
      ])
      setDocs(d); setEsts(e); setEscuelas(esc)
    }catch(ex:any){ setDocs([]); setEsts([]); setLoadError(ex?.message||'No se pudieron cargar las personas') }
    finally{ setLoading(false)}
  }
  useEffect(()=>{ load()},[])

  const createEst = async(e:React.FormEvent)=>{
    e.preventDefault()
    setEstMsg(null); setSaving(true)
    try{
      const r:any = await api.post('/api/v1/estudiantes', {
        codigo_estudiante: formEst.codigo, dni: formEst.dni, nombres: formEst.nombres, apellidos: formEst.apellidos, correo_institucional: formEst.correo, id_escuela: Number(formEst.escuela),
        crear_usuario: formEst.crearUsuario,
        password: formEst.password || 'undc2026',
        rol_actor: formEst.rolActor,
      })
      const aviso = r?.data?.aviso
      if(r?.data?.usuario_creado){
        setEstMsg({type:'ok', text:`Estudiante registrado con acceso al sistema (${formEst.correo})`})
      }else if(aviso){
        setEstMsg({type:'err', text: aviso})
      }else{
        setEstMsg({type:'ok', text:'Estudiante registrado'})
      }
      setFormEst({codigo:'', dni:'', nombres:'', apellidos:'', correo:'', escuela:'', crearUsuario:true, password:'', rolActor:'ESTUDIANTE_PROP'}); load()
    }catch(ex:any){ setEstMsg({type:'err', text: ex?.message?.slice(0,300)||'No se pudo registrar el estudiante'}) }
    finally{ setSaving(false) }
  }
  const createDoc = async(e:React.FormEvent)=>{
    e.preventDefault()
    setDocMsg(null); setSaving(true)
    try{
      await api.post('/api/v1/docentes', {codigo_docente: formDoc.codigo, dni: formDoc.dni, nombres: formDoc.nombres, apellidos: formDoc.apellidos, correo_institucional: formDoc.correo, id_escuela: Number(formDoc.escuela), tipo_docente: formDoc.tipo, carga_no_lectiva_max: Number(formDoc.carga)})
      setDocMsg({type:'ok', text:'Docente registrado'})
      setFormDoc({codigo:'', dni:'', nombres:'', apellidos:'', correo:'', escuela:'', tipo:'ORDINARIO_TC', carga:'8'}); load()
    }catch(ex:any){ setDocMsg({type:'err', text: ex?.message?.slice(0,300)||'No se pudo registrar el docente'}) }
    finally{ setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Docentes & Estudiantes"
        subtitle="Gestión de personas UNDC — validación carga no lectiva (Art.79/86), ciclos académicos y escuelas. Fuente para asignaciones RSU."
        icon={<Users size={20}/>}
        badge={<span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-xs font-bold">{docs.length} docentes · {ests.length} estudiantes</span>}
      />

      <div className="flex gap-2 flex-wrap">
        <Button variant={tab==='docentes'?'secondary':'outline'} onClick={()=>setTab('docentes')} leftIcon={<GraduationCap size={14}/>}>Docentes ({docs.length})</Button>
        <Button variant={tab==='estudiantes'?'secondary':'outline'} onClick={()=>setTab('estudiantes')} leftIcon={<Users size={14}/>}>Estudiantes ({ests.length})</Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <Input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder={tab==='docentes'?'Buscar docente por nombre/DNI/correo':'Buscar estudiante por nombre/DNI/código'} className="pl-9 bg-slate-50"/>
        </div>
        <Button onClick={load} className="sm:w-auto w-full">Buscar</Button>
      </Card>

      {loadError && <Alert variant="error"><div className="flex items-center justify-between gap-3"><span>{loadError}</span><Button size="sm" variant="outline" onClick={load}>Reintentar</Button></div></Alert>}

      {tab==='estudiantes' ? (
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <Card hover>
            <CardHeader>
              <CardTitle><Users size={16}/> Estudiantes</CardTitle>
              <p className="text-xs text-slate-500">Validación ciclo mínimo al inscribir a proyecto (HU-003) · Estudiante_Ciclo</p>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-64"/> :
                ests.length===0 ? <Empty title="Sin estudiantes" description="Registra el primero para probar asignaciones"/> :
                <div className="space-y-2 max-h-[280px] sm:max-h-[520px] overflow-auto pr-1">
                  {ests.map(s=>(
                    <div key={s.id_estudiante} className="border border-slate-200 rounded-xl p-3 flex gap-3">
                      <Avatar nombre={`${s.nombres||''} ${s.apellidos||''}`} correo={s.correo_institucional}/>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{s.apellidos}, {s.nombres}</div>
                        <div className="text-xs text-slate-500 flex gap-2 flex-wrap">
                          <span className="flex items-center gap-1"><CreditCard size={12}/>{s.dni}</span>
                          <span className="flex items-center gap-1"><Mail size={12}/>{s.correo_institucional}</span>
                          <span className="flex items-center gap-1"><Building2 size={12}/>{s.id_escuela}</span>
                        </div>
                        <div className="flex gap-1.5 mt-1"><Badge color="#1b5e20" variant="soft">{s.estado || 'ACTIVO'}</Badge><span className="text-xs bg-slate-100 border px-2 py-0.5 rounded-full font-mono">{s.codigo_estudiante}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader><CardTitle><Plus size={16}/> Nuevo estudiante</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={createEst} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><Label required>Código</Label><Input value={formEst.codigo} onChange={e=>setFormEst({...formEst, codigo:e.target.value})} placeholder="EST003"/></div><div><Label required>DNI</Label><Input value={formEst.dni} onChange={e=>setFormEst({...formEst, dni:e.target.value})} maxLength={8} placeholder="20000003"/></div></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><Label required>Nombres</Label><Input value={formEst.nombres} onChange={e=>setFormEst({...formEst, nombres:e.target.value})}/></div><div><Label required>Apellidos</Label><Input value={formEst.apellidos} onChange={e=>setFormEst({...formEst, apellidos:e.target.value})}/></div></div>
                <div><Label required>Correo institucional</Label><Input type="email" value={formEst.correo} onChange={e=>setFormEst({...formEst, correo:e.target.value})} placeholder="correo@undc.edu.pe"/></div>
                <div><Label required>Escuela</Label><Select value={formEst.escuela} onChange={e=>setFormEst({...formEst, escuela:e.target.value})}>
                  <option value="">-- seleccionar --</option>
                  {escuelas.map(s=> <option key={s.id_escuela} value={String(s.id_escuela)}>{s.nombre}</option>)}
                </Select></div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                  <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 accent-undc-700" checked={formEst.crearUsuario}
                      onChange={e=>setFormEst({...formEst, crearUsuario:e.target.checked})}/>
                    <span>Crear también el acceso al sistema<span className="block font-normal text-slate-500">El estudiante podrá iniciar sesión con este correo.</span></span>
                  </label>
                  {formEst.crearUsuario && (
                    <>
                      <div><Label>Contraseña inicial</Label><Input type="password" value={formEst.password} onChange={e=>setFormEst({...formEst, password:e.target.value})} placeholder="undc2026"/>
                        <div className="text-[11px] text-slate-500 mt-1">Si la dejas vacía se usa la clave institucional por defecto.</div></div>
                      <div><Label>Rol en el sistema</Label><Select value={formEst.rolActor} onChange={e=>setFormEst({...formEst, rolActor:e.target.value})}>
                        <option value="ESTUDIANTE_PROP">Estudiante proponente</option>
                        <option value="ESTUDIANTE_EJEC">Estudiante ejecutor</option>
                      </Select></div>
                    </>
                  )}
                </div>
                <Button type="submit" className="w-full" loading={saving}>Registrar estudiante</Button>
                {estMsg && <Alert variant={estMsg.type==='ok'?'success':'error'} className="text-xs">{estMsg.text}</Alert>}
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <Card hover>
            <CardHeader>
              <CardTitle><GraduationCap size={16} className="text-undc-700"/> Docentes</CardTitle>
              <p className="text-xs text-slate-500">Carga no lectiva máxima valida asignación a proyectos (Art.86) — RSU_Asignacion_Docente</p>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-64"/> :
                docs.length===0 ? <Empty title="Sin docentes" description={loadError || 'Registra el primero para probar asignaciones'}/> :
                <div className="space-y-2 max-h-[280px] sm:max-h-[520px] overflow-auto pr-1">
                  {docs.map(d=>(
                    <div key={d.id_docente} className="border border-slate-200 rounded-xl p-3 flex gap-3">
                      <Avatar nombre={`${d.nombres||''} ${d.apellidos||''}`} correo={d.correo_institucional}/>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{d.apellidos}, {d.nombres} · <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded border">{d.codigo_docente}</span></div>
                        <div className="text-xs text-slate-500 flex gap-2 flex-wrap">
                          <span className="flex items-center gap-1"><CreditCard size={12}/>{d.dni}</span><span className="flex items-center gap-1"><Mail size={12}/>{d.correo_institucional}</span>
                        </div>
                        <div className="flex gap-1.5 mt-1 flex-wrap"><Badge color="#1b5e20" variant="soft">{d.tipo_docente}</Badge>{d.categoria && <Badge color="#64748b" variant="soft">{d.categoria}</Badge>}<span className="text-xs px-2 py-1 bg-amber-50 border border-amber-200 rounded-full flex items-center gap-1"><Clock size={12}/> No lectiva máx {d.carga_no_lectiva_max}h</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader><CardTitle><Plus size={16}/> Nuevo docente</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={createDoc} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><Label required>Código</Label><Input value={formDoc.codigo} onChange={e=>setFormDoc({...formDoc, codigo:e.target.value})} placeholder="DOC003"/></div><div><Label required>DNI</Label><Input value={formDoc.dni} onChange={e=>setFormDoc({...formDoc, dni:e.target.value})} maxLength={8}/></div></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><Label required>Nombres</Label><Input value={formDoc.nombres} onChange={e=>setFormDoc({...formDoc, nombres:e.target.value})}/></div><div><Label required>Apellidos</Label><Input value={formDoc.apellidos} onChange={e=>setFormDoc({...formDoc, apellidos:e.target.value})}/></div></div>
                <div><Label required>Correo</Label><Input type="email" value={formDoc.correo} onChange={e=>setFormDoc({...formDoc, correo:e.target.value})}/></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><Label>Tipo</Label><Select value={formDoc.tipo} onChange={e=>setFormDoc({...formDoc, tipo:e.target.value})}><option>ORDINARIO_TC</option><option>ORDINARIO_DE</option><option>CONTRATADO</option></Select></div><div><Label>Carga no lectiva máx</Label><Input type="number" value={formDoc.carga} onChange={e=>setFormDoc({...formDoc, carga:e.target.value})}/></div></div>
                <div><Label required>Escuela</Label><Select value={formDoc.escuela} onChange={e=>setFormDoc({...formDoc, escuela:e.target.value})}>
                  <option value="">-- seleccionar --</option>
                  {escuelas.map(s=> <option key={s.id_escuela} value={String(s.id_escuela)}>{s.nombre}</option>)}
                </Select></div>
                <Button type="submit" className="w-full bg-undc-700 hover:bg-undc-800" loading={saving}>Registrar docente</Button>
                {docMsg && <Alert variant={docMsg.type==='ok'?'success':'error'} className="text-xs">{docMsg.text}</Alert>}
                <div className="text-xs bg-amber-50 border border-amber-200 rounded-xl p-2.5">Al asignar horas, el backend suma <b>SUM horas_asignadas</b> en el ciclo y valida ≤ carga_no_lectiva_max (Art.86).</div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
