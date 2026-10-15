import { useEffect, useState } from 'react'
import { api, asArray } from '../api/client'
import { validarArchivo } from '../lib/archivos'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { Empty } from '../components/ui/Empty'
import { Skeleton } from '../components/ui/Skeleton'
import { FileText, Upload, ShieldCheck, Hash, History, Download, Eye } from 'lucide-react'

export default function Documentos(){
  const {user} = useAuth()
  const [proyectos,setProyectos]=useState<any[]>([])
  const [tipos,setTipos]=useState<any[]>([])
  const [form,setForm]=useState({proyecto:'', tipo:'', usuario:String(user?.persona_id||'')})
  const [file,setFile]=useState<File|null>(null)
  const [msg,setMsg]=useState('')
  const [msgOk,setMsgOk]=useState(false)
  const [list,setList]=useState<any[]>([])
  const [loadingDocs,setLoadingDocs]=useState(false)
  const [errorDocs,setErrorDocs]=useState('')

  useEffect(()=>{
    const endpoint = user?.rol==='ESTUDIANTE' && user?.persona_id
      ? `/api/v1/estudiantes/${user.persona_id}/proyectos?limit=50`
      : user?.rol==='DOCENTE' && user?.persona_id
        ? `/api/v1/docentes/${user.persona_id}/proyectos?limit=50`
        : '/api/v1/proyectos?limit=50'
    api.get(endpoint).then((r:any)=>{
      const ps = asArray(r.data)
      setProyectos(ps)
      setForm(f=> ({...f, proyecto: f.proyecto || (ps[0]? String(ps[0].id_proyecto):'')}))
    }).catch(()=> setProyectos([]))
    api.get('/api/v1/catalogos/tipos-documento').then((r:any)=>{
      const ts = asArray(r.data)
      setTipos(ts)
      setForm(f=> ({...f, tipo: f.tipo || (ts[0]? String(ts[0].id_tipo_doc):'')}))
    }).catch(()=> setTipos([]))
  },[user?.persona_id, user?.rol])

  const loadDocs = async(pid:string)=>{
    if(!pid){ setList([]); setErrorDocs(''); return }
    setLoadingDocs(true); setErrorDocs('')
    try{
      const r:any = await api.get(`/api/v1/proyectos/${pid}/documentos`)
      setList(asArray(r.data))
    }catch(ex:any){ setList([]); setErrorDocs(ex?.message||'No se pudieron cargar los documentos') }
    finally{ setLoadingDocs(false) }
  }
  useEffect(()=>{ loadDocs(form.proyecto) },[form.proyecto])

  const upload = async(e:React.FormEvent)=>{
    e.preventDefault()
    setMsg(''); setMsgOk(false)
    if(!file){ setMsg('Selecciona un archivo (PDF, DOCX o XLSX)'); return }
    if(!form.proyecto){ setMsg('Selecciona un proyecto'); return }
    if(!form.tipo){ setMsg('Selecciona el tipo de documento'); return }
    // Validación cliente antes de subir (el backend revalida siempre).
    const errArchivo = validarArchivo(file, 'mixto')
    if(errArchivo){ setMsg(errArchivo); return }
    const fd = new FormData()
    fd.append('id_proyecto', form.proyecto)
    fd.append('id_tipo_doc', form.tipo)
    fd.append('id_usuario_subida', String(user?.persona_id||''))
    fd.append('archivo', file)
    try{
      await api.upload('/api/v1/documentos/upload', fd)
      setMsg('Documento subido ✓ — hash calculado'); setMsgOk(true)
      setFile(null)
      loadDocs(form.proyecto)
    }catch(ex:any){ setMsg(ex.message?.slice(0,200) || 'Error al subir — valida que seas miembro del proyecto (HU-033)'); setMsgOk(false) }
  }

  const abrir = (url:string)=>{ const u = api.fileUrl(url); if(u) window.open(u,'_blank','noopener') }
  const descargar = (nombre:string, url:string)=>{
    const u = api.fileUrl(url)
    if(!u) return
    const a = document.createElement('a')
    a.href = u; a.download = nombre || 'documento'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Documentos & Resoluciones"
        subtitle="RSU_Documento (hash, versión, vigente, tamaño_bytes) + RSU_Resolucion + RSU_Tipo_Documento por etapa FORMULACION/EJECUCION/EVALUACION/TRANSVERSAL."
        icon={<FileText size={20}/>}
        badge={<span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-xs font-bold">{list.length} documentos</span>}
      />

      <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6">
        <Card hover className="border-undc-200">
          <CardHeader>
            <CardTitle><Upload size={16} className="text-undc-700"/> Subir documento (multipart)</CardTitle>
            <p className="text-xs text-slate-500">Cualquier miembro del equipo (líder o participante ACTIVO/INSCRITO) puede subir en estados no finales. Validado backend por membresía.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={upload} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label required>Proyecto</Label>
                  <Select value={form.proyecto} onChange={e=>setForm({...form, proyecto:e.target.value})}>
                    <option value="">-- seleccionar --</option>
                    {proyectos.map(p=> <option key={p.id_proyecto} value={String(p.id_proyecto)}>{p.codigo_proyecto} — {p.titulo}</option>)}
                  </Select>
                </div>
                <div>
                  <Label required>Tipo de documento</Label>
                  <Select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})}>
                    <option value="">-- seleccionar --</option>
                    {tipos.map(t=> <option key={t.id_tipo_doc} value={String(t.id_tipo_doc)}>{t.id_tipo_doc} {t.nombre}</option>)}
                  </Select>
                </div>
                
              </div>
              {proyectos.length===0 && <Alert variant="warning" className="text-xs">No se encontraron proyectos disponibles para tu usuario.</Alert>}
              <div>
                <Label required>Archivo (PDF/DOCX/XLSX, máx 20MB)</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center bg-slate-50 hover:bg-white hover:border-undc-300 transition-colors">
                  <Upload className="mx-auto text-slate-400" size={24}/>
                  <div className="text-sm font-semibold mt-1">{file ? file.name : 'Arrastra o selecciona el archivo'}</div>
                  <input type="file" accept=".pdf,.docx,.xlsx" onChange={e=>setFile(e.target.files?.[0]||null)} className="mt-2 text-xs w-full"/>
                  {file && <div className="text-xs text-slate-500 mt-1">{(file.size/1024).toFixed(1)} KB · {file.type||'application/octet-stream'}</div>}
                </div>
              </div>
              <Button type="submit" className="w-full bg-undc-700 hover:bg-undc-800">Subir y versionar</Button>
              {msg && <Alert variant={msgOk?'success':'error'} className="text-xs">{msg}</Alert>}
              <Alert variant="warning" className="text-xs">Si ves <b>403</b>: no eres miembro del proyecto. Pide al docente que te inscriba vía <code>POST /asignaciones/estudiante</code>.</Alert>
            </form>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle><History size={16}/> Repositorio versionado</CardTitle>
            <p className="text-xs text-slate-500">Cada subida genera versión +1, marca vigente=true y guarda hash_archivo</p>
          </CardHeader>
          <CardContent>
            {!form.proyecto ? (
              <Empty title="Sin proyecto seleccionado" description="Selecciona un proyecto para ver sus documentos."/>
            ) : loadingDocs ? (
              <div className="space-y-2"><Skeleton className="h-20"/><Skeleton className="h-20"/><Skeleton className="h-20"/></div>
            ) : errorDocs ? (
              <Alert variant="error" className="text-xs">
                <div className="flex items-center justify-between gap-3"><span>{errorDocs}</span><Button size="sm" variant="outline" onClick={()=>loadDocs(form.proyecto)}>Reintentar</Button></div>
              </Alert>
            ) : list.length===0 ? (
              <Empty title="Sin documentos" description="Este proyecto aún no tiene archivos en su repositorio."/>
            ) : (
              <div className="space-y-2">
                {list.map(d=>(
                  <div key={d.id_documento} className="border border-slate-200 rounded-xl p-3 flex flex-wrap gap-3 hover:bg-slate-50">
                    <div className="w-10 h-10 rounded-xl bg-undc-600 text-white grid place-items-center shrink-0"><FileText size={18}/></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{d.nombre_archivo}</div>
                      <div className="text-xs text-slate-500 flex gap-2 flex-wrap">
                        <Badge color={d.tipo_doc?.etapa==='FORMULACION'?'#3f51b5':d.tipo_doc?.etapa==='EJECUCION'?'#009688':'#9c27b0'} variant="soft">{d.tipo_doc?.etapa || '—'}</Badge>
                        v{d.version} · <span className="flex items-center gap-1"><Hash size={12}/>{(d.hash_archivo||'—').slice(0,12)}</span> · {d.fecha_subida? new Date(d.fecha_subida).toLocaleDateString('es-PE'):'—'}
                      </div>
                      <div className="text-xs"><span className={d.vigente?'text-emerald-700 font-semibold':'text-slate-500'}>{d.vigente?'VIGENTE':'HISTÓRICO'}</span> · {d.tipo_doc?.nombre || `Tipo ${d.id_tipo_doc}`} {d.tamano_bytes? `· ${(d.tamano_bytes/1024).toFixed(0)} KB`:''}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="outline" leftIcon={<Eye size={12}/>} onClick={()=>abrir(d.url_archivo)} disabled={!d.url_archivo}>Ver</Button>
                      <Button size="sm" variant="soft" leftIcon={<Download size={12}/>} onClick={()=>descargar(d.nombre_archivo, d.url_archivo)} disabled={!d.url_archivo}>Descargar</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle><ShieldCheck size={16}/> Tipos por etapa</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3 text-xs">
          <div className="border rounded-xl p-3 bg-undc-50 border-undc-200"><b>FORMULACION</b><ul className="mt-1 list-disc ml-4 text-slate-600"><li>Perfil de Proyecto</li><li>Informe Viabilidad</li><li>Resolución Aprobación</li><li>Plan Carga Horaria</li></ul></div>
          <div className="border rounded-xl p-3 bg-undc-50 border-undc-200"><b>EJECUCION</b><ul className="mt-1 list-disc ml-4 text-slate-600"><li>Acta Compromiso</li><li>Pecosa / Rendición</li><li>Ficha Asistencia</li><li>Informe Monitoreo</li><li>Informe Final</li></ul></div>
          <div className="border rounded-xl p-3 bg-undc-50 border-undc-200"><b>EVALUACION</b><ul className="mt-1 list-disc ml-4 text-slate-600"><li>Encuesta Satisfacción</li><li>Matriz Indicadores</li><li>Informe Impacto</li><li>Memoria Anual</li></ul></div>
        </CardContent>
      </Card>
    </div>
  )
}
