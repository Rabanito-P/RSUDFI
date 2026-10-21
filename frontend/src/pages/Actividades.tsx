import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api, asArray } from '../api/client'
import { validarArchivo } from '../lib/archivos'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label, Textarea, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Alert } from '../components/ui/Alert'
import { Empty } from '../components/ui/Empty'
import { Modal } from '../components/ui/Modal'
import { ClipboardList, Calendar, MapPin, Clock, Plus, Camera, Users, CheckCircle2 } from 'lucide-react'

type Msg = {type:'ok'|'err', text:string} | null

export default function Actividades(){
  const { user } = useAuth()
  const [activs,setActivs]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [proyectos,setProyectos]=useState<any[]>([])
  const [proyectoId,setProyectoId]=useState<string>('')
  const [form,setForm]=useState({nombre:'', lugar:'', fecha:'', desc:''})
  const [saving,setSaving]=useState(false)
  const [formMsg,setFormMsg]=useState<Msg>(null)
  const [busyId,setBusyId]=useState<number|null>(null)
  const [listMsg,setListMsg]=useState<Msg>(null)

  const [modal,setModal]=useState<'fotos'|'asistencia'|null>(null)
  const [actSel,setActSel]=useState<any>(null)
  const [fotos,setFotos]=useState<any[]>([])
  const [fotosLoading,setFotosLoading]=useState(false)
  const [fotosError,setFotosError]=useState('')
  const [fichaFile,setFichaFile]=useState<File|null>(null)
  const [fichaMsg,setFichaMsg]=useState<Msg>(null)
  const [fichaBusy,setFichaBusy]=useState(false)
  const [benef,setBenef]=useState<any[]>([])
  const [benError,setBenError]=useState('')
  const [benLoading,setBenLoading]=useState(false)
  // HU-013: asistencia real — asistentes marcados (checkbox), firma escaneada
  // opcional y dedup del backend (reintentar no duplica).
  const [asistSel,setAsistSel]=useState<number[]>([])
  const [asistMsg,setAsistMsg]=useState<Msg>(null)
  const [asistBusy,setAsistBusy]=useState(false)
  const [firmaFile,setFirmaFile]=useState<File|null>(null)

  useEffect(()=>{
    if(!user) return
    const endpoint = user.rol === 'ESTUDIANTE'
      ? `/api/v1/estudiantes/${user.persona_id}/proyectos?limit=50`
      : user.rol === 'DOCENTE'
        ? `/api/v1/docentes/${user.persona_id}/proyectos?limit=50`
        : '/api/v1/proyectos?limit=50'
    api.get(endpoint).then((r:any)=>{
      const list = asArray(r.data)
      setProyectos(list)
      setProyectoId(prev=> prev || (list[0]? String(list[0].id_proyecto):''))
    }).catch(()=>{ setProyectos([]); setError('No se pudieron cargar tus proyectos') })
  },[user?.persona_id, user?.rol])

  const load = ()=>{
    if (!proyectoId){ setActivs([]); setLoading(false); return }
    setLoading(true); setError('')
    api.get(`/api/v1/proyectos/${proyectoId}/actividades`)
      .then((r:any)=> setActivs(asArray(r.data)))
      .catch((e:any)=>{ setActivs([]); setError(e?.message||'No se pudieron cargar las actividades') })
      .finally(()=> setLoading(false))
  }
  useEffect(()=>{ load() },[proyectoId])

  const submit = async(e:React.FormEvent)=>{
    e.preventDefault()
    setFormMsg(null)
    if(!proyectoId){ setFormMsg({type:'err', text:'Selecciona un proyecto'}); return }
    if(!form.nombre){ setFormMsg({type:'err', text:'El nombre es obligatorio'}); return }
    setSaving(true)
    try{
      await api.post('/api/v1/actividades', {id_proyecto:Number(proyectoId), nombre: form.nombre, descripcion: form.desc || undefined, fecha_programada: form.fecha||null, lugar: form.lugar||undefined})
      setForm({nombre:'', lugar:'', fecha:'', desc:''})
      setFormMsg({type:'ok', text:'Actividad programada'})
      load()
    }catch(ex:any){ setFormMsg({type:'err', text: ex?.message||'No se pudo programar la actividad'}) }
    finally{ setSaving(false) }
  }

  const marcarEjecutada = async(a:any)=>{
    setListMsg(null); setBusyId(a.id_actividad)
    try{
      if(a.estado==='PROGRAMADA'){
        await api.patch(`/api/v1/actividades/${a.id_actividad}/estado`, {estado:'EN_EJECUCION'})
      }
      await api.patch(`/api/v1/actividades/${a.id_actividad}/estado`, {estado:'EJECUTADA'})
      setListMsg({type:'ok', text:`"${a.nombre}" marcada como EJECUTADA`})
      load()
    }catch(ex:any){ setListMsg({type:'err', text: ex?.message||'No se pudo actualizar el estado'}) }
    finally{ setBusyId(null) }
  }

  const verFotos = async(a:any)=>{
    setActSel(a); setModal('fotos'); setFotos([]); setFotosError(''); setFichaFile(null); setFichaMsg(null); setFotosLoading(true)
    try{
      const r:any = await api.get(`/api/v1/actividades/${a.id_actividad}/fotos`)
      setFotos(asArray(r.data))
    }catch(ex:any){ setFotos([]); setFotosError(ex?.message||'No se pudieron cargar las fotos') }
    finally{ setFotosLoading(false) }
  }

  const verAsistencia = async(a:any)=>{
    setActSel(a); setModal('asistencia'); setBenef([]); setBenError(''); setAsistSel([]); setFirmaFile(null); setAsistMsg(null); setFichaFile(null); setFichaMsg(null); setBenLoading(true)
    const pid = a.id_proyecto || proyectoId
    try{
      const r:any = await api.get(`/api/v1/proyectos/${pid}/beneficiarios`)
      const lista = asArray(r.data)
      setBenef(lista)
      // Pre-marcados: los que ya tienen registro en RSU_Asistencia_Beneficiario.
      const a2:any = await api.get(`/api/v1/actividades/${a.id_actividad}/asistencia`)
      const yaMarcados = (asArray(a2.data) as any[]).map((x)=> x.id_beneficiario)
      setAsistSel(yaMarcados)
    }catch(ex:any){ setBenef([]); setBenError(ex?.message||'No se pudieron cargar los beneficiarios') }
    finally{ setBenLoading(false) }
  }

  const toggleAsist = (id:number)=>{
    setAsistSel(prev=> prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  const guardarAsistencia = async ()=>{
    if(!actSel) return
    if(asistSel.length===0){ setAsistMsg({type:'err', text:'Marca al menos un beneficiario asistente'}); return }
    if(firmaFile){
      const errFirma = validarArchivo(firmaFile, 'foto')
      if(errFirma){ setAsistMsg({type:'err', text: errFirma}); return }
    }
    setAsistBusy(true); setAsistMsg(null)
    try{
      const fd = new FormData()
      asistSel.forEach(id=> fd.append('beneficiarios', String(id)))
      if(firmaFile) fd.append('firma', firmaFile)
      const r:any = await api.upload(`/api/v1/actividades/${actSel.id_actividad}/asistencia`, fd)
      const d = r.data||{}
      // La lista canónica la devuelve el GET de asistencia.
      const a2:any = await api.get(`/api/v1/actividades/${actSel.id_actividad}/asistencia`)
      const ya = (asArray(a2.data) as any[]).map((x)=> x.id_beneficiario)
      setAsistSel(ya)
      setFirmaFile(null)
      setAsistMsg({type:'ok', text:`Asistencia guardada ✓ ${d.registradas??0} nueva(s)${d.omitidas_duplicadas? ` · ${d.omitidas_duplicadas} ya registrada(s)`:''}${d.sin_vinculacion? ` · ${d.sin_vinculacion} sin vinculación`:''}`})
      load()
    }catch(ex:any){ setAsistMsg({type:'err', text: ex?.message||'No se pudo guardar la asistencia'}) }
    finally{ setAsistBusy(false) }
  }

  const subirFicha = async ()=>{
    if(!fichaFile || !actSel) return
    // Validación cliente antes de subir (el backend revalida siempre).
    const errArchivo = validarArchivo(fichaFile, 'foto')
    if(errArchivo){ setFichaMsg({type:'err', text: errArchivo}); setFichaBusy(false); return }
    setFichaBusy(true); setFichaMsg(null)
    try{
      const fd = new FormData()
      fd.append('id_actividad', String(actSel.id_actividad))
      fd.append('archivo', fichaFile)
      await api.upload('/api/v1/actividades/fotos', fd)
      setFichaMsg({type:'ok', text:'Ficha subida ✓'})
      setFichaFile(null)
      const r:any = await api.get(`/api/v1/actividades/${actSel.id_actividad}/fotos`)
      setFotos(asArray(r.data))
    }catch(ex:any){ setFichaMsg({type:'err', text: ex?.message||'No se pudo subir la ficha'}) }
    finally{ setFichaBusy(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Actividades de Campo"
        subtitle="RSU_Actividad_Campo + RSU_Actividad_Foto + RSU_Asistencia_Beneficiario. Programación, ejecución con hora inicio/fin y minutos, lugar, responsable y evidencia fotográfica."
        icon={<ClipboardList size={20}/>}
        badge={<span className="px-2.5 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full text-xs font-bold">{activs.length} actividades</span>}
      />

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card hover>
          <CardHeader>
            <CardTitle><Plus size={16} className="text-undc-700"/> Programar actividad</CardTitle>
            <p className="text-xs text-slate-500">Estado inicial PROGRAMADA · luego EJECUTADA / CANCELADA · Vinculable a entregable</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label required>Proyecto</Label>
                  <Select value={proyectoId} onChange={e=>setProyectoId(e.target.value)}>
                    <option value="">-- seleccionar --</option>
                    {proyectos.map(p=> <option key={p.id_proyecto} value={String(p.id_proyecto)}>{p.codigo_proyecto} — {p.titulo}</option>)}
                  </Select>
                </div>
                <div><Label>Fecha programada</Label><Input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})}/></div>
              </div>
              <div><Label required>Nombre</Label><Input value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} placeholder="Jornada salud — San Vicente" required/></div>
              <div><Label>Lugar</Label><Input value={form.lugar} onChange={e=>setForm({...form, lugar:e.target.value})} placeholder="Posta, I.E., comunidad..."/></div>
              <div><Label>Descripción</Label><Textarea rows={3} value={form.desc} onChange={e=>setForm({...form, desc:e.target.value})} placeholder="Objetivo, metodología, beneficiarios esperados..."/></div>
              <Button type="submit" className="w-full bg-undc-700 hover:bg-undc-800" loading={saving}>Programar actividad</Button>
              {formMsg && <Alert variant={formMsg.type==='ok'?'success':'error'} className="text-xs">{formMsg.text}</Alert>}
              <Alert variant="info" className="text-xs">Cualquier miembro del equipo (líder o participante ACTIVO) puede registrar — validado por <code>canStudentRegisterActivity</code> en EN_EJECUCION / EN_MONITOREO.</Alert>
            </form>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle><Calendar size={16}/> Próximas actividades</CardTitle>
            <p className="text-xs text-slate-500">Ver fotos, asistencia de beneficiarios y avance de ejecución</p>
          </CardHeader>
          <CardContent>
            {listMsg && <Alert variant={listMsg.type==='ok'?'success':'error'} className="text-xs mb-3">{listMsg.text}</Alert>}
            {loading ? <div className="space-y-2"><Skeleton className="h-20"/><Skeleton className="h-20"/></div> :
              error ? <Alert variant="error" className="text-xs"><div className="flex items-center justify-between gap-3"><span>{error}</span><Button size="sm" variant="outline" onClick={load}>Reintentar</Button></div></Alert> :
              activs.length===0 ? <Empty title="Sin actividades" description={proyectoId? 'Programa la primera actividad de campo para este proyecto.':'Selecciona un proyecto para ver sus actividades.'}/> :
              <div className="space-y-3">
                {activs.map(a=>(
                  <div key={a.id_actividad} className="border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${a.estado==='EJECUTADA'?'bg-emerald-600': a.estado==='PROGRAMADA'?'bg-amber-500': a.estado==='EN_EJECUCION'?'bg-sky-600':'bg-slate-400'}`}>{a.estado}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={12}/>{a.fecha_programada?.slice(0,10) || '—'}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/>{a.lugar || '—'}</span>
                    </div>
                    <div className="font-semibold text-slate-900 mt-2">{a.nombre}</div>
                    <div className="text-xs text-slate-500 mt-1">{a.descripcion}</div>
                    <div className="flex gap-2 mt-3 text-xs flex-wrap">
                      <span className="px-2 py-1 bg-slate-50 border rounded-full flex items-center gap-1"><Users size={12}/>{a.nro_beneficiarios||0} benef.</span>
                      {a.minutos ? <span className="px-2 py-1 bg-slate-50 border rounded-full flex items-center gap-1"><Clock size={12}/>{a.minutos} min</span> : null}
                      {a.fotos ? <span className="px-2 py-1 bg-slate-50 border rounded-full flex items-center gap-1"><Camera size={12}/>{a.fotos.length} fotos</span> : null}
                    </div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={()=>verFotos(a)} leftIcon={<Camera size={12}/>}>Ver fotos</Button>
                      <Button size="sm" variant="soft" onClick={()=>verAsistencia(a)} leftIcon={<Users size={12}/>}>Asistencia</Button>
                      {(a.estado==='PROGRAMADA' || a.estado==='EN_EJECUCION') && <Button size="sm" className="bg-undc-700 hover:bg-undc-800" loading={busyId===a.id_actividad} onClick={()=>marcarEjecutada(a)} leftIcon={<CheckCircle2 size={12}/>}>Marcar ejecutada</Button>}
                    </div>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle><CheckCircle2 size={16}/> Flujo evidencia</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="border rounded-xl p-3 bg-amber-50 border-amber-200"><b>1. PROGRAMADA</b><div className="text-xs text-slate-600 mt-1">Se crea con fecha, lugar y entregable opcional</div></div>
          <div className="border rounded-xl p-3 bg-undc-50 border-undc-200"><b>2. EJECUTADA</b><div className="text-xs text-slate-600 mt-1">Se registra hora inicio/fin, minutos y asistencia con firma_url</div></div>
          <div className="border rounded-xl p-3 bg-emerald-50 border-emerald-200"><b>3. VERIFICADA</b><div className="text-xs text-slate-600 mt-1">Docente verifica + fotos RSU_Actividad_Foto</div></div>
        </CardContent>
      </Card>

      <Modal open={modal==='fotos'} onClose={()=>setModal(null)} title={actSel? `Fotos — ${actSel.nombre}` : 'Fotos'} desc="GET /api/v1/actividades/:id/fotos" width="max-w-2xl"
        footer={<>
          <Button variant="outline" onClick={()=>setModal(null)}>Cerrar</Button>
          <Button onClick={subirFicha} loading={fichaBusy} disabled={!fichaFile}>Subir ficha / foto</Button>
        </>}>
        {fotosLoading ? <Skeleton className="h-40 w-full"/> :
          fotosError ? <Alert variant="error" className="text-xs">{fotosError}</Alert> :
          fotos.length===0 ? <Empty title="Sin fotos" description="Esta actividad aún no tiene evidencia fotográfica."/> :
          (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {fotos.map(f=>(
                <a key={f.id_foto} href={api.fileUrl(f.url_foto)} target="_blank" rel="noopener noreferrer" className="block group">
                  <img src={api.fileUrl(f.url_foto)} alt={f.descripcion||'Evidencia'} className="w-full h-32 object-cover rounded-xl border border-slate-200 group-hover:opacity-90"/>
                  <div className="text-[11px] text-slate-500 mt-1 truncate">{f.descripcion || (f.fecha_subida? new Date(f.fecha_subida).toLocaleDateString('es-PE'):'Foto')}</div>
                </a>
              ))}
            </div>
          )
        }
        <div className="mt-4 border-2 border-dashed border-slate-200 rounded-xl p-3 text-center">
          <div className="text-xs text-slate-500">Ficha de asistencia firmada o foto (JPG/PNG, máx 2MB)</div>
          <input type="file" accept=".jpg,.jpeg,.png" onChange={e=>setFichaFile(e.target.files?.[0]||null)} className="mt-2 text-xs w-full"/>
          {fichaFile && <div className="text-[11px] text-slate-500 mt-1">{fichaFile.name}</div>}
        </div>
        {fichaMsg && <Alert variant={fichaMsg.type==='ok'?'success':'error'} className="text-xs mt-3">{fichaMsg.text}</Alert>}
      </Modal>

      <Modal open={modal==='asistencia'} onClose={()=>setModal(null)} title={actSel? `Asistencia — ${actSel.nombre}` : 'Asistencia'} desc="Marca a los beneficiarios asistentes (RSU_Asistencia_Beneficiario)" width="max-w-xl"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={()=>setModal(null)}>Cerrar</Button>
            <Button onClick={guardarAsistencia} disabled={asistBusy || benLoading}>{asistBusy? 'Guardando…' : 'Guardar asistencia'}</Button>
          </div>
        }>
        {benLoading ? <Skeleton className="h-32 w-full"/> :
          benError ? <Alert variant="error" className="text-xs">{benError}</Alert> :
          benef.length===0 ? <Empty title="Sin beneficiarios" description="Vincula beneficiarios al proyecto para registrar su asistencia."/> :
          (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Asistentes: <b className="text-undc-700">{asistSel.length}</b> de {benef.length}</span>
                <button type="button" onClick={()=>setAsistSel(asistSel.length===benef.length? [] : benef.map(b=>b.id_beneficiario))} className="underline hover:text-undc-700">
                  {asistSel.length===benef.length? 'Desmarcar todos':'Marcar todos'}
                </button>
              </div>
              <div className="space-y-2 max-h-[260px] sm:max-h-[360px] overflow-y-auto pr-1">
                {benef.map(b=>(
                  <label key={b.id_beneficiario} className="border border-slate-200 rounded-xl p-3 flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={asistSel.includes(b.id_beneficiario)} onChange={()=>toggleAsist(b.id_beneficiario)} className="h-4 w-4 accent-[#4338ca]"/>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{b.razon_social || `${b.apellidos||''}, ${b.nombres||''}`}</div>
                      <div className="text-xs text-slate-500">{b.dni||b.ruc||'S/D'} · {b.distrito||'—'}</div>
                    </div>
                    <Badge color="#0ea5e9" variant="soft" size="sm">{b.tipo_beneficiario}</Badge>
                  </label>
                ))}
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500">Firma del registro escaneada (opcional, JPG/PNG, máx 2MB)</div>
                <input type="file" accept=".jpg,.jpeg,.png" onChange={e=>setFirmaFile(e.target.files?.[0]||null)} className="mt-2 text-xs w-full"/>
                {firmaFile && <div className="text-[11px] text-slate-500 mt-1">{firmaFile.name}</div>}
              </div>
              {asistMsg && <Alert variant={asistMsg.type==='ok'?'success':'error'} className="text-xs">{asistMsg.text}</Alert>}
            </div>
          )
        }
      </Modal>
    </div>
  )
}
