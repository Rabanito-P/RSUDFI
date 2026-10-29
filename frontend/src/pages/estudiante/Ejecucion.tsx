import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
import { validarArchivo } from '../../lib/archivos'
import { Download, CheckCircle2, Send, PencilLine, FileText } from 'lucide-react'

const NOMBRES: Record<number, string> = { 1: 'PRIMER ENTREGABLE', 2: 'SEGUNDO ENTREGABLE', 3: 'TERCER ENTREGABLE', 4: 'ENCUESTA', 5: 'INFORME FINAL' }
const ORDENES = [1, 2, 3, 4, 5]
const MAX_MB = 32

// Estados canónicos: POR_ENVIAR→ENVIADO→OBSERVADO/APROBADO(=correcto). Legados mapeados.
const normEstado = (e?: string)=>{
  if(e==='PENDIENTE') return 'POR_ENVIAR'
  if(e==='REGISTRADO'||e==='SUBIDO') return 'ENVIADO'
  if(e==='CORRECTO') return 'APROBADO'
  return e || 'POR_ENVIAR'
}
const ETIQUETA: Record<string,string> = { POR_ENVIAR:'POR ENVIAR', ENVIADO:'ENVIADO', OBSERVADO:'OBSERVADO', APROBADO:'CORRECTO' }

export default function Ejecucion(){
  const {user}=useAuth()
  const [p,setP]=useState<any>(null)
  const [ent,setEnt]=useState<any[]>([])
  const [msg,setMsg]=useState('')
  const [msgErr,setMsgErr]=useState(false)

  const flashTimer = useRef<number|null>(null)
  // Evita llamar setState si el componente ya se desmonto (warning de React y
  // trabajo perdido): el temporizador se cancela al salir de la pantalla.
  useEffect(()=>()=>{ if(flashTimer.current) window.clearTimeout(flashTimer.current) },[])
  const flash = (t:string, err=false)=>{
    setMsg(t); setMsgErr(err)
    if(flashTimer.current) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(()=>setMsg(''),4000)
  }

  const cargar = async (idProyecto:number)=>{
    try{ const y:any=await api.get(`/api/v1/proyectos/${idProyecto}/entregables`); setEnt(y.data||[]) }catch{ setEnt([]) }
  }
  useEffect(()=>{
    if(!user) return
    api.get(`/api/v1/estudiantes/${user.persona_id}/proyectos`).then((r:any)=>{
      const list=r.data||[]
      if(!list[0]) return
      setP(list[0])
      cargar(list[0].id_proyecto)
    }).catch(()=>{})
  },[user?.persona_id])

  const porOrden = (orden:number)=> ent.find((e:any)=>e.orden===orden)
  const estadoDe = (orden:number)=> normEstado(porOrden(orden)?.estado)
  const bloqueado = (orden:number)=>{
    const s = estadoDe(orden)
    return s==='ENVIADO' || s==='APROBADO' // enviado: desactivado esperando verificación; correcto: terminal
  }
  const docUrl = (orden:number)=>{
    const u = porOrden(orden)?.documento?.url_archivo as string | undefined
    return api.fileUrl(u)
  }
  const esPdf = (f: File)=> /\.pdf$/i.test(f.name) || f.type === 'application/pdf' || f.type === ''

  // Formato de cada entregable (orden 1-5). Se pide por su código del
  // catálogo, así el administrador puede reemplazar el archivo sin cambiar
  // esta pantalla: GET /api/v1/formatos/<codigo>/descargar.
  const PLANTILLA: Record<number, string> = {
    1: 'PRIMER_ENTREGABLE',
    2: 'SEGUNDO_ENTREGABLE',
    3: 'TERCER_ENTREGABLE',
    4: 'ENCUESTA',
    5: 'INFORME_FINAL',
  }

  // Descarga con token: la ruta requiere Authorization, así que se pide por
  // fetch y se dispara un enlace temporal (un <a href> directo daría 401).
  const descargarFormato = async(orden:number)=>{
    const codigo = PLANTILLA[orden]
    if(!codigo){ flash('Ese entregable no tiene formato asignado', true); return }
    try{
      const raw = localStorage.getItem('undc_user')
      const token = raw ? JSON.parse(raw)?.token : ''
      const res = await fetch(`/api/v1/formatos/${codigo}/descargar`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if(!res.ok) throw new Error(`HTTP ${res.status}`)
      const cd = res.headers.get('content-disposition') || ''
      const nombre = cd.split('filename="')[1]?.split('"')[0] || `${codigo.toLowerCase()}.docx`
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a=document.createElement('a')
      a.href=url; a.download=nombre
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      flash(`Formato "${nombre}" descargado`)
    }catch{
      flash('No se pudo descargar el formato', true)
    }
  }

  const [modalOrden,setModalOrden]=useState<number|null>(null)
  const [modalFile,setModalFile]=useState<File|null>(null)
  const [modalHoras,setModalHoras]=useState<string>('')
  const [registrando,setRegistrando]=useState(false)
  const [guiaOrden,setGuiaOrden]=useState<number|null>(null)
  const [guiaTexto,setGuiaTexto]=useState('')
  const [guiaCargando,setGuiaCargando]=useState(false)

  const abrirModal = (orden:number)=>{
    if(bloqueado(orden)){ flash(estadoDe(orden)==='APROBADO' ? 'Entregable CORRECTO: ya no admite cambios.' : 'Entregable ENVIADO: espera verificación (descarga el PDF).', true); return }
    const e = porOrden(orden)
    setModalOrden(orden); setModalFile(null)
    setModalHoras(e?.horas_asignadas? String(e.horas_asignadas):''); setMsg('')
  }
  const cerrarModal= ()=>{ if(!registrando){ setModalOrden(null); setModalFile(null); setModalHoras('') } }

  const excesoTam = !!modalFile && modalFile.size > MAX_MB*1024*1024
  const registrarEntregable = async()=>{
    if(!modalFile || !modalOrden || !p || registrando) return
    if(!modalHoras || isNaN(Number(modalHoras)) || Number(modalHoras)<=0){ flash('Indica la cantidad de horas (mayor a 0).', true); return }
    // Validación cliente antes de subir (el backend revalida siempre).
    const errArchivo = validarArchivo(modalFile, 'pdf')
    if(errArchivo){ flash(errArchivo, true); return }
    if(excesoTam){ flash(`El archivo excede ${MAX_MB}MB.`, true); return }
    setRegistrando(true)
    const fd=new FormData()
    fd.append('orden', String(modalOrden))
    fd.append('horas_asignadas', String(Number(modalHoras)))
    fd.append('id_tipo_doc', String(modalOrden<=3?1:modalOrden===4?11:9))
    fd.append('id_usuario_subida', String(user?.persona_id))
    fd.append('archivo', modalFile)
    try{
      await api.upload(`/api/v1/proyectos/${p.id_proyecto}/entregables/registrar`, fd)
      await cargar(p.id_proyecto)
      flash(`Entregable ${modalOrden===4?'Encuesta':modalOrden===5?'Informe Final':`#${modalOrden}`} ENVIADO (${modalHoras}h). Queda desactivado hasta verificación.`)
      setModalOrden(null); setModalFile(null); setModalHoras('')
    }catch(err:any){
      const m = String(err.message||'')
      if(m.includes('409') || m.toLowerCase().includes('ya enviado')) flash('Este entregable ya está ENVIADO (409). Descarga el PDF en la columna ARCHIVO.', true)
      else flash(m || 'Error al registrar', true)
    }
    finally{ setRegistrando(false) }
  }

  if(!p) return <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm">Sin proyecto activo</div>
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
        <h2 className="font-black text-base sm:text-lg">Ejecución proyecto — {p.titulo}</h2>
        <p className="text-xs text-slate-500">Pulsa <b>W</b> para descargar la guía. <b>POR ENVIAR</b> → botón <b>Registrar</b> activo · <b>ENVIADO/CORRECTO</b> → desactivado (PDF descargable) · <b>OBSERVADO</b> → botón <b>Actualizar</b> para corregir y re-enviar. Equipo mínimo 2 estudiantes.</p>
        {msg && <div className={`mt-2 text-xs rounded-xl p-2 border ${msgErr?'bg-red-50 border-red-200 text-red-700':'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>{msg}</div>}
        <div className="overflow-x-auto mt-4 -mx-1 px-1">
        <table className="w-full text-xs border-collapse min-w-[760px]">
          <thead><tr className="bg-[#0f2b24] text-white"><th className="px-2 py-2 text-left">ENTREGA</th><th className="px-2 py-2">EJEMPLARES - GUIAS</th><th className="px-2 py-2">FECHA LIMITE</th><th className="px-2 py-2">ARCHIVO</th><th className="px-2 py-2">HORAS</th><th className="px-2 py-2">ESTADO</th><th className="px-2 py-2">ACCIÓN</th></tr></thead>
          <tbody>
            {ORDENES.map((orden)=>{
              const e = porOrden(orden)
              const estado = estadoDe(orden)
              const url = docUrl(orden)
              const color = estado==='POR_ENVIAR'? 'bg-slate-100 text-slate-600': estado==='OBSERVADO'? 'bg-amber-100 text-amber-700': estado==='APROBADO'?'bg-emerald-100 text-emerald-700':'bg-sky-100 text-sky-700'
              return (
              <tr key={orden} className="border-b border-slate-100">
                <td className="px-2 py-2 font-medium">{e?.nombre || NOMBRES[orden]}
                  {estado==='OBSERVADO' && e?.observaciones && <div className="text-[10px] text-amber-700 font-normal mt-0.5">Obs: {e.observaciones}</div>}
                </td>
                <td className="px-2 py-2 text-center"><button onClick={()=>descargarFormato(orden)} className="inline-flex items-center justify-center min-w-[44px] min-h-[28px] px-2 py-1 bg-sky-600 text-white rounded-lg text-[11px] font-bold hover:bg-sky-700" title="Descargar formato del entregable (Word)"><FileText size={12} className="mr-1"/>Formato</button></td>
                <td className="px-2 py-2 text-center">{e?.fecha_limite? new Date(e.fecha_limite).toLocaleDateString('es-PE'): 'No aplica'}</td>
                <td className="px-2 py-2 text-center">
                  {url ? <a href={url} download title="Descargar PDF enviado" className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700"><Download size={11}/>PDF</a>
                  : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-2 py-2 text-center">{e?.horas_asignadas? `${e.horas_asignadas} horas`:'No Aplica'}</td>
                <td className="px-2 py-2 text-center"><span title={e?.estado} className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${color}`}>{ETIQUETA[estado]||estado}</span></td>
                <td className="px-2 py-2 text-center">
                  {estado==='POR_ENVIAR' ? (
                    <button onClick={()=>abrirModal(orden)} className="inline-flex items-center gap-1 px-2 py-1 bg-undc-700 text-white rounded text-[11px] hover:bg-undc-800"><Send size={11}/>Registrar</button>
                  ) : estado==='OBSERVADO' ? (
                    <button onClick={()=>abrirModal(orden)} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600 text-white rounded text-[11px] hover:bg-amber-700" title="Corregir y re-enviar"><PencilLine size={11}/>Actualizar</button>
                  ) : estado==='ENVIADO' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50 border border-sky-200 text-sky-700 rounded text-[11px] font-bold" title="Enviado: desactivado hasta verificación"><Send size={11}/>Enviado</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-[11px] font-bold" title="Correcto/aprobado: terminal, desactivado"><CheckCircle2 size={12}/>Correcto</span>
                  )}
                </td>
              </tr>
              )})}
          </tbody>
        </table>
        </div>
      </div>

      {modalOrden!==null && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={cerrarModal}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-slate-900">{estadoDe(modalOrden)==='OBSERVADO' ? 'Actualizar entregable observado' : 'Registrar entregable'}</h3>
                <p className="text-xs text-slate-500 mt-1">Entrega: <b>{porOrden(modalOrden)?.nombre || NOMBRES[modalOrden]}</b> — completa horas y PDF (pasa a ENVIADO){estadoDe(modalOrden)==='OBSERVADO' && porOrden(modalOrden)?.observaciones ? ` · Obs: ${porOrden(modalOrden).observaciones}` : ''}</p>
              </div>
              <button onClick={cerrarModal} className="w-8 h-8 rounded-full bg-slate-100 grid place-items-center">✕</button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold">Cantidad de horas *</label>
                <input type="number" min="1" value={modalHoras} onChange={e=>setModalHoras(e.target.value)} placeholder="Ej. 22" className="mt-1 block w-full text-sm border border-slate-200 rounded-xl p-2"/>
              </div>
              <div>
                <label className="text-xs font-semibold">Archivo PDF * (máx {MAX_MB}MB)</label>
                <input type="file" accept=".pdf,application/pdf" onChange={e=>setModalFile(e.target.files?.[0]||null)} className="mt-1 block w-full text-sm border border-slate-200 rounded-xl p-2"/>
                {modalFile && <div className="mt-2 text-xs text-slate-600">{modalFile.name} — {(modalFile.size/1024/1024).toFixed(2)} MB</div>}
                {excesoTam && <div className="text-xs text-red-600">Archivo excede {MAX_MB}MB: elige uno más liviano.</div>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={cerrarModal} disabled={registrando} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm disabled:opacity-60">Cancelar</button>
              <button onClick={registrarEntregable} disabled={!modalFile || !modalHoras || registrando || excesoTam} className="px-4 py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">{registrando?'Subiendo...':'Registrar'}</button>
            </div>
            <div className="mt-3 text-[11px] text-slate-500">Se guardan horas y PDF juntos. Estado → <b>ENVIADO</b> (desactivado). Si lo observan, podrás <b>Actualizar</b>.</div>
          </div>
        </div>
      )}
    </div>
  )
}
