import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from '../components/ui/Card'
import { Input, Textarea, Label } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { Upload, AlertCircle } from 'lucide-react'

export default function CrearProyecto(){
  const {user} = useAuth()
  const nav = useNavigate()
  const [tipos,setTipos]=useState<any[]>([])
  const [lineas,setLineas]=useState<any[]>([])
  const [escuelas,setEscuelas]=useState<any[]>([])
  const [form,setForm]=useState({titulo:'', id_tipo:'', id_linea:'', id_escuela:'', descripcion:'', objetivo_general:'', poblacion:'', lugar:'', fecha_inicio:'', fecha_fin:'', presupuesto:'', semestre:''})
  const [err,setErr]=useState('')
  const [ok,setOk]=useState('')
  const [loading,setLoading]=useState(false)

  useEffect(()=>{
    api.get('/api/v1/catalogos/tipos-proyecto').then((r:any)=>setTipos(r.data||[])).catch(()=>setTipos([{id_tipo:1,nombre:'Proyección Social'},{id_tipo:2,nombre:'Extensión Universitaria'}]))
    api.get('/api/v1/catalogos/lineas-accion').then((r:any)=>setLineas(r.data||[])).catch(()=>setLineas([{id_linea:1,nombre:'Salud y Bienestar',alineacion_ods:'ODS 3'}]))
    api.get('/api/v1/escuelas').then((r:any)=>setEscuelas(r.data||[])).catch(()=>setEscuelas([{id_escuela:1,nombre:'Ing. Sistemas',facultad:{nombre:'FIA'}}]))
  },[])

  if(user?.rol==='DOCENTE'){
    return <Card className="p-8 text-center"><Alert variant="warning">Solo <b>Estudiante</b> crea el <b>Informe Inicial</b> (HU-001). Docente asesora luego.</Alert></Card>
  }

  const submit = async (e:React.FormEvent)=>{
    e.preventDefault()
    setErr(''); setOk('')
    if(!form.titulo || !form.id_tipo || !form.id_escuela){
      setErr('Título, tipo y escuela son obligatorios (HU-001 CA1).'); return
    }
    setLoading(true)
    try{
      const codigo = `UNDC-RSU-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900)+100).padStart(3,'0')}`
      const body = {
        codigo_proyecto: codigo,
        titulo: form.titulo,
        id_escuela: Number(form.id_escuela),
        id_tipo: Number(form.id_tipo),
        id_linea_accion: form.id_linea? Number(form.id_linea): null,
        id_ciclo_creacion: 1,
        id_estudiante_lider: user?.id,
        descripcion: form.descripcion,
        objetivo_general: form.objetivo_general,
        poblacion_beneficiaria: form.poblacion,
        lugar_intervencion: form.lugar,
        fecha_inicio_plan: form.fecha_inicio || null,
        fecha_fin_plan: form.fecha_fin || null,
        presupuesto_solicitado: Number(form.presupuesto||0),
      }
      await api.post('/api/v1/proyectos', body)
      setOk(`Proyecto ${codigo} creado — Informe Inicial. El equipo ya puede subir entregables.`)
      setTimeout(()=> nav('/mis-proyectos'), 1200)
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
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} placeholder="Ej. Campaña salud integral San Vicente" maxLength={300} required/>
              <div className="text-xs text-slate-400 text-right">{form.titulo.length}/300</div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de proyecto *</Label>
                <select value={form.id_tipo} onChange={e=>setForm({...form,id_tipo:e.target.value})} className="input">
                  <option value="">-- seleccionar --</option>
                  {tipos.map(t=><option key={t.id_tipo} value={t.id_tipo}>{t.nombre} {t.ciclo_minimo_estudiante? `(ciclo ≥${t.ciclo_minimo_estudiante})`:''}</option>)}
                </select>
              </div>
              <div>
                <Label>Línea de acción (ODS)</Label>
                <select value={form.id_linea} onChange={e=>setForm({...form,id_linea:e.target.value})} className="input">
                  <option value="">-- opcional --</option>
                  {lineas.map(l=><option key={l.id_linea} value={l.id_linea}>{l.nombre} — {l.alineacion_ods}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Escuela *</Label>
              <select value={form.id_escuela} onChange={e=>setForm({...form,id_escuela:e.target.value})} className="input" required>
                <option value="">-- seleccionar escuela --</option>
                {escuelas.map(e=><option key={e.id_escuela} value={e.id_escuela}>{e.nombre} — {e.facultad?.nombre}</option>)}
              </select>
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
            <div className="rounded-xl border-2 border-dashed border-undc-200 p-6 text-center bg-undc-50">
              <Upload className="mx-auto text-undc-700" size={28}/>
              <div className="text-sm font-semibold mt-1">Informe Inicial en PDF — obligatorio</div>
              <div className="text-xs text-slate-500">Arrastra o selecciona tu archivo (se sube después de crear)</div>
              <input type="file" accept=".pdf" className="mt-2 text-xs"/>
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
    </div>
  )
}
