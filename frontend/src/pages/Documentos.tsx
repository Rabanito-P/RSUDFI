import { useState } from 'react'
import { api } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { FileText, Upload, ShieldCheck, Hash, History, Download, Eye } from 'lucide-react'

export default function Documentos(){
  const [form,setForm]=useState({proyecto:'1', tipo:'1', usuario:'1'})
  const [file,setFile]=useState<File|null>(null)
  const [msg,setMsg]=useState('')
  const [list,setList]=useState<any[]>([
    {id_documento:1, nombre_archivo:'Perfil de Proyecto.pdf', tipo:'Perfil de Proyecto', etapa:'FORMULACION', version:1, vigente:true, hash:'a3f5c9…', fecha:'2026-03-10'},
    {id_documento:2, nombre_archivo:'Informe Viabilidad.pdf', tipo:'Informe Técnico', etapa:'FORMULACION', version:1, vigente:true, hash:'b7e2d1…', fecha:'2026-03-15'},
    {id_documento:3, nombre_archivo:'Ficha Asistencia 12-05.pdf', tipo:'Ficha de Asistencia', etapa:'EJECUCION', version:2, vigente:true, hash:'c8f1a4…', fecha:'2026-05-12'},
  ])

  const upload = async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!file){ setMsg('Selecciona archivo PDF'); return }
    const fd = new FormData()
    fd.append('id_proyecto', form.proyecto)
    fd.append('id_tipo_doc', form.tipo)
    fd.append('id_usuario_subida', form.usuario)
    fd.append('archivo', file)
    try{
      const r:any = await api.upload('/api/v1/documentos/upload', fd)
      setMsg('Documento subido ✓ — hash calculado'); setList([r.data, ...list])
    }catch(ex:any){ setMsg(ex.message?.slice(0,200) || 'Error al subir — valida que seas miembro del proyecto (HU-033)')}
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
              <div className="grid grid-cols-3 gap-3">
                <div><Label>ID Proyecto</Label><Input value={form.proyecto} onChange={e=>setForm({...form, proyecto:e.target.value})} /></div>
                <div><Label>ID Tipo Doc</Label>
                  <Select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})}>
                    <option value="1">1 Perfil</option><option value="2">2 Viabilidad</option><option value="3">3 Resolución Aprob.</option><option value="7">7 Ficha Asistencia</option><option value="11">11 Encuesta</option><option value="12">12 Matriz Indicadores</option>
                  </Select>
                </div>
                <div><Label>ID Usuario subida</Label><Input value={form.usuario} onChange={e=>setForm({...form, usuario:e.target.value})}/></div>
              </div>
              <div>
                <Label required>Archivo (PDF, máx 20MB)</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center bg-slate-50 hover:bg-white hover:border-undc-300 transition-colors">
                  <Upload className="mx-auto text-slate-400" size={24}/>
                  <div className="text-sm font-semibold mt-1">{file ? file.name : 'Arrastra o selecciona PDF'}</div>
                  <input type="file" accept=".pdf,.docx,.xlsx,.jpg,.png" onChange={e=>setFile(e.target.files?.[0]||null)} className="mt-2 text-xs w-full"/>
                  {file && <div className="text-xs text-slate-500 mt-1">{(file.size/1024).toFixed(1)} KB · {file.type}</div>}
                </div>
              </div>
              <Button type="submit" className="w-full bg-undc-700 hover:bg-undc-800">Subir y versionar</Button>
              {msg && <Alert variant={msg.includes('✓')?'success':'error'} className="text-xs">{msg}</Alert>}
              <Alert variant="warning" className="text-xs">Si ves <b>403</b>: no eres miembro del proyecto. Pide al docente que te inscriba vía <code>POST /asignaciones/estudiante</code>.</Alert>
            </form>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle><History size={16}/> Repositorio versionado</CardTitle>
            <p className="text-xs text-slate-500">Cada subida genera versión +1, marca vigente=true y guarda hash_archivo</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {list.map(d=>(
              <div key={d.id_documento} className="border border-slate-200 rounded-xl p-3 flex gap-3 hover:bg-slate-50">
                <div className="w-10 h-10 rounded-xl bg-undc-600 text-white grid place-items-center shrink-0"><FileText size={18}/></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{d.nombre_archivo}</div>
                  <div className="text-xs text-slate-500 flex gap-2 flex-wrap"><Badge color={d.etapa==='FORMULACION'?'#3f51b5':d.etapa==='EJECUCION'?'#009688':'#9c27b0'} variant="soft">{d.etapa}</Badge> v{d.version} · <span className="flex items-center gap-1"><Hash size={12}/>{d.hash}</span> · {d.fecha}</div>
                  <div className="text-xs"><span className={d.vigente?'text-emerald-700 font-semibold':'text-slate-500'}>{d.vigente?'VIGENTE':'HISTÓRICO'}</span> · {d.tipo}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="outline" leftIcon={<Eye size={12}/>}>Ver</Button>
                  <Button size="sm" variant="soft" leftIcon={<Download size={12}/>}>Descargar</Button>
                </div>
              </div>
            ))}
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
