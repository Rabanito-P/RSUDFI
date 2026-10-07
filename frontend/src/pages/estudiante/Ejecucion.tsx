import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

export default function Ejecucion(){
  const {user}=useAuth()
  const [p,setP]=useState<any>(null)
  const [ent,setEnt]=useState<any[]>([])
  const [docs,setDocs]=useState<any[]>([])
  const [msg,setMsg]=useState('')
  const [guardando,setGuardando]=useState(false)
  useEffect(()=>{
    if(!user) return
    api.get(`/api/v1/estudiantes/${user.id}/proyectos`).then((r:any)=>{
      const list=r.data||[]
      if(!list[0]) return
      setP(list[0])
      api.get(`/api/v1/proyectos/${list[0].id_proyecto}/entregables`).then((x:any)=>setEnt(x.data||[])).catch(()=>{})
      api.get(`/api/v1/proyectos/${list[0].id_proyecto}/documentos`).then((x:any)=>setDocs(x.data||[])).catch(()=>{})
    }).catch(()=>{})
  },[user?.id])

  const getEstado = (orden:number, hasDoc:boolean)=>{
    if(!hasDoc) return 'PENDIENTE'
    const found = ent.find((e:any)=>e.orden===orden)
    if(found?.estado==='OBSERVADO') return 'OBSERVADO'
    if(found?.estado==='APROBADO') return 'APROBADO'
    return 'REGISTRADO'
  }
  const hasDocFor = (orden:number)=> docs.some((d:any)=> d.id_tipo_doc===1 && String(d.nombre_archivo||'').includes(String(orden))) || false

  const subir = async (e:any, orden:number)=>{
    const file=e.target.files?.[0]
    if(!file) return
    const fd=new FormData()
    fd.append('id_proyecto', String(p.id_proyecto))
    fd.append('id_tipo_doc', String(orden<=3?1:orden===4?11:9))
    fd.append('id_usuario_subida', String(user?.id))
    fd.append('archivo', file)
    try{
      await api.upload('/api/v1/documentos/upload', fd)
      const x:any=await api.get(`/api/v1/proyectos/${p.id_proyecto}/documentos`)
      setDocs(x.data||[])
      setMsg(`Archivo registrado para ${orden===4?'Encuesta':orden===5?'Informe Final':`Entregable ${orden}`}. Estado: Registrado.`)
      setTimeout(()=>setMsg(''),3000)
    }catch(err:any){ setMsg(err.message) }
  }
  const descargarGuia = (orden:number)=>{
    const a=document.createElement('a')
    a.href=`/guias/entregable-${orden}.docx`
    a.download=`Guia-Entregable-${orden}.docx`
    a.click()
    setMsg(`Descargando guía entregable ${orden} (W)`)
    setTimeout(()=>setMsg(''),2000)
  }

  const [modalOrden,setModalOrden]=useState<number|null>(null)
  const [modalFile,setModalFile]=useState<File|null>(null)
  const [registrando,setRegistrando]=useState(false)

  const abrirModal = (orden:number)=>{
    const d=demo.find((x:any)=>x.orden===orden)
    setModalOrden(orden); setModalFile(null); setModalHoras(d?.horas? String(d.horas):''); setMsg('')
  }
  const cerrarModal = ()=>{ setModalOrden(null); setModalFile(null); setModalHoras('') }
  const registrarEntregable = async()=>{
    if(!modalFile || !modalOrden || !p) return
    if(!modalHoras || isNaN(Number(modalHoras)) || Number(modalHoras)<=0){ setMsg('Indica la cantidad de horas'); return }
    setRegistrando(true)
    const fd=new FormData()
    fd.append('id_proyecto', String(p.id_proyecto))
    fd.append('id_tipo_doc', String(modalOrden<=3?1:modalOrden===4?11:9))
    fd.append('id_usuario_subida', String(user?.id))
    fd.append('archivo', modalFile)
    try{
      await api.upload('/api/v1/documentos/upload', fd)
      // actualiza horas y estado en backend (entregable)
      try{
        const entId = ent.find((e:any)=>e.orden===modalOrden)?.id_entregable
        if(entId){
          await api.patch(`/api/v1/entregables/${entId}`, { horas_asignadas: Number(modalHoras), estado:'REGISTRADO' })
          const y:any=await api.get(`/api/v1/proyectos/${p.id_proyecto}/entregables`)
          setEnt(y.data||[])
        } else {
          // si no existe entregable aún, actualiza demo local
          setEnt(prev=> prev.length? prev : demo.map((d:any)=> d.orden===modalOrden? {...d, horas:Number(modalHoras), estado:'REGISTRADO'}: d))
        }
      }catch{}
      const x:any=await api.get(`/api/v1/proyectos/${p.id_proyecto}/documentos`)
      setDocs(x.data||[])
      setMsg(`Entregable ${modalOrden===4?'Encuesta':modalOrden===5?'Informe Final':`#${modalOrden}`} registrado (${modalHoras}h). Estado: Registrado.`)
      setTimeout(()=>setMsg(''),3000)
      cerrarModal()
    }catch(err:any){ setMsg(err.message) }
    finally{ setRegistrando(false) }
  }

  const [modalHoras,setModalHoras]=useState<string>('')
  const demo = ent.length? ent : [
    {orden:1,nombre:'PRIMER ENTREGABLE', fecha_limite:'2026-07-05', horas:22, estado:'PENDIENTE'},
    {orden:2,nombre:'SEGUNDO ENTREGABLE', fecha_limite:'2026-08-02', horas:16, estado:'PENDIENTE'},
    {orden:3,nombre:'TERCER ENTREGABLE', fecha_limite:'2026-09-06', horas:22, estado:'PENDIENTE'},
    {orden:4,nombre:'ENCUESTA', fecha_limite:null, horas:null, estado:'PENDIENTE'},
    {orden:5,nombre:'INFORME FINAL', fecha_limite:null, horas:null, estado:'PENDIENTE'},
  ]
  if(!p) return <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm">Sin proyecto activo</div>
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-black">Ejecución proyecto — {p.titulo}</h2>
        <p className="text-xs text-slate-500">Pulsa <b>W</b> para descargar la guía. Cada fila tiene su <b>Registrar</b> que abre el formulario superpuesto.</p>
        {msg && <div className="mt-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-2">{msg}</div>}
        <table className="w-full text-xs mt-4 border-collapse">
          <thead><tr className="bg-[#0f2b24] text-white"><th className="px-2 py-2 text-left">ENTREGA</th><th className="px-2 py-2">EJEMPLARES - GUIAS</th><th className="px-2 py-2">FECHA LIMITE</th><th className="px-2 py-2">ARCHIVO</th><th className="px-2 py-2">HORAS</th><th className="px-2 py-2">ESTADO</th><th className="px-2 py-2">ACCIÓN</th></tr></thead>
          <tbody>
            {demo.map((x:any)=>{
              const hasDoc = hasDocFor(x.orden)
              const estado = getEstado(x.orden, hasDoc)
              const color = estado==='PENDIENTE'? 'bg-slate-100 text-slate-600': estado==='OBSERVADO'? 'bg-amber-100 text-amber-700': estado==='APROBADO'?'bg-emerald-100 text-emerald-700':'bg-sky-100 text-sky-700'
              return (
              <tr key={x.orden} className="border-b border-slate-100">
                <td className="px-2 py-2 font-medium">{x.nombre}</td>
                <td className="px-2 py-2 text-center"><button onClick={()=>descargarGuia(x.orden)} className="w-5 h-5 bg-sky-600 text-white rounded inline-grid place-items-center text-[10px] hover:bg-sky-700" title="Descargar formato Word">W</button></td>
                <td className="px-2 py-2 text-center">{x.fecha_limite? new Date(x.fecha_limite).toLocaleDateString('es-PE'): 'No aplica'}</td>
                <td className="px-2 py-2 text-center">{hasDoc ? <span className="w-5 h-5 bg-red-600 text-white rounded inline-grid place-items-center text-[10px]" title="PDF registrado">PDF</span> : <span className="text-slate-400">—</span>}</td>
                <td className="px-2 py-2 text-center">{x.horas? `${x.horas} horas`:'No Aplica'}</td>
                <td className="px-2 py-2 text-center"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${color}`}>{estado}</span></td>
                <td className="px-2 py-2 text-center">
                  <button onClick={()=>abrirModal(x.orden)} className="px-2 py-1 bg-undc-700 text-white rounded text-[11px] hover:bg-undc-800">Registrar</button>
                </td>
              </tr>
              )})}
          </tbody>
        </table>
      </div>

      {modalOrden!==null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={cerrarModal}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-slate-900">Registrar entregable</h3>
                <p className="text-xs text-slate-500 mt-1">Entrega: <b>{demo.find((d:any)=>d.orden===modalOrden)?.nombre}</b> — completa horas y PDF</p>
              </div>
              <button onClick={cerrarModal} className="w-8 h-8 rounded-full bg-slate-100 grid place-items-center">✕</button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold">Cantidad de horas *</label>
                <input type="number" min="1" value={modalHoras} onChange={e=>setModalHoras(e.target.value)} placeholder="Ej. 22" className="mt-1 block w-full text-sm border border-slate-200 rounded-xl p-2"/>
              </div>
              <div>
                <label className="text-xs font-semibold">Archivo PDF *</label>
                <input type="file" accept=".pdf" onChange={e=>setModalFile(e.target.files?.[0]||null)} className="mt-1 block w-full text-sm border border-slate-200 rounded-xl p-2"/>
                {modalFile && <div className="mt-2 text-xs text-slate-600">{modalFile.name} — {(modalFile.size/1024/1024).toFixed(2)} MB</div>}
                {modalFile && modalFile.size > 32*1024*1024 && <div className="text-xs text-red-600">Archivo excede 32MB</div>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={cerrarModal} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm">Cancelar</button>
              <button onClick={registrarEntregable} disabled={!modalFile || !modalHoras || registrando} className="px-4 py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">{registrando?'Subiendo...':'Registrar'}</button>
            </div>
            <div className="mt-3 text-[11px] text-slate-500">Se guardan horas y PDF juntos. Estado → <b>Registrado</b>.</div>
          </div>
        </div>
      )}
    </div>
  )
}
