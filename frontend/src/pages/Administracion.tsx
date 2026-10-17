import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { validarArchivo } from '../lib/archivos'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'
import { Empty } from '../components/ui/Empty'
import { UserCog, Power, KeyRound, Trash2, ShieldCheck, FileText, Upload, Download, RotateCcw, FileSpreadsheet, Database } from 'lucide-react'

type Usuario = {
  id_usuario:number
  correo:string
  nombre:string
  rol:string
  tipo_usuario:string
  id_persona:number|null
  activo:boolean
  ultimo_login:string|null
  modulos:string[]
}

type Modulo = { clave:string; nombre:string; desc:string }
type RolOpt = { clave:string; nombre:string; desc:string }

// Formato del catálogo fijo. `personalizado` indica que el administrador ya
// subió su propio archivo; si es false se sirve el formato de fábrica.
type Formato = {
  id_formato:number
  codigo:string
  nombre:string
  descripcion:string
  tipo:string
  version:string
  personalizado:boolean
  nombre_archivo:string
  peso_bytes:number
  orden:number
}

const formVacio = { correo:'', nombre:'', password:'', rol_actor:'ESTUDIANTE_PROP', id_persona:'', modulos:[] as string[] }

export default function Administracion(){
  const {user} = useAuth()
  const [usuarios,setUsuarios]=useState<Usuario[]>([])
  const [roles,setRoles]=useState<RolOpt[]>([])
  const [modulos,setModulos]=useState<Modulo[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [msg,setMsg]=useState<{tipo:'ok'|'err', texto:string}|null>(null)
  const [form,setForm]=useState({...formVacio})
  const [creando,setCreando]=useState(false)
  const [busyId,setBusyId]=useState<number|null>(null)
  const [formatos,setFormatos]=useState<Formato[]>([])
  const [subiendo,setSubiendo]=useState<string|null>(null)
  const inputFormato=useRef<HTMLInputElement>(null)
  const [codigoActivo,setCodigoActivo]=useState<string|null>(null)

  // ── Almacenamiento Backblaze B2 ──
  const [b2Estado,setB2Estado]=useState<any>(null)
  const [b2Form,setB2Form]=useState({account_id:'', app_key:'', bucket_id:'f64c72b539a346e19bfd0a1d'})
  const [b2Msg,setB2Msg]=useState<{tipo:'ok'|'err',texto:string}|null>(null)
  const [b2Busy,setB2Busy]=useState(false)

  const cargar = async()=>{
    setLoading(true); setError('')
    try{
      const [u,r,m]:any = await Promise.all([
        api.get('/api/v1/usuarios'),
        api.get('/api/v1/usuarios/roles-disponibles'),
        api.get('/api/v1/usuarios/modulos-disponibles'),
      ])
      setUsuarios(Array.isArray(u.data)? u.data : [])
      setRoles(Array.isArray(r.data)? r.data : [])
      setModulos(Array.isArray(m.data)? m.data : [])
    }catch(ex:any){
      setError(ex?.message || 'No se pudieron cargar los usuarios')
    }finally{ setLoading(false) }
    cargarFormatos()
  }
  useEffect(()=>{ cargar() },[])

  // ── Formatos y guías ──
  const cargarFormatos = async()=>{
    try{
      const r:any = await api.get('/api/v1/formatos')
      setFormatos(Array.isArray(r.data)? r.data : [])
    }catch{ setFormatos([]) }
  }

  const abrirSelector = (codigo:string)=>{
    setCodigoActivo(codigo)
    // Se resetea el value para que elegir el mismo archivo dos veces vuelva a disparar el change.
    if(inputFormato.current){ inputFormato.current.value=''; inputFormato.current.click() }
  }

  const alElegirArchivo = async (e: React.ChangeEvent<HTMLInputElement>)=>{
    const file = e.target.files?.[0]
    if(!file || !codigoActivo) return
    // Validación cliente: Office (docx/xlsx) hasta 32MB antes de subir.
    const errFile = validarArchivo(file, 'office')
    if(errFile){ setMsg({tipo:'err', texto: errFile}); setCodigoActivo(null); return }
    setSubiendo(codigoActivo); setMsg(null)
    try{
      const fd = new FormData()
      fd.append('archivo', file)
      fd.append('descripcion', `Formato actualizado por el administrador`)
      await api.upload(`/api/v1/formatos/${codigoActivo}/archivo`, fd)
      await cargarFormatos()
      const f = formatos.find(x=>x.codigo===codigoActivo)
      setMsg({tipo:'ok', texto:`Formato "${f?.nombre || codigoActivo}" actualizado`})
    }catch(ex:any){
      setMsg({tipo:'err', texto:ex?.message || 'No se pudo subir el archivo'})
    }finally{ setSubiendo(null); setCodigoActivo(null) }
  }

  const restaurar = async (codigo:string)=>{
    setSubiendo(codigo); setMsg(null)
    try{
      await api.del(`/api/v1/formatos/${codigo}/archivo`)
      await cargarFormatos()
      setMsg({tipo:'ok', texto:'Formato restaurado al original'})
    }catch(ex:any){
      setMsg({tipo:'err', texto:ex?.message || 'No se pudo restaurar el formato'})
    }finally{ setSubiendo(null) }
  }

  const cargarEstadoB2 = async ()=>{
    try{
      const r:any = await api.get('/api/v1/storage/estado')
      setB2Estado(r.data)
    }catch{ /* silencioso: el estado se reintenta */ }
  }
  const guardarB2 = async ()=>{
    setB2Busy(true); setB2Msg(null)
    try{
      await api.put('/api/v1/storage/b2', {
        b2_account_id: b2Form.account_id,
        b2_application_key: b2Form.app_key,
        b2_bucket_id: b2Form.bucket_id,
      })
      setB2Msg({tipo:'ok', texto:'¡Backblaze B2 conectado! Las subidas ya se guardan en el bucket privado.'})
      setB2Form({...b2Form, app_key:''})
      await cargarEstadoB2()
    }catch(ex:any){
      setB2Msg({tipo:'err', texto: ex?.message || 'No se pudo conectar con Backblaze B2'})
      await cargarEstadoB2()
    }finally{ setB2Busy(false) }
  }
  useEffect(()=>{ cargarEstadoB2() },[])

  const probarFormato = async (codigo:string)=>{
    // La descarga necesita el token: se pide como blob y se abre con una URL temporal.
    try{
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/v1/formatos/${codigo}/descargar`, { headers: { Authorization: `Bearer ${token}` } })
      if(!res.ok) throw new Error('No se pudo descargar el formato')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${codigo.toLowerCase()}.${(res.headers.get('content-disposition')||'').split('filename="')[1]?.split('"')[0] || 'archivo'}`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    }catch(ex:any){
      setMsg({tipo:'err', texto:ex?.message || 'No se pudo descargar'})
    }
  }

  const pesoLegible = (b:number)=>{
    if(!b) return ''
    return b > 1048576 ? `${(b/1048576).toFixed(1)} MB` : `${Math.round(b/1024)} KB`
  }

  const crear = async(e:React.FormEvent)=>{
    e.preventDefault()
    setMsg(null)
    if(!form.correo.trim() || !form.nombre.trim() || !form.password){ setMsg({tipo:'err', texto:'Correo, nombre y contraseña son obligatorios'}); return }
    if(form.password.length < 6){ setMsg({tipo:'err', texto:'La contraseña debe tener al menos 6 caracteres'}); return }
    setCreando(true)
    try{
      await api.post('/api/v1/usuarios', {
        correo: form.correo.trim(),
        nombre: form.nombre.trim(),
        password: form.password,
        rol_actor: form.rol_actor,
        id_persona: form.id_persona ? Number(form.id_persona) : undefined,
        modulos: form.modulos,
      })
      setMsg({tipo:'ok', texto:`Usuario ${form.correo} creado · ya puede iniciar sesión`})
      setForm({...formVacio})
      await cargar()
    }catch(ex:any){
      setMsg({tipo:'err', texto: ex?.message?.slice(0,300) || 'No se pudo crear el usuario'})
    }finally{ setCreando(false) }
  }

  const toggleActivo = async(u:Usuario)=>{
    setBusyId(u.id_usuario); setMsg(null)
    try{
      await api.put(`/api/v1/usuarios/${u.id_usuario}`, { activo: !u.activo })
      setUsuarios(prev=> prev.map(x=> x.id_usuario===u.id_usuario ? {...x, activo: !x.activo} : x))
      setMsg({tipo:'ok', texto:`${u.correo} ${u.activo? 'desactivado' : 'activado'}`})
    }catch(ex:any){ setMsg({tipo:'err', texto: ex?.message?.slice(0,300) || 'No se pudo cambiar el estado'}) }
    finally{ setBusyId(null) }
  }

  const toggleModulo = async(u:Usuario, clave:string)=>{
    const activos = u.modulos.includes(clave)
    setBusyId(u.id_usuario); setMsg(null)
    try{
      await api.put(`/api/v1/usuarios/${u.id_usuario}/permisos`, { modulo: clave, activo: !activos })
      setUsuarios(prev=> prev.map(x=> x.id_usuario===u.id_usuario
        ? {...x, modulos: activos ? x.modulos.filter(m=>m!==clave) : [...x.modulos, clave]}
        : x))
      setMsg({tipo:'ok', texto:`Módulo "${clave}" ${activos? 'desactivado' : 'activado'} para ${u.correo}`})
    }catch(ex:any){ setMsg({tipo:'err', texto: ex?.message?.slice(0,300) || 'No se pudo cambiar el permiso'}) }
    finally{ setBusyId(null) }
  }

  const [claveModal,setClaveModal]=useState<{u:Usuario, pass:string}|null>(null)
  const [claveBusy,setClaveBusy]=useState(false)
  const [claveMsg,setClaveMsg]=useState('')

  const abrirClave = (u:Usuario)=>{
    setClaveModal({u, pass:''}); setClaveMsg('')
  }
  const guardarClave = async()=>{
    if(!claveModal) return
    if(claveModal.pass.length < 6){ setClaveMsg('La contraseña debe tener al menos 6 caracteres'); return }
    setClaveBusy(true); setMsg(null)
    try{
      await api.put(`/api/v1/usuarios/${claveModal.u.id_usuario}`, { password: claveModal.pass })
      setMsg({tipo:'ok', texto:`Contraseña de ${claveModal.u.correo} actualizada`})
      setClaveModal(null)
    }catch(ex:any){ setClaveMsg(ex?.message?.slice(0,300) || 'No se pudo cambiar la contraseña') }
    finally{ setClaveBusy(false) }
  }

  const setTodosModulos = async(u:Usuario, activar:boolean)=>{
    setBusyId(u.id_usuario); setMsg(null)
    try{
      const claves = activar? modulos.map(m=>m.clave) : []
      await api.put(`/api/v1/usuarios/${u.id_usuario}`, { modulos: claves })
      setUsuarios(prev=> prev.map(x=> x.id_usuario===u.id_usuario ? {...x, modulos: claves} : x))
      setMsg({tipo:'ok', texto:`Funciones ${activar? 'activadas' : 'desactivadas'} para ${u.correo}`})
    }catch(ex:any){ setMsg({tipo:'err', texto: ex?.message?.slice(0,300) || 'No se pudieron cambiar las funciones'}) }
    finally{ setBusyId(null) }
  }

  const eliminar = async(u:Usuario)=>{
    if(!window.confirm(`¿Eliminar a ${u.correo}? Se borrarán también sus permisos.`)) return
    setBusyId(u.id_usuario); setMsg(null)
    try{
      await api.del(`/api/v1/usuarios/${u.id_usuario}`)
      setUsuarios(prev=> prev.filter(x=> x.id_usuario !== u.id_usuario))
      setMsg({tipo:'ok', texto:`Usuario ${u.correo} eliminado`})
    }catch(ex:any){ setMsg({tipo:'err', texto: ex?.message?.slice(0,300) || 'No se pudo eliminar el usuario'}) }
    finally{ setBusyId(null) }
  }

  const todosModulos = (claves:string[])=> claves.length === modulos.length && modulos.length>0

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Administración del sistema"
        subtitle="Como administrador controlas quién entra y qué funciones puede usar cada usuario."
        icon={<UserCog size={20}/>}
        badge={<span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-xs font-bold">{usuarios.length} usuarios</span>}
      />

      <Alert variant="info" className="text-xs">
        <b>Tu rol:</b> Administrador ({user?.correo}). Puedes crear usuarios, activarlos o desactivarlos,
        restablecer contraseñas y encender o apagar funciones puntuales para cada cuenta.
      </Alert>

      {msg && <Alert variant={msg.tipo==='ok'?'success':'error'} className="text-xs">{msg.texto}</Alert>}
      {error && <Alert variant="error" className="text-xs"><div className="flex items-center justify-between gap-3"><span>{error}</span><Button size="sm" variant="outline" onClick={cargar}>Reintentar</Button></div></Alert>}

      <div className="grid lg:grid-cols-[1fr_1.6fr] gap-6 items-start">
        <Card hover>
          <CardHeader>
            <CardTitle><UserCog size={16} className="text-undc-700"/> Crear usuario</CardTitle>
            <p className="text-xs text-slate-500">La cuenta queda activa de inmediato con los módulos que marques.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={crear} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Correo institucional *</label>
                <Input type="email" value={form.correo} onChange={e=>setForm({...form, correo:e.target.value})} placeholder="nombre@undc.edu.pe"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Nombre completo *</label>
                <Input value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} placeholder="Ana Quispe"/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Contraseña *</label>
                  <Input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} placeholder="mínimo 6"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Rol *</label>
                  <Select value={form.rol_actor} onChange={e=>setForm({...form, rol_actor:e.target.value})}>
                    {roles.length===0
                      ? <option value="ESTUDIANTE_PROP">Estudiante proponente</option>
                      : roles.map(r=> <option key={r.clave} value={r.clave}>{r.nombre}</option>)}
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">ID persona (docente/estudiante)</label>
                <Input value={form.id_persona} onChange={e=>setForm({...form, id_persona:e.target.value})} placeholder="Opcional — vincula con Docente/Estudiante"/>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Funciones habilitadas</label>
                  <button type="button" onClick={()=>setForm(f=>({...f, modulos: todosModulos(f.modulos)? [] : modulos.map(m=>m.clave)}))} className="text-[11px] font-bold text-undc-700 underline">
                    {todosModulos(form.modulos)? 'Quitar todas' : 'Marcar todas'}
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 max-h-52 overflow-auto pr-1">
                  {modulos.map(m=>(
                    <label key={m.clave} className="flex items-start gap-2 text-xs border border-slate-200 rounded-xl p-2 cursor-pointer hover:bg-slate-50">
                      <input type="checkbox" className="mt-0.5 accent-undc-700" checked={form.modulos.includes(m.clave)}
                        onChange={e=> setForm(f=>({...f, modulos: e.target.checked ? [...f.modulos, m.clave] : f.modulos.filter(x=>x!==m.clave)}))}/>
                      <span className="min-w-0"><b className="block leading-tight">{m.nombre}</b><span className="text-slate-500 leading-tight">{m.desc}</span></span>
                    </label>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Si no marcas ninguna, el usuario podrá entrar pero sin funciones asignadas.</div>
              </div>
              <Button type="submit" className="w-full bg-undc-700" loading={creando}>Crear usuario</Button>
            </form>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle><ShieldCheck size={16}/> Usuarios y funciones</CardTitle>
            <p className="text-xs text-slate-500">Activa o desactiva el acceso y las funciones de cada cuenta.</p>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-40 w-full"/> :
             usuarios.length===0 ? <Empty title="Sin usuarios" description="Crea el primero con el formulario."/> : (
              <div className="space-y-3">
                {usuarios.map(u=>{
                  const todosOn = todosModulos(u.modulos)
                  return (
                    <div key={u.id_usuario} className={`border rounded-2xl p-3 sm:p-4 ${u.activo? 'border-slate-200':'border-slate-200 bg-slate-50'}`}>
                      <div className="flex flex-wrap items-start gap-3 justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900">{u.nombre}</span>
                            <Badge color={u.activo? '#10b981':'#94a3b8'} variant="soft">{u.activo? 'Activo' : 'Inactivo'}</Badge>
                            <Badge color="#6366f1" variant="soft">{u.tipo_usuario}</Badge>
                          </div>
                          <div className="text-xs text-slate-500 truncate">{u.correo}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Rol: <b className="text-slate-600">{u.rol}</b>
                            {u.id_persona? ` · persona #${u.id_persona}` : ''}
                            {u.ultimo_login? ` · último acceso ${String(u.ultimo_login).slice(0,16).replace('T',' ')}` : ' · sin accesos'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button size="sm" variant={u.activo? 'outline':'secondary'} leftIcon={<Power size={13}/>}
                            disabled={busyId===u.id_usuario || u.id_usuario===user?.id}
                            onClick={()=>toggleActivo(u)}>
                            {u.activo? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button size="sm" variant="outline" leftIcon={<KeyRound size={13}/>} disabled={busyId===u.id_usuario} onClick={()=>abrirClave(u)}>Contraseña</Button>
                          <Button size="sm" variant="ghost" className="text-red-600" leftIcon={<Trash2 size={13}/>}
                            disabled={busyId===u.id_usuario || u.id_usuario===user?.id}
                            onClick={()=>eliminar(u)} aria-label="Eliminar usuario"/>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Funciones ({u.modulos.length}/{modulos.length})
                          </span>
                          <button type="button"
                            onClick={()=>setTodosModulos(u, !todosOn)}
                            className="text-[11px] font-bold text-undc-700 underline">
                            {todosOn? 'Desactivar todas' : 'Activar todas'}
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {modulos.map(m=>{
                            const on = u.modulos.includes(m.clave)
                            return (
                              <button key={m.clave} type="button" disabled={busyId===u.id_usuario}
                                title={m.desc}
                                onClick={()=>toggleModulo(u, m.clave)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors disabled:opacity-60 ${
                                  on? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}>
                                {m.nombre}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
          </CardContent>
        </Card>
      </div>

{/* ── Formatos y guías ──────────────────────────────────────────
    Catálogo fijo de 7 formatos. Aquí solo se reemplaza el archivo de
    ejemplo que ve el estudiante; no se crean ni se borran formatos. */}
<div className="grid lg:grid-cols-[1fr_1.6fr] gap-6 items-start">
  <Card hover className="lg:sticky lg:top-6">
    <CardHeader>
      <CardTitle><FileText size={16} className="text-undc-700"/> Formatos y guías</CardTitle>
      <p className="text-xs text-slate-500">
        Los 7 formatos oficiales del ciclo RSU. Puedes reemplazar el archivo que se le
        ofrece al estudiante por una versión actualizada.
      </p>
    </CardHeader>
    <CardContent>
      <Alert variant="info" className="text-xs">
        <b>El catálogo es fijo.</b> No se agregan ni se quitan formatos. Si subes uno
        nuevo, el estudiante descargará ese archivo; si lo restauras, vuelve al original
        del sistema.
      </Alert>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-200 p-3 text-center">
          <div className="text-xl font-black text-slate-900">{formatos.length}</div>
          <div className="text-[11px] text-slate-500">formatos</div>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 text-center">
          <div className="text-xl font-black text-undc-700">{formatos.filter(f=>f.personalizado).length}</div>
          <div className="text-[11px] text-slate-500">personalizados</div>
        </div>
      </div>
    </CardContent>
  </Card>

  <Card hover>
    <CardHeader>
      <CardTitle>
        Archivos del catálogo
        {formatos.length>0 && <span className="ml-2 text-xs font-normal text-slate-400">({formatos.filter(f=>f.personalizado).length} de {formatos.length} modificados)</span>}
      </CardTitle>
      <p className="text-xs text-slate-500">
        Pulsa «Reemplazar» para subir un archivo nuevo. El formato original nunca se pierde:
        siempre puedes volver a él con «Restaurar».
      </p>
    </CardHeader>
    <CardContent>
      {formatos.length===0 ? (
        <Empty title="Sin formatos" description="No se pudieron leer los formatos del catálogo."/>
      ) : (
        <div className="space-y-3">
          {formatos.map(f=>{
            const esExcel = f.tipo==='xlsx'
            const trabajando = subiendo===f.codigo
            return (
              <div key={f.codigo} className={`border rounded-2xl p-3 sm:p-4 ${f.personalizado? 'border-undc-300 bg-undc-50/40' : 'border-slate-200'}`}>
                <div className="flex flex-wrap items-start gap-3 justify-between">
                  <div className="flex gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${esExcel? 'bg-emerald-100 text-emerald-700':'bg-sky-100 text-sky-700'}`}>
                      {esExcel? <FileSpreadsheet size={18}/> : <FileText size={18}/>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{f.nombre}</span>
                        {f.personalizado
                          ? <Badge color="#6366f1" variant="soft">v{f.version} · personalizado</Badge>
                          : <Badge color="#94a3b8" variant="soft">original v{f.version}</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{f.descripcion}</p>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {f.tipo.toUpperCase()}
                        {f.nombre_archivo? ` · ${f.nombre_archivo}` : ` · archivo del sistema`}
                        {f.peso_bytes? ` · ${pesoLegible(f.peso_bytes)}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <Button size="sm" variant="outline" leftIcon={<Download size={13}/>} onClick={()=>probarFormato(f.codigo)}>Ver</Button>
                    <Button size="sm" variant={f.personalizado? 'secondary':'primary'} leftIcon={<Upload size={13}/>}
                      disabled={trabajando} onClick={()=>abrirSelector(f.codigo)}>
                      {trabajando? 'Subiendo…' : 'Reemplazar'}
                    </Button>
                    {f.personalizado && (
                      <Button size="sm" variant="ghost" className="text-amber-600" leftIcon={<RotateCcw size={13}/>}
                        disabled={trabajando} onClick={()=>restaurar(f.codigo)}>Restaurar</Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </CardContent>
  </Card>
</div>

{claveModal && (
  <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={() => !claveBusy && setClaveModal(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-4 sm:p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900">Cambiar contraseña</h3>
                <p className="text-xs text-slate-500 mt-1 truncate">{claveModal.u.correo}</p>
              </div>
              <button
                onClick={() => !claveBusy && setClaveModal(null)}
                className="w-9 h-9 rounded-full bg-slate-100 grid place-items-center shrink-0 hover:bg-slate-200"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-700">
                Nueva contraseña <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                type="password"
                value={claveModal.pass}
                onChange={e => setClaveModal({ ...claveModal, pass: e.target.value })}
                placeholder="mínimo 6 caracteres"
              />
              {claveMsg && <div className="mt-2 text-xs text-red-600">{claveMsg}</div>}
            </div>

            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                onClick={() => setClaveModal(null)}
                disabled={claveBusy}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarClave}
                disabled={claveBusy || claveModal.pass.length < 6}
                className="px-4 py-2.5 bg-undc-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {claveBusy && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {claveBusy ? 'Guardando…' : 'Guardar contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Almacenamiento Backblaze B2 (solo ADMIN) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database size={16}/> Almacenamiento Backblaze B2</CardTitle>
          <p className="text-xs text-slate-500">
            Los documentos, fotos y entregables se guardan en el bucket privado de Backblaze.
            Pega aquí las credenciales de tu consola B2: se validan al instante y quedan activas sin reiniciar.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {b2Estado === null ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className={`rounded-xl border p-3 text-sm ${b2Estado.cloud ? (b2Estado.b2_ok ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200') : 'bg-slate-50 border-slate-200'}`}>
              <div className="font-bold flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${b2Estado.cloud ? (b2Estado.b2_ok ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-400'}`} />
                Driver: <span className="font-mono">{b2Estado.driver}</span>
                {b2Estado.cloud && <span className={b2Estado.b2_ok ? 'text-emerald-700' : 'text-amber-700'}>{b2Estado.b2_ok ? '· B2 conectado' : '· B2 no responde'}</span>}
              </div>
              {b2Estado.b2_error && <div className="text-xs text-amber-800 mt-1">{b2Estado.b2_error}</div>}
            </div>
          )}
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Application Key ID (accountId) *</label>
            <Input value={b2Form.account_id} onChange={e=>setB2Form({...b2Form, account_id:e.target.value.trim()})}
                   placeholder="005..." className="font-mono text-xs"/>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Backblaze → App Keys → tu clave. Debe tener 24+ caracteres y empezar con 003/005.
              Si solo ves unos pocos caracteres, ábrela en la consola y cópiala completa.
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Application Key *</label>
            <Input value={b2Form.app_key} onChange={e=>setB2Form({...b2Form, app_key:e.target.value.trim()})}
                   placeholder="K00..." className="font-mono text-xs" type="password"/>
            <div className="text-[11px] text-slate-400 mt-0.5">El secreto largo que aparece al crear la clave (solo se muestra una vez: guárdalo).</div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Bucket ID *</label>
            <Input value={b2Form.bucket_id} onChange={e=>setB2Form({...b2Form, bucket_id:e.target.value.trim()})}
                   placeholder="f64c..." className="font-mono text-xs"/>
          </div>
          {b2Msg && <Alert variant={b2Msg.tipo==='ok'?'success':'error'} className="text-xs">{b2Msg.texto}</Alert>}
          <div className="flex items-center gap-2">
            <Button onClick={guardarB2} disabled={b2Busy || !b2Form.account_id || !b2Form.app_key || !b2Form.bucket_id}
                    leftIcon={<Database size={14}/>}>
              {b2Busy ? 'Verificando…' : 'Verificar y conectar'}
            </Button>
            <Button variant="outline" onClick={cargarEstadoB2} disabled={b2Busy}>Actualizar estado</Button>
          </div>
          <div className="text-[11px] text-slate-400">
            Mientras B2 no esté conectado, las subidas devuelven error visible (no se guardan archivos a medias).
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
