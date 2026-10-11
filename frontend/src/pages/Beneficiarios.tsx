import { useEffect, useState } from 'react'
import { api, asArray } from '../api/client'
import { Search, Plus, MapPin, Users, Building2, UsersRound, Filter, Phone, Mail, Link2, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Alert } from '../components/ui/Alert'
import { EmptySearch } from '../components/ui/Empty'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'

type Ben = {
  id_beneficiario:number
  tipo_beneficiario:string
  dni?:string
  ruc?:string
  nombres?:string
  apellidos?:string
  razon_social?:string
  distrito?:string
  provincia?:string
  celular?:string
  correo_electronico?:string
  direccion?:string
}

export default function Beneficiarios(){
  const {user} = useAuth()
  const [items,setItems]=useState<Ben[]>([])
  const [search,setSearch]=useState('')
  const [tipoFiltro,setTipoFiltro]=useState('')
  const [loading,setLoading]=useState(true)
  const [listError,setListError]=useState('')
  const [showForm,setShowForm]=useState(false)
  const [form,setForm]=useState({tipo:'PERSONA_NATURAL', dni:'', nombres:'', apellidos:'', ruc:'', razon:'', distrito:'San Vicente', celular:''})
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState('')
  const [vinc,setVinc]=useState<{open:boolean, ben:Ben|null, proyecto:string}>({open:false, ben:null, proyecto:''})
  const [proyectos,setProyectos]=useState<any[]>([])
  const [vincMsg,setVincMsg]=useState<{type:'ok'|'err', text:string}|null>(null)
  const [vincBusy,setVincBusy]=useState(false)

  const load = async()=>{
    setLoading(true); setListError('')
    try{
      const q = new URLSearchParams()
      if(search) q.set('search', search)
      const r:any = await api.get(`/api/v1/beneficiarios?${q.toString()}`)
      setItems(asArray(r.data))
    }catch(ex:any){
      setItems([])
      setListError(ex?.message || 'No se pudo cargar el padrón de beneficiarios')
    }finally{ setLoading(false)}
  }
  useEffect(()=>{ load() },[])
  const filtered = tipoFiltro ? items.filter(b=> b.tipo_beneficiario===tipoFiltro) : items

  const abrirVincular = async(b:Ben)=>{
    setVinc({open:true, ben:b, proyecto:''})
    setVincMsg(null)
    if(proyectos.length) return
    try{
      const endpoint = user?.rol==='ESTUDIANTE'
        ? `/api/v1/estudiantes/${user?.persona_id}/proyectos?limit=50`
        : user?.rol==='DOCENTE'
          ? `/api/v1/docentes/${user?.persona_id}/proyectos?limit=50`
          : '/api/v1/proyectos?limit=50'
      const r:any = await api.get(endpoint)
      const ps = asArray<any>(r.data)
      setProyectos(ps)
      if(ps[0]) setVinc(v=> ({...v, proyecto: String(ps[0].id_proyecto)}))
    }catch(ex:any){ setProyectos([]); setVincMsg({type:'err', text: ex?.message||'No se pudieron cargar los proyectos'}) }
  }

  const vincular = async()=>{
    if(!vinc.ben) return
    if(!vinc.proyecto){ setVincMsg({type:'err', text:'Selecciona el proyecto'}); return }
    setVincBusy(true); setVincMsg(null)
    try{
      await api.post('/api/v1/beneficiarios/vincular', {id_proyecto: Number(vinc.proyecto), id_beneficiario: Number(vinc.ben.id_beneficiario)})
      setVincMsg({type:'ok', text:'Beneficiario vinculado al proyecto'})
      setTimeout(()=> setVinc({open:false, ben:null, proyecto:''}), 700)
    }catch(ex:any){ setVincMsg({type:'err', text: ex?.message||'No se pudo vincular'}) }
    finally{ setVincBusy(false) }
  }

  const submit = async(e:React.FormEvent)=>{
    e.preventDefault()
    setSaving(true); setMsg('')
    try{
      const body:any = {tipo_beneficiario: form.tipo, distrito: form.distrito, celular: form.celular || undefined}
      if(form.tipo==='PERSONA_NATURAL'){ body.dni=form.dni; body.nombres=form.nombres; body.apellidos=form.apellidos; if(!form.dni || !form.nombres) throw new Error('DNI y nombres requeridos (persona natural)')}
      if(form.tipo==='INSTITUCION'){ body.ruc=form.ruc; body.razon_social=form.razon; if(!form.ruc) throw new Error('RUC requerido para institución')}
      if(form.tipo==='COMUNIDAD'){ body.razon_social=form.razon; body.ruc=form.ruc||undefined }
      await api.post('/api/v1/beneficiarios', body)
      setMsg('Beneficiario registrado ✓'); setShowForm(false); setForm({tipo:'PERSONA_NATURAL', dni:'', nombres:'', apellidos:'', ruc:'', razon:'', distrito:'San Vicente', celular:''})
      load()
    }catch(ex:any){ setMsg(ex.message||'Error al crear')}
    finally{ setSaving(false)}
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Padrón de Beneficiarios"
        subtitle="Personas, instituciones y comunidades de la provincia de Cañete."
        icon={<Users size={20}/>}
        badge={<span className="px-2.5 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full text-xs font-bold">{filtered.length} registros</span>}
        actions={<Button onClick={()=>setShowForm(!showForm)} leftIcon={<Plus size={16}/>} className="shadow-sm">{showForm?'Cerrar formulario':'Nuevo beneficiario'}</Button>}
      />

      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-3 flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-undc-50 border border-undc-200 text-undc-700 grid place-items-center"><Users size={16}/></div><div><div className="text-xs text-slate-500">Personas</div><div className="font-bold">{items.filter(b=>b.tipo_beneficiario==='PERSONA_NATURAL').length}</div></div></Card>
        <Card className="p-3 flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-undc-50 border border-undc-200 text-undc-700 grid place-items-center"><Building2 size={16}/></div><div><div className="text-xs text-slate-500">Instituciones</div><div className="font-bold">{items.filter(b=>b.tipo_beneficiario==='INSTITUCION').length}</div></div></Card>
        <Card className="p-3 flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-undc-50 border border-undc-200 text-undc-700 grid place-items-center"><UsersRound size={16}/></div><div><div className="text-xs text-slate-500">Comunidades</div><div className="font-bold">{items.filter(b=>b.tipo_beneficiario==='COMUNIDAD').length}</div></div></Card>
      </div>

      {showForm && (
        <Card className="border-undc-200">
          <CardHeader>
            <CardTitle><ShieldCheck size={16} className="text-undc-700"/> Registrar beneficiario</CardTitle>
            <p className="text-xs text-slate-500">DNI requerido para persona natural, RUC para institución</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
              <div>
                <Label required>Tipo beneficiario</Label>
                <Select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})}>
                  <option value="PERSONA_NATURAL">PERSONA_NATURAL — DNI</option>
                  <option value="INSTITUCION">INSTITUCIÓN — RUC</option>
                  <option value="COMUNIDAD">COMUNIDAD</option>
                </Select>
              </div>
              <div>
                <Label>Distrito</Label>
                <Select value={form.distrito} onChange={e=>setForm({...form, distrito:e.target.value})}>
                  {['San Vicente','Imperial','San Luis','Quilmaná','Lunahuaná','Cerro Azul','Mala','Asia'].map(d=><option key={d} value={d}>{d} — Cañete</option>)}
                </Select>
              </div>
              {form.tipo==='PERSONA_NATURAL' && <>
                <div><Label required>DNI (8)</Label><Input value={form.dni} onChange={e=>setForm({...form, dni:e.target.value})} maxLength={8} placeholder="44551234"/></div>
                <div><Label required>Nombres</Label><Input value={form.nombres} onChange={e=>setForm({...form, nombres:e.target.value})} placeholder="María"/></div>
                <div><Label>Apellidos</Label><Input value={form.apellidos} onChange={e=>setForm({...form, apellidos:e.target.value})} placeholder="Quispe Huamán"/></div>
                <div><Label>Celular</Label><Input value={form.celular} onChange={e=>setForm({...form, celular:e.target.value})} placeholder="987654321"/></div>
              </>}
              {(form.tipo==='INSTITUCION' || form.tipo==='COMUNIDAD') && <>
                <div><Label required>{form.tipo==='INSTITUCION'?'RUC (11)':'RUC / Código'}</Label><Input value={form.ruc} onChange={e=>setForm({...form, ruc:e.target.value})} placeholder="20123456789"/></div>
                <div className="md:col-span-1"><Label required>Razón social / Comunidad</Label><Input value={form.razon} onChange={e=>setForm({...form, razon:e.target.value})} placeholder="I.E. José Olaya"/></div>
              </>}
              <div className="md:col-span-2 flex gap-2 justify-end pt-2">
                {msg && <span className="text-xs mr-auto self-center font-medium text-emerald-700">{msg}</span>}
                <Button type="button" variant="outline" onClick={()=>setShowForm(false)}>Cancelar</Button>
                <Button type="submit" loading={saving}>Guardar beneficiario</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
        <div className="relative flex-1 min-w-0 sm:min-w-[260px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <Input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="Buscar por DNI, apellidos o razón social..." className="pl-9 bg-slate-50"/>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400"/>
          <Select value={tipoFiltro} onChange={e=>setTipoFiltro(e.target.value)} className="bg-slate-50">
            <option value="">Todos los tipos</option>
            <option value="PERSONA_NATURAL">Persona natural</option>
            <option value="INSTITUCION">Institución</option>
            <option value="COMUNIDAD">Comunidad</option>
          </Select>
        </div>
        <Button onClick={load} variant="secondary" className="w-full sm:w-auto">Buscar</Button>
      </Card>

      <Card className="overflow-hidden">
        {loading ? <div className="p-4"><Skeleton className="h-12 w-full mb-2"/><Skeleton className="h-12 w-full mb-2"/><Skeleton className="h-12 w-full"/></div> :
          listError ? <div className="p-4"><Alert variant="error" className="text-xs"><div className="flex items-center justify-between gap-3"><span>{listError}</span><Button size="sm" variant="outline" onClick={load}>Reintentar</Button></div></Alert></div> :
          filtered.length===0 ? <EmptySearch query={search}/> :
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead className="bg-slate-50 text-xs text-slate-500 border-b">
                <tr><th className="text-left px-4 py-3 font-semibold">Beneficiario</th><th className="text-left px-4 py-3">Documento</th><th className="text-left px-4 py-3">Ubicación</th><th className="text-left px-4 py-3">Tipo</th><th className="text-left px-4 py-3">Contacto</th><th className="px-4 py-3">Acción</th></tr>
              </thead>
              <tbody>
                {filtered.map(b=>(
                  <tr key={b.id_beneficiario} className="border-t border-slate-100 hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{b.nombres? `${b.apellidos}, ${b.nombres}` : b.razon_social}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">{b.provincia || 'Cañete'} · {b.distrito}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg inline-block mt-2 px-2 py-1">{b.dni || b.ruc || '—'}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs"><MapPin size={14} className="text-slate-400"/>{b.distrito||'—'}</span><div className="text-xs text-slate-500">{b.direccion || b.provincia || 'Cañete'}</div></td>
                    <td className="px-4 py-3"><Badge color={b.tipo_beneficiario==='PERSONA_NATURAL'?'#0ea5e9':b.tipo_beneficiario==='INSTITUCION'?'#8b5cf6':'#f59e0b'} variant="soft">{b.tipo_beneficiario}</Badge></td>
                    <td className="px-4 py-3 text-xs"><div className="flex items-center gap-1"><Phone size={12} className="text-slate-400"/>{b.celular || '—'}</div>{b.correo_electronico && <div className="flex items-center gap-1 text-slate-500"><Mail size={12}/>{b.correo_electronico}</div>}</td>
                    <td className="px-4 py-3 text-center"><Button size="sm" variant="outline" leftIcon={<Link2 size={12}/>} onClick={()=>abrirVincular(b)}>Vincular</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </Card>

      <Alert variant="info" className="text-xs">Beneficiarios por año, distrito y tipo disponibles.</Alert>

      <Modal
        open={vinc.open}
        busy={vincBusy}
        onClose={()=> setVinc({open:false, ben:null, proyecto:''})}
        title="Vincular beneficiario a un proyecto"
        desc="POST /api/v1/beneficiarios/vincular"
        footer={<>
          <Button variant="outline" onClick={()=> setVinc({open:false, ben:null, proyecto:''})} disabled={vincBusy}>Cancelar</Button>
          <Button onClick={vincular} loading={vincBusy}>Vincular</Button>
        </>}
      >
        <div className="space-y-3">
          {vinc.ben && (
            <div className="border border-slate-200 rounded-xl p-3 text-sm">
              <div className="font-semibold">{vinc.ben.razon_social || `${vinc.ben.apellidos||''}, ${vinc.ben.nombres||''}`}</div>
              <div className="text-xs text-slate-500">{vinc.ben.dni||vinc.ben.ruc||'S/D'} · {vinc.ben.distrito||'—'} · {vinc.ben.tipo_beneficiario}</div>
            </div>
          )}
          <div>
            <Label required>Proyecto</Label>
            <Select value={vinc.proyecto} onChange={e=> setVinc(v=> ({...v, proyecto:e.target.value}))}>
              <option value="">-- seleccionar proyecto --</option>
              {proyectos.map(p=> <option key={p.id_proyecto} value={String(p.id_proyecto)}>{p.codigo_proyecto} — {p.titulo}</option>)}
            </Select>
          </div>
          {proyectos.length===0 && !vincMsg && <div className="text-xs text-slate-500">No se encontraron proyectos disponibles para tu usuario.</div>}
          {vincMsg && <Alert variant={vincMsg.type==='ok'?'success':'error'} className="text-xs">{vincMsg.text}</Alert>}
        </div>
      </Modal>
    </div>
  )
}
