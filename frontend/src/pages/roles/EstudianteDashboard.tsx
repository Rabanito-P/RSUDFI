import { useEffect, useState } from 'react'
import { FolderKanban, Clock, Award, FileText, AlertCircle, Calendar, Users, Upload, Download, FileEdit, UserMinus, UserCog, Pause, Mail, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
import { Link } from 'react-router-dom'

export default function EstudianteDashboard(){
  const {user} = useAuth()
  const [proyectos,setProyectos]=useState<any[]>([])
  const [horas,setHoras]=useState<any>(null)

  useEffect(()=>{
    if(!user) return
    api.get(`/api/v1/estudiantes/${user.id}/proyectos`).then((r:any)=> setProyectos((r.data||[]).slice(0,1))).catch(()=> setProyectos([]))
    setHoras({acumuladas:18, creditos:1.0, proyectos:1})
  },[user])

  const soloUno = proyectos.length <= 1
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-undc-700 to-undc-900 rounded-[24px] p-6 text-white">
        <div className="text-sm opacity-80">Hola, {user?.nombre} · ID {user?.id}</div>
        <h1 className="text-2xl font-black mt-1">Mi proyecto</h1>
        <p className="text-sm opacity-90 mt-1">Tienes <b>un único proyecto activo</b> a la vez. Si te retiran, quedas libre para otro.</p>
        <div className="mt-4 flex gap-2 flex-wrap">
          {proyectos.length===0 && <Link to="/proyectos/nuevo" className="px-4 py-2 bg-white text-undc-700 rounded-xl text-sm font-bold">+ Proponer proyecto</Link>}
          {proyectos.length>0 && <span className="px-3 py-2 bg-white/15 rounded-xl text-xs">Ya perteneces a un proyecto — no puedes crear otro hasta que te retiren</span>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3 items-center"><div className="w-10 h-10 rounded-xl bg-sky-600 grid place-items-center text-white"><FolderKanban size={18}/></div><div><div className="text-xs text-slate-500">Mi proyecto</div><div className="font-black text-lg">{proyectos.length || 0}</div><div className="text-xs text-slate-500">{soloUno? 'máx 1 activo':'solo 1 permitido'}</div></div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3 items-center"><div className="w-10 h-10 rounded-xl bg-amber-500 grid place-items-center text-white"><Clock size={18}/></div><div><div className="text-xs text-slate-500">Horas acumuladas</div><div className="font-black text-lg">{horas?.acumuladas||0} h</div><div className="text-xs text-slate-500">Mis horas</div></div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3 items-center"><div className="w-10 h-10 rounded-xl bg-violet-600 grid place-items-center text-white"><Award size={18}/></div><div><div className="text-xs text-slate-500">Créditos</div><div className="font-black text-lg">{horas?.creditos||0}.0</div><div className="text-xs text-slate-500">Otorgados</div></div></div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold flex items-center gap-2"><Users size={16}/> Mi proyecto</h3>
          <p className="text-xs text-slate-500">Solo ves el proyecto donde estás activo. Si no tienes, propón uno. Si te retiran, vuelves a quedar libre.</p>
          <div className="mt-4 space-y-3">
            {proyectos.length===0 ? (
              <div className="text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">No perteneces a ningún proyecto activo.<br/><Link to="/proyectos/nuevo" className="text-sky-600 font-semibold">Proponer proyecto</Link></div>
            ) : proyectos.map(p=>(
              <div key={p.codigo_proyecto || p.id_proyecto} className="border border-slate-200 rounded-2xl p-4 flex gap-3">
                <div className="w-2 rounded-full" style={{background: p.estado_actual?.color_ui || '#9E9E9E'}}/>
                <div className="flex-1">
                  <div className="flex gap-2 items-center flex-wrap"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">{p.codigo_proyecto}</span><span className="text-xs px-2 py-1 rounded-full text-white font-semibold" style={{background: p.estado_actual?.color_ui}}>{p.estado_actual?.nombre}</span><span className="text-xs bg-sky-50 border border-sky-200 px-2 py-1 rounded-full">{p.rol_equipo || 'Miembro'}</span></div>
                  <div className="font-semibold text-slate-800 mt-1">{p.titulo}</div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-2"><div className="h-full bg-sky-600 rounded-full" style={{width:`${p.avance||40}%`}}/></div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Link to={`/proyectos/${p.id_proyecto}`} className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold">Ver mi proyecto</Link>
                    <Link to={`/proyectos/${p.id_proyecto}?tab=entregables`} className="px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1"><Upload size={12}/> Entregables</Link>
                    <Link to={`/proyectos/${p.id_proyecto}?tab=evidencias`} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold">Evidencias</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold flex items-center gap-2"><Calendar size={16}/> Mis evidencias</h3>
            <p className="text-xs text-slate-500">Registra tu actividad y fotos</p>
            {proyectos[0] ? <Link to={`/proyectos/${proyectos[0].id_proyecto}?tab=evidencias`} className="mt-3 block text-center py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Ir a evidencias</Link> : <div className="mt-3 text-xs text-slate-500">Sin proyecto activo</div>}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold flex items-center gap-2"><AlertCircle size={16}/> Entregables</h3>
            <p className="text-xs text-slate-500">Sube tu PDF según fecha límite</p>
            {proyectos[0] ? <Link to={`/proyectos/${proyectos[0].id_proyecto}?tab=entregables`} className="mt-3 block text-center py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Ver entregables</Link> : <div className="mt-3 text-xs text-slate-500">Sin proyecto</div>}
          </div>
        </div>
      </div>

      {proyectos.length>0 && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs">
            <div className="font-bold text-amber-800">Proceso del proyecto</div>
            <div className="mt-1 text-amber-700"><b>Nota:</b> Si decides desistir de un proyecto aprobado y/o conforme, envía el formato adjunto a <a href="mailto:rsu.serviciosocial@undc.edu.pe" className="underline font-semibold">rsu.serviciosocial@undc.edu.pe</a></div>
            <div className="mt-3 grid sm:grid-cols-3 gap-2">
              <a href="#" className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-200 rounded-xl font-semibold text-amber-800 hover:bg-amber-50"><UserMinus size={14}/> Retiro de participante</a>
              <a href="#" className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-200 rounded-xl font-semibold text-amber-800 hover:bg-amber-50"><UserCog size={14}/> Cambio de asesor</a>
              <a href="#" className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-200 rounded-xl font-semibold text-amber-800 hover:bg-amber-50"><Pause size={14}/> Carta de suspensión</a>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-undc-700 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Proceso del proyecto — {proyectos[0]?.titulo}</h3>
              <Link to={`/proyectos/${proyectos[0]?.id_proyecto}`} className="px-3 py-1.5 bg-white text-undc-700 rounded-lg text-xs font-bold flex items-center gap-1">Ver detalle <ArrowRight size={12}/></Link>
            </div>
            <div className="p-5 grid md:grid-cols-2 gap-3 text-sm">
              {[
                ['Nombre del proyecto', proyectos[0]?.titulo || 'Sistema inteligente de predicción de morosidad...'],
                ['Líder', 'KEVIN ANTHONY CAMA SANCHEZ'],
                ['Semestre', '2026-1'],
                ['Tipología', 'Proyección social'],
                ['Docente Asesor', 'EDWIN ROQUE TITO'],
                ['Sector Beneficiados', 'Municipalidad Distrital de Nuevo Imperial'],
                ['Número Beneficiados', '4'],
                ['Fecha Inicio', '13/05/2026'],
                ['Fecha Fin', '31/08/2026'],
                ['Estado', proyectos[0]?.estado_actual?.nombre || 'Conforme'],
              ].map(([k,v]:any)=>(
                <div key={k} className="flex gap-2 border-b border-slate-100 py-2"><span className="text-slate-500 min-w-[140px]">{k}</span><span className="font-semibold text-slate-800">{v}</span></div>
              ))}
            </div>
            <div className="px-5 pb-4 flex flex-wrap gap-2">
              <Link to={`/proyectos/${proyectos[0]?.id_proyecto}?tab=evidencias`} className="px-4 py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Ejecutar proyecto</Link>
              <Link to={`/proyectos/${proyectos[0]?.id_proyecto}`} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold">Modificar Informe inicial</Link>
              <Link to={`/estudiante/constancias`} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold">Solicitar Constancia</Link>
            </div>
            <div className="mx-5 mb-5 rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 items-center justify-between">
                <span className="text-sm font-bold">Proceso de avances del proyecto</span>
                <span className="text-xs text-slate-500">Descargar formato haciendo click al icono</span>
              </div>
              <div className="p-4">
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-undc-700 text-white rounded">Historial de Registro de Evidencias</span>
                  <span className="px-2 py-1 bg-white border border-slate-200 rounded">Justificación de Faltas</span>
                </div>
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-center"><b>Proyecto Finalizado</b><br/>Este proyecto ha sido cerrado completamente. No se pueden realizar más entregas.</div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs"><span className="font-semibold">Progreso del proyecto</span><span className="text-slate-500">5 / 5 completados</span></div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-1"><div className="h-full bg-undc-700 rounded-full" style={{width:'100%'}}/></div>
                  <table className="w-full text-xs mt-3 border-collapse">
                    <thead><tr className="bg-[#0f2b24] text-white"><th className="px-2 py-2 text-left">ENTREGA</th><th className="px-2 py-2">EJEMPLARES - GUIAS</th><th className="px-2 py-2">FECHA LIMITE</th><th className="px-2 py-2">ARCHIVO</th><th className="px-2 py-2">HORAS</th><th className="px-2 py-2">ESTADO</th></tr></thead>
                    <tbody>
                      {[
                        ['PRIMER ENTREGABLE','05/07/2026','22 horas','APROBADO'],
                        ['SEGUNDO ENTREGABLE','02/08/2026','16 horas','APROBADO'],
                        ['TERCER ENTREGABLE','06/09/2026','22 horas','APROBADO'],
                        ['ENCUESTA','No aplica','No Aplica','APROBADO'],
                        ['INFORME FINAL','No aplica','No Aplica','APROBADO'],
                      ].map(r=>(
                        <tr key={r[0]} className="border-b border-slate-100"><td className="px-2 py-2 font-medium">{r[0]}</td><td className="px-2 py-2 text-center"><span className="w-5 h-5 bg-sky-600 text-white rounded inline-grid place-items-center text-[10px]">W</span></td><td className="px-2 py-2 text-center">{r[1]}</td><td className="px-2 py-2 text-center"><span className="w-5 h-5 bg-red-600 text-white rounded inline-grid place-items-center text-[10px]">PDF</span></td><td className="px-2 py-2 text-center">{r[2]}</td><td className="px-2 py-2 text-center"><span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">{r[3]}</span></td></tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs"><span className="font-bold">Proceso de finalización del proyecto</span><span className="text-slate-500">3 de 3 completados · 100%</span></div>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-1"><div className="h-full bg-undc-700 rounded-full" style={{width:'100%'}}/></div>
                    <div className="mt-2 text-[11px] bg-sky-50 border border-sky-200 rounded-xl p-2 text-sky-800"><b>Nota:</b> Primero registrar la encuesta de satisfacción, luego registrar también la participación en el proyecto. Finalmente, esperar a que el estado del informe se vuelva <b>APROBADO</b> para seguir con los trámites. Si consideras ampliar la fecha de finalización, puedes editarlo.*</div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <Link to={`/proyectos/${proyectos[0]?.id_proyecto}?tab=evidencias`} className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-center font-semibold">Encuesta de satisfacción</Link>
                      <Link to={`/proyectos/${proyectos[0]?.id_proyecto}?tab=evidencias`} className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-center font-semibold">Participación en el proyecto</Link>
                      <div className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">Fecha de finalización</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-sm flex items-center gap-2"><FileEdit size={14}/> Modificación de Informe Inicial</h3>
              <div className="text-xs text-slate-500 mt-1">Proyecto: {proyectos[0]?.titulo}</div>
              <div className="mt-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl p-2 leading-tight">
                <b>Instrucciones:</b> Pendiente: puedes modificar/eliminar. Revisado: en validación. Aprobado: sin cambios. Rechazada: sin cambios. Observado: puedes editar.
              </div>
              <table className="w-full text-[11px] mt-3 border-collapse">
                <thead><tr className="bg-slate-800 text-white"><th className="px-2 py-1.5 text-left">Motivos</th><th className="px-2 py-1.5">Archivo</th><th className="px-2 py-1.5">Fecha</th><th className="px-2 py-1.5">Estado</th></tr></thead>
                <tbody>
                  <tr className="border-b border-slate-100"><td className="px-2 py-2">Modificación de fechas del cronograma</td><td className="px-2 py-2 text-center">PDF</td><td className="px-2 py-2">30/07/2026</td><td className="px-2 py-2"><span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Aprobado</span></td></tr>
                  <tr className="border-b border-slate-100"><td className="px-2 py-2">Actualizar población beneficiada a 4 funcionarios Área de Rentas sin afectar objetivos</td><td className="px-2 py-2 text-center">PDF</td><td className="px-2 py-2">10/06/2026</td><td className="px-2 py-2"><span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Aprobado</span></td></tr>
                  <tr className="border-b border-slate-100"><td className="px-2 py-2">Actualizar grupo a 1 área: Área de Rentas por disposición municipal</td><td className="px-2 py-2 text-center">PDF</td><td className="px-2 py-2">08/06/2026</td><td className="px-2 py-2"><span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">Observado</span></td></tr>
                </tbody>
              </table>
              <Link to={`/proyectos/${proyectos[0]?.id_proyecto}?tab=evidencias`} className="mt-3 inline-flex px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold">Ver modificaciones</Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-sm flex items-center gap-2"><AlertCircle size={14}/> Justificación de faltas</h3>
              <div className="text-xs text-slate-500">Hasta dos (2) actividades programadas</div>
              <div className="mt-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl p-2 leading-tight">
                Pendiente: puedes modificar/eliminar. Revisado: en validación. Aprobada: sin cambios. Rechazada: sin cambios.
              </div>
              <table className="w-full text-[11px] mt-3 border-collapse">
                <thead><tr className="bg-slate-800 text-white"><th className="px-2 py-1.5">Actividad</th><th className="px-2 py-1.5">Fecha</th><th className="px-2 py-1.5">Estado</th></tr></thead>
                <tbody>
                  <tr className="border-b border-slate-100"><td className="px-2 py-2">Capacitación intermedia: Validación de prototipos interactivos</td><td className="px-2 py-2">22/07/2026</td><td className="px-2 py-2"><span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Aprobada</span></td></tr>
                </tbody>
              </table>
              <Link to={`/proyectos/${proyectos[0]?.id_proyecto}?tab=evidencias`} className="mt-3 inline-flex px-3 py-1.5 bg-undc-700 text-white rounded-xl text-xs font-semibold">Justificar falta</Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-sm flex items-center gap-2">Registro de Actividad y Fotografías</h3>
            <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-xl p-2 text-xs text-emerald-800">Cualquier miembro del equipo puede iniciar la actividad</div>
            <Link to={`/proyectos/${proyectos[0]?.id_proyecto}?tab=evidencias`} className="mt-3 block text-center py-2 bg-undc-700 text-white rounded-xl text-sm font-semibold">Registrar actividad</Link>
            <div className="mt-3 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
              <div className="text-xs text-slate-500">Registra una actividad para comenzar a tomar fotos</div>
              <div className="mt-2 flex justify-center gap-2">
                <span className="px-2 py-1 bg-undc-700 text-white rounded text-xs">Capturar</span>
                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs">Girar Cámara</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
