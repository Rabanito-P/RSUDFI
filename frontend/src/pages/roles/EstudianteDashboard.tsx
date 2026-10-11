import { useEffect, useState } from 'react'
import { FolderKanban, Clock, Users, AlertCircle, Calendar, Upload, FileEdit, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
import { Link } from 'react-router-dom'

export default function EstudianteDashboard(){
  const {user} = useAuth()
  const [proyectos,setProyectos]=useState<any[]>([])
  const [total,setTotal]=useState(0)
  const [horas,setHoras]=useState<number|null>(null)
  const [entregables,setEntregables]=useState<any[]>([])
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    if(!user) return
    setLoading(true)
    api.get(`/api/v1/estudiantes/${user.persona_id}/proyectos`)
      .then((r:any)=>{
        const lista = Array.isArray(r.data) ? r.data : []
        setTotal(lista.length)
        // Regla de negocio: el estudiante solo mantiene un proyecto activo.
        setProyectos(lista.slice(0,1))
        setErr('')
      })
      .catch(()=>{ setProyectos([]); setTotal(0); setErr('Error al cargar tus proyectos') })
      .finally(()=> setLoading(false))
  },[user?.persona_id])

  useEffect(()=>{
    const p = proyectos[0]
    if(!p) return
    api.get(`/api/v1/proyectos/${p.id_proyecto}/actividades`).then((r:any)=>{
      const acts = r.data||[]
      const total = acts.reduce((acc:number,a:any)=> acc + (a.minutos||0), 0)
      setHoras(Math.round(total/60*10)/10)
    }).catch(()=> setHoras(0))
    api.get(`/api/v1/proyectos/${p.id_proyecto}/entregables`).then((r:any)=> setEntregables(r.data||[])).catch(()=> setEntregables([]))
  },[proyectos])

  const p = proyectos[0]
  const completados = entregables.filter(e=> e.estado==='APROBADO').length
  const pct = entregables.length ? Math.round(completados/entregables.length*100) : 0
  const lider = p?.estudiante_lider ? `${p.estudiante_lider.nombres||''} ${p.estudiante_lider.apellidos||''}`.trim() : '—'
  const asesor = p?.docente_asesor ? `${p.docente_asesor.nombres||''} ${p.docente_asesor.apellidos||''}`.trim() : '—'

  // Próximo paso según el estado real del proyecto (viene de la BD).
  const estadoCodigo = p?.estado_actual?.codigo || ''
  const ENTREGABLES_ABIERTOS = new Set(['BORRADOR','EN_REVISION_ESCUELA','CON_VB_ESCUELA','EN_EJECUCION','REGISTRADO_OFICIAL'])
  const siguientePaso = !p
    ? { texto: 'Propón tu proyecto RSU', accion: 'Empieza con el formulario de propuesta.', to: '/proyectos/nuevo' }
    : ENTREGABLES_ABIERTOS.has(estadoCodigo)
      ? { texto: 'Sube tus entregables', accion: `Estado actual: ${p.estado_actual?.nombre}. Adjunta la evidencia en PDF.`, to: `/proyectos/${p.id_proyecto}?tab=entregables` }
      : { texto: 'Revisa el estado de tu proyecto', accion: `Actualmente en ${p.estado_actual?.nombre}.`, to: `/proyectos/${p.id_proyecto}` }

  return (
    <div className="space-y-6">
      {err && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700">{err}</div>}

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-slate-100 rounded-[24px] animate-pulse" />
          <div className="grid md:grid-cols-3 gap-4">
            <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      ) : (
        <>
      <div className="bg-gradient-to-r from-undc-700 to-undc-900 rounded-[24px] p-5 sm:p-6 text-white">
        <div className="text-sm opacity-80">Hola, {user?.nombre} · {user?.rol_actor}</div>
        <h1 className="text-xl sm:text-2xl font-black mt-1">Mi proyecto</h1>
        <p className="text-sm opacity-90 mt-1">Tienes <b>un único proyecto activo</b> a la vez. Si te retiran, quedas libre para otro.</p>
        <div className="mt-4 flex gap-2 flex-wrap">
          {total===0 && <Link to="/proyectos/nuevo" className="px-4 py-2 bg-white text-undc-700 rounded-xl text-sm font-bold">+ Proponer proyecto</Link>}
          {total>0 && <span className="px-3 py-2 bg-white/15 rounded-xl text-xs">Ya perteneces a un proyecto — no puedes crear otro hasta que te retiren</span>}
        </div>
      </div>

      {p && (
        <div className="bg-white border-l-4 border-undc-600 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="min-w-0">
            <div className="text-xs font-bold text-undc-700 uppercase tracking-wide">Tu siguiente paso</div>
            <div className="font-black text-lg">{siguientePaso.texto}</div>
            <div className="text-xs text-slate-500">{siguientePaso.accion}</div>
          </div>
          <Link to={siguientePaso.to} className="px-4 py-2 bg-undc-700 hover:bg-undc-900 text-white rounded-xl text-sm font-bold text-center shrink-0">{siguientePaso.texto}</Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3 items-center"><div className="w-10 h-10 rounded-xl bg-sky-600 grid place-items-center text-white"><FolderKanban size={18}/></div><div><div className="text-xs text-slate-500">Mis proyectos</div><div className="font-black text-lg">{total}</div><div className="text-xs text-slate-500">máx 1 activo</div></div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3 items-center"><div className="w-10 h-10 rounded-xl bg-amber-500 grid place-items-center text-white"><Clock size={18}/></div><div><div className="text-xs text-slate-500">Horas acumuladas</div><div className="font-black text-lg">{horas!=null? horas : '—'} h</div><div className="text-xs text-slate-500">Desde actividades ejecutadas</div></div></div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <h3 className="font-bold flex items-center gap-2"><Users size={16}/> Mi proyecto</h3>
          <p className="text-xs text-slate-500">Solo ves el proyecto donde estás activo. Si no tienes, propón uno. Si te retiran, vuelves a quedar libre.</p>
          <div className="mt-4 space-y-3">
            {proyectos.length===0 ? (
              <div className="text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">No perteneces a ningún proyecto activo.<br/><Link to="/proyectos/nuevo" className="text-sky-600 font-semibold">Proponer proyecto</Link></div>
            ) : proyectos.map(pr=>(
              <div key={pr.codigo_proyecto || pr.id_proyecto} className="border border-slate-200 rounded-2xl p-4 flex gap-3">
                <div className="w-2 rounded-full" style={{background: pr.estado_actual?.color_ui || '#9E9E9E'}}/>
                <div className="flex-1">
                  <div className="flex gap-2 items-center flex-wrap"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">{pr.codigo_proyecto}</span><span className="text-xs px-2 py-1 rounded-full text-white font-semibold" style={{background: pr.estado_actual?.color_ui}}>{pr.estado_actual?.nombre}</span><span className="text-xs bg-sky-50 border border-sky-200 px-2 py-1 rounded-full">{pr.rol_equipo || 'Miembro'}</span></div>
                  <div className="font-semibold text-slate-800 mt-1">{pr.titulo}</div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-2"><div className="h-full bg-sky-600 rounded-full" style={{width:`${pr.porcentaje_avance||0}%`}}/></div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Link to={`/proyectos/${pr.id_proyecto}`} className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold">Ver mi proyecto</Link>
                    <Link to={`/proyectos/${pr.id_proyecto}?tab=entregables`} className="px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1"><Upload size={12}/> Entregables</Link>
                    <Link to={`/proyectos/${pr.id_proyecto}?tab=evidencias`} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold">Evidencias</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <h3 className="font-bold flex items-center gap-2"><Calendar size={16}/> Mis evidencias</h3>
            <p className="text-xs text-slate-500">Registra tu actividad y fotos</p>
            {p ? <Link to={`/proyectos/${p.id_proyecto}?tab=evidencias`} className="mt-3 block text-center py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Ir a evidencias</Link> : <div className="mt-3 text-xs text-slate-500">Sin proyecto activo</div>}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <h3 className="font-bold flex items-center gap-2"><AlertCircle size={16}/> Entregables</h3>
            <p className="text-xs text-slate-500">Sube tu PDF según fecha límite</p>
            {p ? <Link to={`/proyectos/${p.id_proyecto}?tab=entregables`} className="mt-3 block text-center py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Ver entregables</Link> : <div className="mt-3 text-xs text-slate-500">Sin proyecto</div>}
          </div>
        </div>
      </div>

      {p && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs">
            <div className="font-bold text-amber-800">Proceso del proyecto</div>
            <div className="mt-1 text-amber-700"><b>Nota:</b> Si decides desistir de un proyecto aprobado y/o conforme, envía el formato adjunto a <a href="mailto:rsu.serviciosocial@undc.edu.pe" className="underline font-semibold">rsu.serviciosocial@undc.edu.pe</a></div>
            <div className="mt-3 grid sm:grid-cols-3 gap-2">
              <Link to="/modificar-informe" className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-amber-200 rounded-xl font-semibold text-amber-800 hover:bg-amber-50">Modificar informe</Link>
              <Link to="/justificacion" className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-amber-200 rounded-xl font-semibold text-amber-800 hover:bg-amber-50">Justificar falta</Link>
              <Link to="/solicitud-constancia" className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-amber-200 rounded-xl font-semibold text-amber-800 hover:bg-amber-50">Solicitar constancia</Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 sm:px-5 py-4 bg-undc-700 text-white flex flex-wrap gap-2 justify-between items-center">
              <h3 className="font-bold text-sm">Proceso del proyecto — {p.titulo}</h3>
              <Link to={`/proyectos/${p.id_proyecto}`} className="px-3 py-1.5 bg-white text-undc-700 rounded-lg text-xs font-bold flex items-center gap-1">Ver detalle <ArrowRight size={12}/></Link>
            </div>
            <div className="p-4 sm:p-5 grid md:grid-cols-2 gap-3 text-sm">
              {([
                ['Nombre del proyecto', p.titulo || '—'],
                ['Líder', lider],
                ['Semestre', p.semestre || '—'],
                ['Tipología', p.tipo?.nombre || '—'],
                ['Docente Asesor', asesor],
                ['Sector Beneficiados', p.lugar_intervencion || '—'],
                ['Número Beneficiados', p.total_beneficiarios != null ? String(p.total_beneficiarios) : '—'],
                ['Fecha Inicio', p.fecha_inicio_plan?.slice(0,10) || '—'],
                ['Fecha Fin', p.fecha_fin_plan?.slice(0,10) || '—'],
                ['Estado', p.estado_actual?.nombre || '—'],
              ] as [string,string][]).map(([k,v])=>(
                <div key={k} className="flex gap-2 border-b border-slate-100 py-2"><span className="text-slate-500 min-w-[140px]">{k}</span><span className="font-semibold text-slate-800">{v}</span></div>
              ))}
            </div>
            <div className="px-4 sm:px-5 pb-4 flex flex-wrap gap-2">
              <Link to={`/proyectos/${p.id_proyecto}?tab=evidencias`} className="px-4 py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Ejecutar proyecto</Link>
              <Link to="/modificar-informe" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold">Modificar Informe inicial</Link>
              <Link to="/estudiante/constancias" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold">Solicitar Constancia</Link>
            </div>
            <div className="mx-4 sm:mx-5 mb-4 sm:mb-5 rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 items-center justify-between">
                <span className="text-sm font-bold">Proceso de avances del proyecto</span>
                <span className="text-xs text-slate-500">{completados} / {entregables.length} entregables aprobados</span>
              </div>
              <div className="p-4">
                <div className="flex gap-2 text-xs">
                  <Link to={`/proyectos/${p.id_proyecto}?tab=evidencias`} className="px-2 py-1 bg-undc-700 text-white rounded">Historial de Registro de Evidencias</Link>
                  <Link to="/justificacion" className="px-2 py-1 bg-white border border-slate-200 rounded">Justificación de Faltas</Link>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs"><span className="font-semibold">Progreso del proyecto</span><span className="text-slate-500">{completados} / {entregables.length} completados · {pct}%</span></div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-1"><div className="h-full bg-undc-700 rounded-full" style={{width:`${pct}%`}}/></div>
                  <div className="overflow-x-auto -mx-1 px-1">
                    <table className="w-full text-xs border-collapse min-w-[520px]">
                      <thead><tr className="bg-[#0f2b24] text-white"><th className="px-2 py-2 text-left">ENTREGA</th><th className="px-2 py-2 text-center">F. LÍMITE</th><th className="px-2 py-2 text-center">ARCHIVO</th><th className="px-2 py-2 text-center">HORAS</th><th className="px-2 py-2 text-center">ESTADO</th></tr></thead>
                      <tbody>
                        {entregables.length ? entregables.map(e=>(
                          <tr key={e.id_entregable} className="border-b border-slate-100">
                            <td className="px-2 py-2 font-medium">{e.nombre}</td>
                            <td className="px-2 py-2 text-center">{e.fecha_limite?.slice(0,10) || 'No aplica'}</td>
                            <td className="px-2 py-2 text-center">{e.documento?.url_archivo ? <a href={api.fileUrl(e.documento.url_archivo)} target="_blank" rel="noreferrer" className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold">PDF</a> : '-'}</td>
                            <td className="px-2 py-2 text-center">{e.horas_asignadas ? `${e.horas_asignadas} horas` : 'No aplica'}</td>
                            <td className="px-2 py-2 text-center"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${e.estado==='APROBADO'?'bg-emerald-100 text-emerald-700': e.estado==='OBSERVADO'?'bg-amber-100 text-amber-700': e.estado==='ENVIADO'?'bg-sky-100 text-sky-700':'bg-slate-100 text-slate-600'}`}>{e.estado}</span></td>
                          </tr>
                        )) : (
                          <tr><td colSpan={5} className="px-2 py-6 text-center text-slate-400">Sin entregables registrados</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4">
                    <div className="mt-2 text-[11px] bg-sky-50 border border-sky-200 rounded-xl p-2 text-sky-800"><b>Nota:</b> Primero registrar la encuesta de satisfacción, luego registrar también la participación en el proyecto. Finalmente, esperar a que el estado del informe se vuelva <b>APROBADO</b> para seguir con los trámites.</div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <Link to="/encuestas" className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-center font-semibold">Encuesta de satisfacción</Link>
                      <Link to={`/proyectos/${p.id_proyecto}`} className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-center font-semibold">Participación en el proyecto</Link>
                      <Link to="/estudiante/horas" className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-center font-semibold">Mis horas</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <h3 className="font-bold text-sm flex items-center gap-2"><FileEdit size={14}/> Modificación de Informe Inicial</h3>
              <div className="text-xs text-slate-500 mt-1">Proyecto: {p.titulo}</div>
              <div className="mt-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl p-2 leading-tight">
                <b>Instrucciones:</b> Pendiente: puedes modificar/eliminar. Revisado: en validación. Aprobado: sin cambios. Rechazada: sin cambios. Observado: puedes editar.
              </div>
              <Link to="/modificar-informe" className="mt-3 inline-flex px-3 py-1.5 bg-undc-700 text-white rounded-xl text-xs font-semibold">Nueva modificación</Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <h3 className="font-bold text-sm flex items-center gap-2"><AlertCircle size={14}/> Justificación de faltas</h3>
              <div className="text-xs text-slate-500">Hasta dos (2) actividades programadas</div>
              <div className="mt-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl p-2 leading-tight">
                Pendiente: puedes modificar/eliminar. Revisado: en validación. Aprobada: sin cambios. Rechazada: sin cambios.
              </div>
              <Link to="/justificacion" className="mt-3 inline-flex px-3 py-1.5 bg-undc-700 text-white rounded-xl text-xs font-semibold">Justificar falta</Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <h3 className="font-bold text-sm flex items-center gap-2">Registro de Actividad y Fotografías</h3>
            <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-xl p-2 text-xs text-emerald-800">Cualquier miembro del equipo puede iniciar la actividad</div>
            <Link to={`/proyectos/${p.id_proyecto}?tab=evidencias`} className="mt-3 block text-center py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Registrar actividad</Link>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}