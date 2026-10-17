import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api, asArray } from '../api/client'
import { validarArchivo } from '../lib/archivos'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from '../components/ui/Card'
import { Input, Textarea, Label } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { mensajeError } from '../lib/errores'
import { Upload, AlertCircle, FileText, CheckCircle2, Download, FileSpreadsheet, FileDown, Users, UserPlus, X } from 'lucide-react'

// Plantillas que el estudiante descarga antes de llenar el proyecto.
// El backend las sirve desde documentos/plantillas (GET /api/v1/actividades/plantilla-planificacion).
const API_BASE = (import.meta as any).env?.VITE_API_URL ?? ''

export default function CrearProyecto(){
  const {user} = useAuth()
  const nav = useNavigate()
  const [tipos,setTipos]=useState<any[]>([])
  const [lineas,setLineas]=useState<any[]>([])
  const [escuelas,setEscuelas]=useState<any[]>([])
  const [docentes,setDocentes]=useState<any[]>([])
  const [form,setForm]=useState({titulo:'', id_tipo:'', modalidad:'SSU', id_linea:'', id_escuela:'', descripcion:'', objetivo_general:'', poblacion:'', lugar:'', fecha_inicio:'', fecha_fin:'', presupuesto:'', semestre:'', ciclo: '', celular: '', docente: ''})
  const [file,setFile]=useState<File|null>(null)
  const [excel,setExcel]=useState<File|null>(null)
  const [catalogErr,setCatalogErr]=useState('')
  const [err,setErr]=useState('')
  const [ok,setOk]=useState('')
  const [loading,setLoading]=useState(false)
  // Equipo: mínimo 2 estudiantes (líder + 1) y máximo 5 en total.
  const [equipo,setEquipo]=useState<{nombres:string, apellidos:string, correo:string}[]>([])
  const [nuevo,setNuevo]=useState({nombres:'', apellidos:'', correo:''})
  // PEPs abiertos para unirse en vez de crear (HU-063).
  const [peps,setPeps]=useState<any[]>([])
  const [pepsCupos,setPepsCupos]=useState<Record<number,string>>({})
  const [pepsError,setPepsError]=useState('')

  // Validación del participante en curso (para marcar el campo y el botón).
  const correoValido = /^[^\s@]+@undc\.edu\.pe$/i.test(nuevo.correo.trim())
  const puedeAnadir =
    nuevo.nombres.trim().length >= 2 &&
    correoValido &&
    !equipo.some(m => m.correo.trim().toLowerCase() === nuevo.correo.trim().toLowerCase()) &&
    nuevo.correo.trim().toLowerCase() !== (user?.correo || '').toLowerCase()

  // HU-069: el estudiante siempre propone SSU. La modalidad, el tipo y la línea
  // de acción los fija el sistema (se guardan directo en la BD): el formulario
  // no debe pedirlos. Docente/Comité sí eligen (ellos crean los PEP).
  const esEstudiante = user?.rol === 'ESTUDIANTE'
  useEffect(()=>{
    if(esEstudiante){ setForm(f=> ({...f, id_tipo:'1', modalidad:'SSU', id_linea:''})) }
  },[esEstudiante])

  useEffect(()=>{
    api.get('/api/v1/catalogos/tipos-proyecto').then((r:any)=>setTipos(asArray(r.data))).catch((e:any)=>{ setTipos([]); setCatalogErr(prev=>prev||e?.message||'No se pudo cargar el catálogo de tipos de proyecto') })
    api.get('/api/v1/catalogos/lineas-accion').then((r:any)=>setLineas(asArray(r.data))).catch((e:any)=>{ setLineas([]); setCatalogErr(prev=>prev||e?.message||'No se pudo cargar el catálogo de líneas de acción') })
    api.get('/api/v1/escuelas').then((r:any)=>setEscuelas(asArray(r.data))).catch((e:any)=>{ setEscuelas([]); setCatalogErr(prev=>prev||e?.message||'No se pudo cargar el catálogo de escuelas') })
    // HU-002: docente asesor obligatorio al crear. Máximo 2 equipos por docente.
    api.get('/api/v1/docentes?limit=200').then((r:any)=>setDocentes(asArray(r.data))).catch(()=> setDocentes([]))
    api.get('/api/v1/ciclos').then((r:any)=>{
      const cs = asArray(r.data)
      const activo = cs.find((c:any)=> c.activo) || cs[0]
      if(activo?.id_ciclo) setForm(f=> ({...f, ciclo: String(activo.id_ciclo)}))
    }).catch((e:any)=> setCatalogErr(prev=>prev||e?.message||'No se pudo cargar el ciclo académico activo'))
    // PEPs abiertos (HU-063): el estudiante puede unirse en vez de crear su SSU.
    api.get('/api/v1/proyectos?modalidad=PEP_FINANCIADO,PEP_AUTOFINANCIADO&limit=12').then(async (r:any)=>{
      const lista = asArray(r.data)
      setPeps(lista)
      // Cupos por proyecto (miembros + líder si no figura como participante).
      const cupos: Record<number,string> = {}
      await Promise.all(lista.map(async (p:any)=>{
        try{
          const m:any = await api.get(`/api/v1/proyectos/${p.id_proyecto}/estudiantes`)
          const ms = asArray(m.data)
          const ids = ms.map((x:any)=> x.id_estudiante)
          const ocup = ms.length + ((p.id_estudiante_lider && !ids.includes(p.id_estudiante_lider)) ? 1 : 0)
          cupos[p.id_proyecto] = `${ocup}/5`
        }catch{ cupos[p.id_proyecto] = '—/5' }
      }))
      setPepsCupos(cupos)
    }).catch((e:any)=> setPepsError(mensajeError(e, 'No se pudieron cargar los PEPs abiertos.')))
  },[])

  // Descarga de un formato por su código del catálogo (PROPUESTA,
  // PLANIFICACION, ENCUESTA...). El backend devuelve el archivo que tenga
  // publicado el administrador, o el original si no ha subido ninguno.
  const descargarPlantilla = (codigo: string) => async () => {
    setErr('')
    try{
      const raw = localStorage.getItem('undc_user')
      const token = raw ? JSON.parse(raw)?.token : ''
      const res = await fetch(`/api/v1/formatos/${codigo}/descargar`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if(!res.ok){
        const txt = await res.text().catch(()=> '')
        setErr(`No se pudo descargar el formato${txt ? `: ${txt.slice(0,120)}` : ''}`)
        return
      }
      // El nombre del archivo viene en la cabecera del backend.
      const cd = res.headers.get('content-disposition') || ''
      const nombre = cd.split('filename="')[1]?.split('"')[0] || `${codigo.toLowerCase()}.docx`
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nombre
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    }catch(ex:any){
      setErr(ex?.message || 'No se pudo descargar el formato')
    }
  }

  if(user?.rol==='DOCENTE'){
    return <Card className="p-8 text-center"><Alert variant="warning">Solo <b>Estudiante</b> crea el <b>Informe Inicial</b> (HU-001). Docente asesora luego.</Alert></Card>
  }

  const submit = async (e:React.FormEvent)=>{
    e.preventDefault()
    setErr(''); setOk('')
    if(!form.titulo || !form.id_tipo || !form.id_escuela){
      setErr('Título, tipo y escuela son obligatorios (HU-001 CA1).'); return
    }
    // HU-069: el estudiante solo crea SSU o Voluntariado (verificador en form).
    if(!['SSU','VOLUNTARIADO'].includes(form.modalidad)){
      setErr('Como estudiante solo puedes crear SSU o Voluntariado. Los PEP los crea el docente responsable.'); return
    }
    if(!form.ciclo){ setErr('No hay ciclo académico activo. Crea uno en Estructura antes de continuar.'); return }
    // HU-002: docente asesor obligatorio.
    if(!form.docente){ setErr('Elige el docente asesor del proyecto (obligatorio).'); return }
    if(!file){ setErr('Adjunta tu Informe Inicial en PDF.'); return }
    if(!excel){ setErr('Adjunta la planificación de actividades en Excel (.xlsx).'); return }
    // Equipo mínimo: el líder + al menos 1 integrante (2 en total).
    if(equipo.length < 1){ setErr('Registra al menos 1 participante además de ti (el equipo necesita 2 estudiantes).'); return }
    // HU-001 CA1: el líder declara su celular (9 dígitos, empieza en 9).
    if(!/^9\d{8}$/.test(form.celular.trim())){
      setErr('Escribe tu número de celular (9 dígitos, empieza con 9). El equipo y RSU lo usarán para contactarte.'); return
    }
    const correoMal = equipo.find(m=> !/^[^\s@]+@undc\.edu\.pe$/i.test(m.correo.trim()))
    if(correoMal){ setErr(`El correo de ${correoMal.nombres || 'un participante'} no es institucional (@undc.edu.pe).`); return }
    const nombresMal = equipo.find(m=> m.nombres.trim().length < 2)
    if(nombresMal){ setErr('Escribe el nombre completo de cada participante.'); return }
    if(equipo.length > 4){ setErr('El equipo admite como máximo 5 estudiantes contándote a ti.'); return }
    setLoading(true)
    try{
      const codigo = `UNDC-RSU-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900)+100).padStart(3,'0')}`
      const body = {
        codigo_proyecto: codigo,
        titulo: form.titulo,
        id_escuela: Number(form.id_escuela),
        id_tipo: Number(form.id_tipo),
        modalidad: form.modalidad,
        id_linea_accion: form.id_linea? Number(form.id_linea): null,
        id_ciclo_creacion: Number(form.ciclo),
        id_estudiante_lider: user?.persona_id,
        id_docente_asesor: form.docente ? Number(form.docente) : null,
        descripcion: form.descripcion,
        objetivo_general: form.objetivo_general,
        poblacion_beneficiaria: form.poblacion,
        lugar_intervencion: form.lugar,
        fecha_inicio_plan: form.fecha_inicio || null,
        fecha_fin_plan: form.fecha_fin || null,
        presupuesto_solicitado: Number(form.presupuesto||0),
        celular_lider: form.celular.trim(),
      }
      const r:any = await api.post('/api/v1/proyectos', body)
      const idProyecto = r?.data?.id_proyecto
      if(!idProyecto){ setErr('Proyecto creado pero sin id_proyecto en la respuesta. Revisa la lista de proyectos.'); setLoading(false); return }

      // 1) Informe Inicial en PDF
      const errPdf = validarArchivo(file, 'pdf')
      if(errPdf){ setErr(errPdf); setLoading(false); return }
      const errExcel = validarArchivo(excel, 'office')
      if(errExcel){ setErr(errExcel); setLoading(false); return }
      const fd = new FormData()
      fd.append('id_proyecto', String(idProyecto))
      fd.append('id_tipo_doc', '1')
      fd.append('id_usuario_subida', String(user?.persona_id ?? ''))
      fd.append('archivo', file)
      try{
        await api.upload('/api/v1/documentos/upload', fd)
      }catch(ex:any){
        setErr(`Proyecto ${codigo} creado, pero el Informe Inicial no se pudo subir: ${ex?.message||'error desconocido'}`)
        setLoading(false); return
      }

      // 2) Planificación de actividades: el Excel se interpreta con el módulo
      //    Python y se crean las actividades programadas del proyecto.
      let n = 0
      try{
        const fp = new FormData()
        fp.append('id_proyecto', String(idProyecto))
        fp.append('archivo', excel)
        const pr:any = await api.upload('/api/v1/actividades/planificacion', fp)
        n = pr?.data?.creadas ?? 0
      }catch{
        // No es fatal: la planificación se puede volver a subir después.
      }

      // 3) Se inscribe el equipo que escribió el líder (el líder ya queda como
      //    id_estudiante_lider, así que solo se suman los demás).
      let inscritos = 0
      const fallidos: string[] = []
      for(const m of equipo){
        try{
          await api.post(`/api/v1/proyectos/${idProyecto}/participantes`, {
            nombres: m.nombres.trim(),
            apellidos: m.apellidos.trim(),
            correo: m.correo.trim(),
            id_rol_proyecto: 4, // Ejecutor
          })
          inscritos++
        }catch{
          fallidos.push(m.correo.trim())
        }
      }

      let resumen = `Proyecto ${codigo} creado — Informe Inicial subido`
      if(n) resumen += ` y ${n} actividad(es) cargadas`
      resumen += `. Equipo: ${inscritos + 1} estudiante(s)`
      if(fallidos.length) resumen += ` (no se pudo inscribir a: ${fallidos.join(', ')})`
      setOk(resumen + '.')
      setTimeout(()=> nav('/mis-proyectos'), 2200)
    }catch(ex:any){ setErr(ex.message?.slice(0,300) || 'Error al crear. Valida ciclo mínimo (HU-003) y código único.') }
    finally{ setLoading(false)}
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-undc-700">Nuevo proyecto — Informe Inicial</h1>
        <p className="text-sm text-slate-500">Se autogenera código <b>UNDC-RSU-AAAA-NNN</b> · Adjunta tu <b>Informe Inicial en PDF</b> · Quedas como líder del grupo</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Formulario Informe Inicial — Original</CardTitle>
          <CardDesc>Completa los campos del informe inicial. Luego podrás modificarlo hasta que sea revisado.</CardDesc>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {catalogErr && <Alert variant="error" className="flex gap-2"><AlertCircle size={16}/>{catalogErr}</Alert>}
            {tipos.length===0 && !catalogErr && <Alert variant="warning">Sin tipos de proyecto en el catálogo. Registra al menos uno en la BD.</Alert>}
            {escuelas.length===0 && !catalogErr && <Alert variant="warning">Sin escuelas registradas. Crea la estructura antes de continuar.</Alert>}
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} placeholder="Ej. Campaña salud integral San Vicente" maxLength={300} required/>
              <div className="text-xs text-slate-400 text-right">{form.titulo.length}/300</div>
            </div>
            {esEstudiante ? (
              <div className="flex items-start gap-2 rounded-xl border border-undc-200 bg-undc-50 p-3">
                <span className="w-6 h-6 rounded-full bg-undc-700 text-white grid place-items-center text-xs font-bold shrink-0">1</span>
                <div className="text-xs text-undc-800">
                  <b>Tipo: SSU — Servicio Social Universitario.</b> Lo propone el estudiante y el sistema lo
                  registra así directamente (modalidad SSU, ciclo mínimo 5). Los proyectos PEP los crea el
                  docente responsable — puedes unirte a uno abierto desde <Link to="/mis-proyectos" className="underline font-bold">Mis proyectos</Link>.
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de proyecto *</Label>
                  <select value={form.id_tipo} onChange={e=>setForm({...form,id_tipo:e.target.value})} className="input">
                    <option value="">-- seleccionar --</option>
                    {tipos.map(t=><option key={t.id_tipo} value={t.id_tipo}>{t.nombre} {t.ciclo_minimo_estudiante? `(ciclo ≥${t.ciclo_minimo_estudiante})`:''}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Modalidad *</Label>
                  <select value={form.modalidad} onChange={e=>setForm({...form,modalidad:e.target.value})} className="input">
                    <option value="SSU">SSU — Servicio Social Universitario</option>
                    <option value="VOLUNTARIADO">Voluntariado</option>
                    <option value="PEP_FINANCIADO">PEP Financiado</option>
                    <option value="PEP_AUTOFINANCIADO">PEP Autofinanciado</option>
                    <option value="PUBLICACION_CIENTIFICA">Publicación Científica</option>
                  </select>
                  <div className="text-[11px] text-slate-400 mt-0.5">Los PEP los crea el docente responsable (HU-069).</div>
                </div>
                <div>
                  <Label>Línea de acción (ODS)</Label>
                  <select value={form.id_linea} onChange={e=>setForm({...form,id_linea:e.target.value})} className="input">
                    <option value="">-- opcional --</option>
                    {lineas.map(l=><option key={l.id_linea} value={l.id_linea}>{l.nombre} — {l.alineacion_ods}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div>
              <Label>Escuela *</Label>
              <select value={form.id_escuela} onChange={e=>setForm({...form, id_escuela:e.target.value})} className="input" required>
                <option value="">-- seleccionar escuela --</option>
                {escuelas.map(e=><option key={e.id_escuela} value={e.id_escuela}>{e.nombre} — {e.facultad?.nombre}</option>)}
              </select>
            </div>
            <div>
              <Label required>Docente asesor *</Label>
              <select value={form.docente} onChange={e=>setForm({...form, docente:e.target.value})} className="input" required>
                <option value="">-- elegir docente --</option>
                {docentes
                  .filter((d:any)=> !form.id_escuela || String(d.id_escuela) === String(form.id_escuela))
                  .map((d:any)=><option key={d.id_docente} value={d.id_docente}>
                  {d.nombres} {d.apellidos}{d.codigo_docente ? ` — ${d.codigo_docente}` : ''}
                </option>)}
              </select>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Obligatorio (HU-002). Un docente asesora como máximo <b>2 equipos</b> a la vez; el sistema te avisa si ya llegó al límite.
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea rows={3} value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Resumen del problema y propuesta"/>
            </div>
            <div>
              <Label>Objetivo general</Label>
              <Textarea rows={2} value={form.objetivo_general} onChange={e=>setForm({...form,objetivo_general:e.target.value})} placeholder="Objetivo general del proyecto"/>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Población beneficiaria</Label><Input value={form.poblacion} onChange={e=>setForm({...form,poblacion:e.target.value})} placeholder="Familias vulnerables, adultos mayores..."/></div>
              <div><Label>Lugar intervención</Label><Input value={form.lugar} onChange={e=>setForm({...form,lugar:e.target.value})} placeholder="San Vicente, Imperial..."/></div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div><Label>Fecha inicio plan</Label><Input type="date" value={form.fecha_inicio} onChange={e=>setForm({...form,fecha_inicio:e.target.value})}/></div>
              <div><Label>Fecha fin plan</Label><Input type="date" value={form.fecha_fin} onChange={e=>setForm({...form,fecha_fin:e.target.value})}/></div>
              <div><Label>Presupuesto solicitado (S/)</Label><Input type="number" min="0" step="0.01" value={form.presupuesto} onChange={e=>setForm({...form,presupuesto:e.target.value})} placeholder="12000"/></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label required>Tu celular (líder del equipo)</Label>
                <Input
                  value={form.celular}
                  onChange={e=>setForm({...form, celular:e.target.value.replace(/[^0-9]/g,'').slice(0,9)})}
                  placeholder="987654321"
                  inputMode="numeric"
                  maxLength={9}
                  error={!!form.celular && !/^9\d{8}$/.test(form.celular)}/>
                <div className="text-[11px] text-slate-400 mt-0.5">9 dígitos empezando en 9 — para que tu equipo y RSU facultad puedan contactarte.</div>
              </div>
            </div>
            {/* ── Equipo de trabajo ──
                El líder (quien crea) ya queda registrado; aquí se suman de 1 a 4
                compañeros para completar el mínimo de 2 y el máximo de 5. */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-undc-700"/>
                <div className="font-bold text-sm text-slate-800">2. Registra tu equipo</div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tú eres el líder. Añade de 1 a 4 compañeros: el proyecto necesita al menos 2 estudiantes y puede tener hasta 5.
              </p>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.2fr_auto] gap-2 items-end">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Nombres *</label>
                  <Input
                    value={nuevo.nombres}
                    onChange={e=>setNuevo({...nuevo, nombres:e.target.value})}
                    placeholder="Carlos André"
                    error={!!nuevo.nombres && nuevo.nombres.trim().length < 2}/>
                  {nuevo.nombres.trim().length > 0 && nuevo.nombres.trim().length < 2 && (
                    <div className="text-[10px] text-red-600 mt-0.5">Mínimo 2 caracteres</div>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Apellidos</label>
                  <Input value={nuevo.apellidos} onChange={e=>setNuevo({...nuevo, apellidos:e.target.value})} placeholder="Ramos Díaz"/>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Correo *</label>
                  <Input
                    type="email"
                    value={nuevo.correo}
                    onChange={e=>setNuevo({...nuevo, correo:e.target.value})}
                    placeholder="caramos@undc.edu.pe"
                    error={!!nuevo.correo && !correoValido}/>
                  {nuevo.correo.trim().length > 0 && !correoValido && (
                    <div className="text-[10px] text-red-600 mt-0.5">Debe ser @undc.edu.pe</div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={()=>{
                    if(!nuevo.nombres.trim()){ setErr('Escribe el nombre del participante.'); return }
                    if(nuevo.nombres.trim().length < 2){ setErr('El nombre debe tener al menos 2 caracteres.'); return }
                    if(!correoValido){ setErr('El correo debe terminar en @undc.edu.pe.'); return }
                    if(equipo.some(m=> m.correo.trim().toLowerCase()===nuevo.correo.trim().toLowerCase())){ setErr('Ese correo ya está en la lista.'); return }
                    if(nuevo.correo.trim().toLowerCase()===(user?.correo||'').toLowerCase()){ setErr('Ese correo es el tuyo: ya eres el líder.'); return }
                    if(equipo.length>=4){ setErr('El equipo admite 5 estudiantes en total (tú + 4).'); return }
                    setErr('')
                    setEquipo([...equipo, {...nuevo, nombres:nuevo.nombres.trim(), apellidos:nuevo.apellidos.trim(), correo:nuevo.correo.trim()}])
                    setNuevo({nombres:'', apellidos:'', correo:''})
                  }}
                  disabled={equipo.length>=4 || !puedeAnadir}
                  leftIcon={<UserPlus size={14}/>}
                >Añadir</Button>
              </div>

              <div className="mt-3">
                {equipo.length===0 ? (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    Aún no hay participantes. Necesitas al menos 1 para crear el proyecto.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {equipo.map((m,i)=>(
                      <div key={m.correo+i} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                        <span className="w-6 h-6 rounded-full bg-undc-100 text-undc-700 grid place-items-center text-[11px] font-bold shrink-0">{i+2}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-800 truncate">{m.nombres} {m.apellidos}</div>
                          <div className="text-[11px] text-slate-500 truncate">{m.correo}</div>
                        </div>
                        <button type="button" onClick={()=> setEquipo(equipo.filter((_,j)=> j!==i))}
                                className="w-7 h-7 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 grid place-items-center shrink-0"
                                aria-label={`Quitar a ${m.nombres}`}>
                          <X size={13}/>
                        </button>
                      </div>
                    ))}
                    <div className="text-[11px] text-slate-500 pl-1">
                      Equipo: {equipo.length + 1} de 5 estudiantes (tú incluido)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Plantillas descargables ──
                Solo las de creación de proyecto: propuesta (Word) y planificación
                (Excel). Los formatos de entregables, encuesta e informe final se
                descargan desde "Ejecución proyecto" (botón Guía). */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <FileDown size={16} className="text-undc-700"/>
                <div className="font-bold text-sm text-slate-800">1. Descarga los formatos</div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Llénalos antes de crear el proyecto: la propuesta en Word y las actividades en Excel.
              </p>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={descargarPlantilla('PROPUESTA')}
                  className="flex items-center gap-2.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-left hover:border-undc-300 hover:bg-undc-50/40 transition-colors"
                >
                  <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 grid place-items-center shrink-0"><FileText size={16}/></span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 truncate">Propuesta de proyecto</span>
                    <span className="block text-[11px] text-slate-500">Word (.docx)</span>
                  </span>
                  <Download size={14} className="ml-auto text-slate-400 shrink-0"/>
                </button>
                <button
                  type="button"
                  onClick={descargarPlantilla('PLANIFICACION')}
                  className="flex items-center gap-2.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-left hover:border-undc-300 hover:bg-undc-50/40 transition-colors"
                >
                  <span className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center shrink-0"><FileSpreadsheet size={16}/></span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 truncate">Planificación de actividades</span>
                    <span className="block text-[11px] text-slate-500">Excel (.xlsx)</span>
                  </span>
                  <Download size={14} className="ml-auto text-slate-400 shrink-0"/>
                </button>
              </div>
            </div>

            {/* ── Archivos que se suben ── */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border-2 border-dashed border-undc-200 p-5 text-center bg-undc-50">
                <Upload className="mx-auto text-undc-700" size={26}/>
                <div className="text-sm font-semibold mt-1">Informe Inicial (PDF) *</div>
                <div className="text-xs text-slate-500">Perfil del proyecto firmado</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Solo .pdf · máx 20MB</div>
                <input type="file" accept=".pdf" className="mt-2 text-xs w-full" onChange={(e)=> setFile(e.target.files?.[0] ?? null)}/>
                {file && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-undc-200 rounded-xl text-xs font-semibold text-undc-700 max-w-full">
                    <FileText size={14} className="shrink-0"/> <span className="truncate">{file.name}</span> <span className="text-slate-400 font-normal shrink-0">{(file.size/1024).toFixed(0)} KB</span>
                  </div>
                )}
                {!file && <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 inline-block">Pendiente</div>}
              </div>

              <div className="rounded-xl border-2 border-dashed border-emerald-200 p-5 text-center bg-emerald-50/60">
                <FileSpreadsheet className="mx-auto text-emerald-600" size={26}/>
                <div className="text-sm font-semibold mt-1">Planificación (Excel) *</div>
                <div className="text-xs text-slate-500">Actividades, fechas y horarios</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Solo .xlsx · máx 10MB</div>
                <input type="file" accept=".xlsx" className="mt-2 text-xs w-full" onChange={(e)=> setExcel(e.target.files?.[0] ?? null)}/>
                {excel && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 max-w-full">
                    <FileSpreadsheet size={14} className="shrink-0"/> <span className="truncate">{excel.name}</span> <span className="text-slate-400 font-normal shrink-0">{(excel.size/1024).toFixed(0)} KB</span>
                  </div>
                )}
                {!excel && <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 inline-block">Pendiente</div>}
              </div>
            </div>
            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
              Al crear el proyecto, las actividades del Excel se cargan automáticamente como <b>PROGRAMADAS</b>.
              El día de cada actividad podrás capturarlas desde <b>Registro de Evidencias</b>.
            </div>
            {err && <Alert variant="error" className="flex gap-2"><AlertCircle size={16}/>{err}</Alert>}
            {ok && <Alert variant="success">{ok}</Alert>}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={()=>nav(-1)}>Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-undc-700 hover:bg-undc-800">{loading?'Creando...':'Crear Informe Inicial'}</Button>
            </div>
            <div className="text-xs text-slate-400">Al crear quedas como líder del grupo. Tu docente asesor y compañeros verán el proyecto para subir avances.</div>
          </form>
        </CardContent>
      </Card>

      {/* ── PEPs abiertos (HU-063): si no quieres crear tu SSU, únete a un PEP ── */}
      <Card>
        <CardHeader>
          <CardTitle>¿Prefieres unirte a un PEP?</CardTitle>
          <CardDesc>Estos proyectos de Escuela Profesional buscan integrantes. Míralos y únete en vez de crear desde cero.</CardDesc>
        </CardHeader>
        <CardContent>
          {pepsError && <Alert variant="warning">{pepsError}</Alert>}
          {!pepsError && peps.length===0 && (
            <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              No hay PEPs abiertos por ahora. Puedes crear tu proyecto arriba.
            </div>
          )}
          <div className="space-y-3">
            {peps.map((p:any)=>(
              <div key={p.id_proyecto} className="border border-slate-200 rounded-2xl p-4 hover:border-undc-300 transition-colors">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="font-mono text-[11px] bg-slate-900 text-white px-2 py-0.5 rounded-lg">{p.codigo_proyecto}</span>
                  <span className="text-[11px] bg-violet-50 border border-violet-200 text-violet-700 px-2 py-0.5 rounded-full font-semibold">{p.modalidad}</span>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p.estado_actual?.nombre || ''}</span>
                  <span className="text-[11px] bg-sky-50 border border-sky-200 text-sky-700 px-2 py-0.5 rounded-full font-semibold">Equipo {pepsCupos[p.id_proyecto] || '—/5'}</span>
                </div>
                <div className="font-bold text-sm text-slate-800 mt-1.5">{p.titulo}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {p.escuela?.nombre || ''} · Docente: {p.docente_asesor ? `${p.docente_asesor.nombres} ${p.docente_asesor.apellidos}` : '—'} · Avance {p.porcentaje_avance ?? 0}%
                </div>
                {p.descripcion && <div className="text-xs text-slate-600 mt-1 line-clamp-2">{p.descripcion}</div>}
                <div className="mt-2 text-right">
                  <Button type="button" variant="secondary" onClick={()=>nav(`/proyectos/${p.id_proyecto}?tab=equipo`)}>Ver detalle y unirme</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
