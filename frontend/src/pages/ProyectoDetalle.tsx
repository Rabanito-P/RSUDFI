import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import { ESTADOS, canStudentEdit, canStudentUploadDocs, canStudentRegisterActivity } from '../utils/permissions'

export default function ProyectoDetalle(){
  const {id}=useParams()
  const {user} = useAuth()
  const [p,setP]=useState<any>(null)
  const [tab,setTab]=useState('general')
  const [historial,setHistorial]=useState<any[]>([])
  const [entregables,setEntregables]=useState<any[]>([])
  const [actividades,setActividades]=useState<any[]>([])
  const [esMiembro,setEsMiembro]=useState<boolean>(false)
  const [miembrosIds,setMiembrosIds]=useState<number[]>([])
  // form actividad (Image3)
  const [formAct,setFormAct]=useState({fecha: new Date().toISOString().slice(0,10), nombre:'', horas:0, minutos:0, horaFin:'', descripcion:''})
  const [submitting,setSubmitting]=useState(false)

  useEffect(()=>{
    let cancelled = false
    async function load(){
      try{
        const r:any = await api.get(`/api/v1/proyectos/${id}`)
        if(cancelled) return
        let ids: number[] = miembrosIds
        if(user?.rol==='ESTUDIANTE'){
          try{
            const m:any = await api.get(`/api/v1/proyectos/${id}/estudiantes`)
            ids = (m.data||[]).map((x:any)=> x.id_estudiante || x.idEstudiante || x.id_estudiante_lider).filter(Boolean)
            if(!cancelled) setMiembrosIds(ids)
          }catch{}
          try{
            const e:any = await api.get(`/api/v1/proyectos/${id}/es-miembro/${user.id}`)
            if(!cancelled) setEsMiembro(!!e.data?.es_miembro)
          }catch{ if(!cancelled) setEsMiembro(true) }
        }
        if(!cancelled) setP({...r.data, _miembros_ids: ids})
      }catch{
        if(!cancelled) setP({
          id_proyecto:id, codigo_proyecto:`RSU-2026-${id}`, titulo:'Campaña de salud integral en San Vicente', estado_actual:{id_estado:9,codigo:'EN_EJECUCION', nombre:'En ejecución',color_ui:'#2196F3', orden_flujo:9},
          escuela:{nombre:'Enfermería',facultad:{nombre:'Ciencias de la Salud'}}, tipo:{nombre:'Proyección Social'}, presupuesto_aprobado:12000, monto_ejecutado:4500, porcentaje_avance:38,
          objetivo_general:'Mejorar indicadores de salud preventiva', lugar_intervencion:'San Vicente', poblacion_beneficiaria:'Familias vulnerables', id_estudiante_lider:101, _miembros_ids: miembrosIds
        })
      }
      try{
        const h:any = await api.get(`/api/v1/proyectos/${id}/historial`)
        if(!cancelled) setHistorial(h.data||[])
      }catch{
        if(!cancelled) setHistorial([
          {id_flujo:1, estado_origen:{nombre:'Borrador'}, estado_destino:{nombre:'En revisión Escuela'}, rol_actor:{nombre:'Docente Responsable'}, resultado:'APROBADO', fecha_transicion:'2026-03-10'},
          {id_flujo:2, estado_origen:{nombre:'En revisión Escuela'}, estado_destino:{nombre:'Con V°B° Escuela'}, rol_actor:{nombre:'Director de Escuela'}, resultado:'APROBADO', fecha_transicion:'2026-03-15'},
        ])
      }
      try{
        const e:any = await api.get(`/api/v1/proyectos/${id}/entregables`)
        if(!cancelled) setEntregables(e.data||[])
      }catch{}
      try{
        const a:any = await api.get(`/api/v1/proyectos/${id}/actividades`)
        if(!cancelled) setActividades(a.data||[])
      }catch{}
    }
    load()
    return ()=> { cancelled = true }
  },[id, user?.id])

  if(!p) return <div className="p-8 text-sm">Cargando expediente...</div>

  const codigo = p.estado_actual?.codigo || 'BORRADOR'
  const esMiembroEquipo = esMiembro || p.id_estudiante_lider===user?.id || user?.rol==='ADMIN' || user?.rol==='DOCENTE' || user?.rol==='DIRECTIVO'
  const esEstudiante = user?.rol==='ESTUDIANTE'
  // para estudiante, solo miembro real puede ver contenido; para otros roles, acceso completo
  const bloqueadoEstudianteNoMiembro = esEstudiante && !esMiembro && p.id_estudiante_lider!==user?.id

  const editableByStudent = canStudentEdit(codigo) && esEstudiante && esMiembro
  const puedeSubirDocs = canStudentUploadDocs(codigo, user, p, esMiembro) || (!esEstudiante)
  const puedeRegistrarActividad = canStudentRegisterActivity(codigo, esMiembro) || (!esEstudiante && codigo==='EN_EJECUCION')
  const isDocente = user?.rol==='DOCENTE'
  const isDirectivo = user?.rol==='DIRECTIVO' || user?.rol==='ADMIN'
  const estadoInfo = ESTADOS.find(e=>e.codigo===codigo)

  const handleCrearActividad = async(e:any)=>{
    e.preventDefault()
    if(!formAct.nombre || !formAct.descripcion || !formAct.fecha) return
    setSubmitting(true)
    try{
      await api.post('/api/v1/actividades', {id_proyecto: Number(id), nombre: formAct.nombre, descripcion: formAct.descripcion, fecha_programada: formAct.fecha, lugar: p.lugar_intervencion })
      // refresca
      const a:any = await api.get(`/api/v1/proyectos/${id}/actividades`)
      setActividades(a.data||[])
      setFormAct({fecha: new Date().toISOString().slice(0,10), nombre:'', horas:0, minutos:0, horaFin:'', descripcion:''})
    }catch(err){ alert((err as any).message) } finally { setSubmitting(false)}
  }

  const demoEntregables = entregables.length ? entregables : [
    {id_entregable:1, nombre:'PRIMER ENTREGABLE', orden:1, fecha_limite:'2026-07-05', horas_asignadas:22, estado:'APROBADO'},
    {id_entregable:2, nombre:'SEGUNDO ENTREGABLE', orden:2, fecha_limite:'2026-08-02', horas_asignadas:16, estado:'APROBADO'},
    {id_entregable:3, nombre:'TERCER ENTREGABLE', orden:3, fecha_limite:'2026-09-06', horas_asignadas:22, estado:'APROBADO'},
    {id_entregable:4, nombre:'ENCUESTA', orden:4, fecha_limite:null, horas_asignadas:null, estado:'APROBADO'},
    {id_entregable:5, nombre:'INFORME FINAL', orden:5, fecha_limite:null, horas_asignadas:null, estado:'APROBADO'},
  ]

  if(bloqueadoEstudianteNoMiembro){
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 grid place-items-center mx-auto text-xl">!</div>
        <h2 className="font-bold text-slate-800 mt-3">Este no es tu proyecto</h2>
        <p className="text-sm text-slate-500 mt-1">Solo puedes ver tu único proyecto activo. Si fuiste retirado, contacta al docente responsable.</p>
        <Link to="/mis-proyectos" className="inline-flex mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold">Volver a mi proyecto</Link>
      </div>
    )
  }

  const tabs = esEstudiante
    ? [['general','Resumen'], ['entregables','Entregables'], ['evidencias','Evidencias'], ['beneficiarios','Beneficiarios']]
    : [['general','General'], ['entregables','Entregables'], ['evidencias','Evidencias'], ['flujo','Flujo'], ['beneficiarios','Beneficiarios']]

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded-lg">{p.codigo_proyecto}</span>
          <Badge color={p.estado_actual?.color_ui}>{p.estado_actual?.nombre}</Badge>
          {esEstudiante && <span className="text-xs bg-sky-50 border border-sky-200 text-sky-700 px-2 py-1 rounded-full">Mi proyecto</span>}
        </div>
        <h1 className="text-xl font-extrabold text-slate-800 mt-2">{p.titulo}</h1>
        <div className="text-sm text-slate-500">{p.escuela?.facultad?.nombre} · {p.escuela?.nombre} · {p.tipo?.nombre}</div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">Avance</div><div className="font-black text-lg">{p.porcentaje_avance}%</div><div className="h-2 bg-slate-200 rounded-full mt-1"><div className="h-full bg-emerald-600 rounded-full" style={{width:`${p.porcentaje_avance}%`}}/></div></div>
          <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">Presupuesto</div><div className="font-semibold">S/ {p.presupuesto_aprobado?.toLocaleString()} aprobado</div><div className="text-xs text-slate-500">Ejecutado S/ {p.monto_ejecutado?.toLocaleString()}</div></div>
          <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">Lugar</div><div className="font-semibold">{p.lugar_intervencion}</div><div className="text-xs text-slate-500">{p.poblacion_beneficiaria}</div></div>
        </div>
        {esEstudiante && (
          <div className="mt-3 text-xs rounded-xl p-3 border bg-sky-50 border-sky-200 text-sky-800">
            {editableByStudent && <span>Puedes editar este proyecto en <b>{codigo}</b> y enviarlo a revisión.</span>}
            {puedeSubirDocs && !editableByStudent && <span>Puedes subir entregables y evidencias en <b>{codigo}</b>. Usa las pestañas Entregables y Evidencias.</span>}
            {!puedeSubirDocs && !editableByStudent && <span>Solo lectura en <b>{codigo}</b>. El docente/director revisará tu avance.</span>}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex gap-1 overflow-x-auto">
        {tabs.map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${tab===k?'bg-slate-900 text-white':'text-slate-600 hover:bg-slate-100'}`}>{label}</button>
        ))}
      </div>

      {tab==='general' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <h3 className="font-bold">Objetivo general</h3>
          <p className="text-sm text-slate-600">{p.objetivo_general || 'Mejorar indicadores del proyecto en la comunidad.'}</p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">Población:</span> {p.poblacion_beneficiaria}</div>
            <div><span className="text-slate-500">Lugar:</span> {p.lugar_intervencion}</div>
          </div>
          <div className="pt-3 flex gap-2 flex-wrap">
            {editableByStudent && <button className="px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold">Editar proyecto</button>}
            {editableByStudent && <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">Solicitar revisión</button>}
            {isDocente && codigo==='EN_EJECUCION' && <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold">Registrar monitoreo</button>}
            {isDirectivo && estadoInfo?.actor===user?.rol_actor && <button className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold">Revisar y dictaminar</button>}
          </div>
        </div>
      )}

      {tab==='entregables' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">Progreso del proyecto</h3>
              <span className="text-xs text-slate-500">5 / 5 completados</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-slate-800 rounded-full" style={{width: '100%'}}/></div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0f2b24] text-white text-xs">
                    <th className="px-3 py-3 text-left font-semibold border border-[#0f2b24]">ENTREGA</th>
                    <th className="px-3 py-3 text-center font-semibold border border-[#0f2b24]">EJEMPLARES - GUIAS</th>
                    <th className="px-3 py-3 text-center font-semibold border border-[#0f2b24]">FECHA LIMITE DE PRESENTACIÓN</th>
                    <th className="px-3 py-3 text-center font-semibold border border-[#0f2b24]">ARCHIVO</th>
                    <th className="px-3 py-3 text-center font-semibold border border-[#0f2b24]">HORAS</th>
                    <th className="px-3 py-3 text-center font-semibold border border-[#0f2b24]">ESTADO</th>
                    <th className="px-3 py-3 text-center font-semibold border border-[#0f2b24]">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {demoEntregables.map((e:any)=>(
                    <tr key={e.orden} className="border-b border-slate-200">
                      <td className="px-3 py-3 font-medium text-slate-700">{e.nombre}</td>
                      <td className="px-3 py-3 text-center"><span className="inline-flex w-6 h-6 bg-sky-600 text-white rounded items-center justify-center text-[10px]">W</span></td>
                      <td className="px-3 py-3 text-center text-xs">{e.fecha_limite ? new Date(e.fecha_limite).toLocaleDateString('es-PE') : <span className="text-slate-400">No aplica</span>}{e.fecha_limite && <span className="ml-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px]">Presentada</span>}</td>
                      <td className="px-3 py-3 text-center"><span className="inline-flex w-6 h-6 bg-red-600 text-white rounded items-center justify-center text-[10px]">PDF</span></td>
                      <td className="px-3 py-3 text-center"><span className="px-2 py-1 bg-slate-100 rounded-full text-xs">{e.horas_asignadas ? `${e.horas_asignadas} horas` : 'No Aplica'}</span></td>
                      <td className="px-3 py-3 text-center"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">{e.estado}</span></td>
                      <td className="px-3 py-3 text-center text-xs text-slate-400">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6">
              <h4 className="font-bold text-sm">PROCESO DE FINALIZACIÓN DEL PROYECTO</h4>
              <div className="flex justify-between text-xs text-slate-500 mt-1"><span>Progreso del proceso</span><span>3 de 3 completados · 100%</span></div>
              <div className="w-full h-2 bg-slate-100 rounded-full mt-1 overflow-hidden"><div className="h-full bg-emerald-700 rounded-full" style={{width:'100%'}}/></div>
            </div>
            {puedeSubirDocs && <button className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold">Subir entregable</button>}
            {!puedeSubirDocs && esEstudiante && <div className="mt-4 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">Solo el equipo de este proyecto puede subir entregables.</div>}
          </div>
        </div>
      )}

      {tab==='evidencias' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">Registro de Actividad y Fotografías</h3>
              <span className="px-3 py-1 bg-slate-800 text-white rounded-lg text-xs">Historial de Ejecución</span>
            </div>
            <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800">
              <div>Proyecto: <b>{p.titulo}</b></div>
              <div>Cualquier miembro del equipo puede iniciar la actividad</div>
            </div>
            <form onSubmit={handleCrearActividad} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Fecha de Actividad</label>
                <input type="date" value={formAct.fecha} onChange={e=> setFormAct({...formAct, fecha:e.target.value})} className="mt-1 w-full max-w-xs px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"/>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Nombre de la Actividad</label>
                <input placeholder="Ingresa el nombre de la actividad" value={formAct.nombre} onChange={e=> setFormAct({...formAct, nombre:e.target.value})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Horas</label>
                  <input type="number" min={0} max={23} value={formAct.horas} onChange={e=> setFormAct({...formAct, horas: Number(e.target.value)})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Minutos</label>
                  <input type="number" min={0} max={59} value={formAct.minutos} onChange={e=> setFormAct({...formAct, minutos: Number(e.target.value)})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Hora de finalización</label>
                <input type="time" value={formAct.horaFin} onChange={e=> setFormAct({...formAct, horaFin:e.target.value})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Descripción</label>
                <textarea placeholder="Describe la actividad..." value={formAct.descripcion} onChange={e=> setFormAct({...formAct, descripcion:e.target.value})} rows={3} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"/>
              </div>
              {puedeRegistrarActividad ? (
                <button disabled={submitting} type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">{submitting? 'Guardando...':'Registrar Actividad'}</button>
              ) : (
                <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">No puedes registrar actividades en el estado actual ({codigo}) o no eres miembro del equipo.</div>
              )}
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-sm">Capturar Evidencia</h3>
            <p className="text-xs text-slate-500 mt-1">Sube hasta 5 fotos JPG/PNG por actividad (máx 5MB c/u). Las evidencias quedan visibles para el docente y directores.</p>
            <div className="mt-3 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
              <div className="text-sm text-slate-500">Arrastra fotos o haz clic para seleccionar</div>
              <button className="mt-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold">Seleccionar fotos</button>
            </div>
            {actividades.length>0 && (
              <div className="mt-4 space-y-2">
                {actividades.map((a:any)=>(
                  <div key={a.id_actividad} className="border border-slate-200 rounded-xl p-3 flex justify-between text-sm"><div><b>{a.nombre}</b><div className="text-xs text-slate-500">{a.fecha_programada?.slice(0,10)} · {a.estado}</div></div><span className="px-2 py-1 bg-slate-100 rounded-full text-xs">{a.estado}</span></div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-sm">Asistencia de beneficiarios</h3>
            <p className="text-xs text-slate-500">Marca quién asistió y sube la ficha firmada.</p>
            <div className="mt-3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">Se muestran los beneficiarios vinculados al proyecto. Si no ves a alguien, vincúlalo en Beneficiarios.</div>
          </div>
        </div>
      )}

      {tab==='flujo' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold">Historial</h3>
          <div className="mt-4 space-y-3">
            {historial.map(h=>(
              <div key={h.id_flujo} className="flex gap-3 items-center border border-slate-200 rounded-xl p-3">
                <div className={`w-2 h-10 rounded-full ${h.resultado==='APROBADO'?'bg-emerald-500':'bg-amber-500'}`}/>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{h.estado_origen?.nombre} → {h.estado_destino?.nombre}</div>
                  <div className="text-xs text-slate-500">{h.rol_actor?.nombre} · {h.resultado} · {h.fecha_transicion?.slice(0,10)}</div>
                </div>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded-lg">{h.resultado}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {ESTADOS.map(e=>(
              <span key={e.codigo} className={`px-2 py-1 rounded-full text-xs font-semibold border ${e.codigo===codigo?'bg-slate-900 text-white': e.actor===user?.rol_actor?'bg-amber-100 border-amber-300':'bg-slate-100 border-slate-200'}`}>{e.orden}. {e.label}</span>
            ))}
          </div>
        </div>
      )}

      {tab==='beneficiarios' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold">Beneficiarios vinculados</h3>
          <p className="text-xs text-slate-500">Solo los de este proyecto. Estudiantes y docentes pueden vincular.</p>
          <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
            <div className="border border-slate-200 rounded-xl p-3"><b>María Quispe</b> · 44551234 · San Vicente <span className="ml-2 px-2 py-0.5 bg-sky-100 rounded-full text-xs">PERSONA</span></div>
            <div className="border border-slate-200 rounded-xl p-3"><b>I.E. José Olaya</b> · RUC 20123456789 · San Luis <span className="ml-2 px-2 py-0.5 bg-violet-100 rounded-full text-xs">INSTITUCION</span></div>
          </div>
          {(puedeSubirDocs || editableByStudent || isDocente) && <button className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">+ Vincular beneficiario</button>}
        </div>
      )}
    </div>
  )
}
