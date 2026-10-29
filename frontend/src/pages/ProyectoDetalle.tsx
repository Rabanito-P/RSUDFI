import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { api, asArray } from '../api/client'
import { validarArchivo, validarLote } from '../lib/archivos'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input, Label, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Empty } from '../components/ui/Empty'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { canStudentEdit, canStudentUploadDocs, canStudentRegisterActivity } from '../lib/permisos'
import { mensajeError } from '../lib/errores'
import { useCatalogoBpmn } from '../hooks/useCatalogoBpmn'
import { Download, FileText, Camera, Link2, Pencil, ClipboardCheck, Gavel, Upload, UserPlus, Check, X, Inbox, Users, Crown } from 'lucide-react'

const RESULTADOS = ['APROBADO','OBSERVADO','RECHAZADO','DEVUELTO']
const ORDENES = [1,2,3,4,5]
const normEstadoEnt = (e:string)=>{
  if(e==='PENDIENTE') return 'POR_ENVIAR'
  if(e==='REGISTRADO'||e==='SUBIDO') return 'ENVIADO'
  if(e==='CORRECTO') return 'APROBADO'
  return e
}

type Msg = {type:'ok'|'err', text:string} | null

export default function ProyectoDetalle(){
  const {id}=useParams()
  const {user} = useAuth()
const { flujo, estados: estadosBpmn, tieneLane, loading: catLoading } = useCatalogoBpmn(user?.rol_actor_id)
  const [params,setParams]=useSearchParams()
  const [p,setP]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [loadError,setLoadError]=useState('')
  const [historial,setHistorial]=useState<any[]>([])
  const [historialError,setHistorialError]=useState('')
  const [entregables,setEntregables]=useState<any[]>([])
  const [entregablesError,setEntregablesError]=useState('')
  const [actividades,setActividades]=useState<any[]>([])
  const [actividadesError,setActividadesError]=useState('')
  const [beneficiarios,setBeneficiarios]=useState<any[]>([])
  const [beneficiariosError,setBeneficiariosError]=useState('')
  const [esMiembro,setEsMiembro]=useState(false)
  const [membresiaCargada,setMembresiaCargada]=useState(false)
  const [miembrosIds,setMiembrosIds]=useState<number[]>([])
  // Equipo completo + solicitudes de unión a PEP (HU-064..HU-068).
  const [miembros,setMiembros]=useState<any[]>([])
  const [solicitudes,setSolicitudes]=useState<any[]>([])
  const [solicitudesError,setSolicitudesError]=useState('')
  const [misSolicitudes,setMisSolicitudes]=useState<any[]>([])
  const [solMsg,setSolMsg]=useState<Msg>(null)
  const [solBusy,setSolBusy]=useState(false)
  const [mensajeUnion,setMensajeUnion]=useState('')
  // Rechazo con motivo rápido (HU-068): razones rápidas arriba del panel.
  const [rechazoId,setRechazoId]=useState<number|null>(null)
  const [motivoRapido,setMotivoRapido]=useState('')
  const [motivoTexto,setMotivoTexto]=useState('')
  const MOTIVOS_RAPIDOS = ['CUPO_LLENO','CICLO_INSUFICIENTE','PERFIL_NO_AFIN','FUERA_DE_PLAZO','OTRO']
  const [formAct,setFormAct]=useState({fecha: new Date().toISOString().slice(0,10), nombre:'', horas:0, minutos:0, horaInicio:'09:00', horaFin:'', descripcion:''})
  const [submitting,setSubmitting]=useState(false)
  const [actMsg,setActMsg]=useState<Msg>(null)

  // ── Fase 2 · Aprobación: oficio de elevación y activación (opción C) ──
  const [fase2Busy,setFase2Busy]=useState(false)
  const [fase2Msg,setFase2Msg]=useState<Msg>(null)
  const [fase2DocId,setFase2DocId]=useState('')

  // ── HU-060: transferencia de liderazgo ──
  const [liderOpen,setLiderOpen]=useState(false)
  const [liderNuevo,setLiderNuevo]=useState('')
  const [liderMotivo,setLiderMotivo]=useState('')
  const [liderBusy,setLiderBusy]=useState(false)
  const [liderMsg,setLiderMsg]=useState<Msg>(null)

  // ── HU-070: expulsión por causales — solo Dirección RS de Facultad ──
  const [expOpen,setExpOpen]=useState(false)
  const [expSel,setExpSel]=useState('')
  const [expCausal,setExpCausal]=useState('')
  const [expMotivo,setExpMotivo]=useState('')
  const [expBusy,setExpBusy]=useState(false)
  const [expMsg,setExpMsg]=useState<Msg>(null)

  const [modal,setModal]=useState<''|'edit'|'monitoreo'|'transicion'|'entregable'|'vincular'|'fotos'>('')
  const [modalMsg,setModalMsg]=useState<Msg>(null)
  const [modalBusy,setModalBusy]=useState(false)

  const [editForm,setEditForm]=useState({titulo:'', objetivo_general:'', descripcion:'', lugar_intervencion:'', presupuesto_aprobado:''})
  const [monForm,setMonForm]=useState({fecha_monitoreo:'', porcentaje_avance:'', resultado:'', observaciones:''})
  const [transLoading,setTransLoading]=useState(false)
  const [transOptions,setTransOptions]=useState<any[]>([])
  const [estadosCat,setEstadosCat]=useState<any[]>([])
  const [transForm,setTransForm]=useState({estado_destino:'', id_rol_actor:'', resultado:'APROBADO', comentarios:''})
  const [entForm,setEntForm]=useState({orden:'1', horas:'', id_tipo_doc:'', archivo:null as File|null})
  const [tiposDoc,setTiposDoc]=useState<any[]>([])
  const [benList,setBenList]=useState<any[]>([])
  const [benSearch,setBenSearch]=useState('')
  const [benSel,setBenSel]=useState('')
  const [fotosForm,setFotosForm]=useState({id_actividad:'', archivos:[] as File[]})

  const tabParam = params.get('tab') || 'general'
  const setTab=(k:string)=>{ const n=new URLSearchParams(params); n.set('tab',k); setParams(n,{replace:true}) }

  const load = useCallback(async ()=>{
    if(!id) return
    setLoading(true); setLoadError('')
    let proj:any = null
    try{
      const r:any = await api.get(`/api/v1/proyectos/${id}`)
      proj = r.data
      setP(proj)
    }catch(ex:any){
      setP(null); setLoadError(ex?.message || 'No se pudo cargar el proyecto'); setLoading(false); return
    }
    const jobs: Promise<void>[] = [
      (async()=>{
        try{ const h:any = await api.get(`/api/v1/proyectos/${id}/historial`); setHistorial(asArray(h.data)); setHistorialError('') }
        catch(ex:any){ setHistorial([]); setHistorialError(ex?.message || 'No se pudo cargar el historial') }
      })(),
      (async()=>{
        try{ const e:any = await api.get(`/api/v1/proyectos/${id}/entregables`); setEntregables(asArray(e.data)); setEntregablesError('') }
        catch(ex:any){ setEntregables([]); setEntregablesError(ex?.message || 'No se pudieron cargar los entregables') }
      })(),
      (async()=>{
        try{ const a:any = await api.get(`/api/v1/proyectos/${id}/actividades`); setActividades(asArray(a.data)); setActividadesError('') }
        catch(ex:any){ setActividades([]); setActividadesError(ex?.message || 'No se pudieron cargar las actividades') }
      })(),
      (async()=>{
        try{ const b:any = await api.get(`/api/v1/proyectos/${id}/beneficiarios`); setBeneficiarios(asArray(b.data)); setBeneficiariosError('') }
        catch(ex:any){ setBeneficiarios([]); setBeneficiariosError(ex?.message || 'No se pudieron cargar los beneficiarios') }
      })()
    ]
    if(user?.rol==='ESTUDIANTE'){
      jobs.push((async()=>{
        try{
          const m:any = await api.get(`/api/v1/proyectos/${id}/estudiantes`)
          const ms = asArray<any>(m.data)
          setMiembros(ms)
          setMiembrosIds(ms.map((x:any)=> x.id_estudiante).filter(Boolean))
        }catch{ setMiembros([]); setMiembrosIds([]) }
        try{
          const e:any = await api.get(`/api/v1/proyectos/${id}/es-miembro/${user.persona_id}`)
          setEsMiembro(!!e.data?.es_miembro)
        }catch{ setEsMiembro(false) }
        try{
          const s:any = await api.get(`/api/v1/estudiantes/${user.persona_id}/solicitudes-union`)
          setMisSolicitudes(asArray(s.data))
        }catch{ setMisSolicitudes([]) }
        setMembresiaCargada(true)
      })())
    }else{
      // Docente/directivo también ve el equipo y las solicitudes del proyecto.
      jobs.push((async()=>{
        try{
          const m:any = await api.get(`/api/v1/proyectos/${id}/estudiantes`)
          setMiembros(asArray(m.data))
        }catch{ setMiembros([]) }
      })())
    }
    // Bandeja de solicitudes del proyecto (la filtra por rol la propia vista).
    jobs.push((async()=>{
      try{
        const s:any = await api.get(`/api/v1/proyectos/${id}/solicitudes-union`)
        setSolicitudes(asArray(s.data)); setSolicitudesError('')
      }catch(ex:any){ setSolicitudes([]); setSolicitudesError(mensajeError(ex, 'No se pudieron cargar las solicitudes')) }
    })())
    await Promise.all(jobs)
    setLoading(false)
  },[id, user?.persona_id, user?.rol])

  useEffect(()=>{ load() },[load])

  if(loading){
    return <div className="space-y-4"><Skeleton className="h-40 w-full"/><Skeleton className="h-64 w-full"/></div>
  }
  if(loadError || !p){
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Alert variant="error">
          <div className="font-semibold">No se pudo cargar el expediente</div>
          <div className="text-sm mt-1">{loadError || 'Error desconocido'}</div>
          <Button size="sm" className="mt-3" onClick={load}>Reintentar</Button>
        </Alert>
        <div className="mt-4 text-center"><Link to="/proyectos" className="text-sm text-undc-700 font-semibold">Volver a proyectos</Link></div>
      </div>
    )
  }

  const codigo = p.estado_actual?.codigo || 'BORRADOR'
  const esMiembroEquipo = esMiembro || p.id_estudiante_lider===user?.persona_id || user?.rol==='ADMIN' || user?.rol==='DOCENTE' || user?.rol==='DIRECTIVO'
  const esEstudiante = user?.rol==='ESTUDIANTE'
  const bloqueadoEstudianteNoMiembro = esEstudiante && membresiaCargada && !esMiembro && p.id_estudiante_lider!==user?.persona_id
  // HU-064: los PEP abiertos se pueden ver sin ser miembro (vista previa + unirse).
  const ESTADOS_FINALES = ['CERRADO','REPORTADO_SUNEDU','EVALUACION_VALIDADA']
  const esPEP = String(p.modalidad || '').startsWith('PEP')
  const pepAbierto = esPEP && !ESTADOS_FINALES.includes(codigo)
  const bloqueado = bloqueadoEstudianteNoMiembro && !pepAbierto
  // HU-066/068: resuelve el responsable del PEP (docente asesor) o ADMIN.
  const soyResponsable = (user?.rol==='DOCENTE' && p.id_docente_asesor===user?.persona_id) || user?.rol==='ADMIN'
  const idsMiembros = new Set(miembros.map((m:any)=> m.id_estudiante))
  const ocupados = miembros.length + ((p.id_estudiante_lider && !idsMiembros.has(p.id_estudiante_lider)) ? 1 : 0)
  const miSolicitudPendiente = misSolicitudes.find((s:any)=> Number(s.solicitud?.id_proyecto)===Number(id) && s.solicitud?.estado==='PENDIENTE')
  const solicitudesPendientes = solicitudes.filter((s:any)=> s.solicitud?.estado==='PENDIENTE')

  const editableByStudent = canStudentEdit(codigo) && esEstudiante && esMiembroEquipo
  const puedeSubirDocs = (esEstudiante ? canStudentUploadDocs(codigo, esMiembroEquipo) : true)
  const puedeRegistrarActividad = esMiembroEquipo && canStudentRegisterActivity(codigo, esMiembroEquipo)
  const isDocente = user?.rol==='DOCENTE'
  const isDirectivo = user?.rol==='DIRECTIVO' || user?.rol==='ADMIN'
  // HU-060: puede transferir el liderazgo el líder actual o la gestión RSU.
  const esLiderActual = esEstudiante && p.id_estudiante_lider===user?.persona_id
  const puedeTransferirLider = !ESTADOS_FINALES.includes(codigo) &&
    (esLiderActual || ['DIR_RS_FACULTAD','ADMIN','DIRECTIVO','DIR_ESCUELA'].includes(user?.rol||''))
  // Candidatos: miembros del equipo (nunca el líder actual).
  const candidatosLider = miembros.filter((m:any)=> m.id_estudiante !== p.id_estudiante_lider)
  // HU-070: la expulsión la autoriza la Dirección RS de Facultad (ADMIN por soporte).
  const puedeExpulsar = ['DIR_RS_FACULTAD','ADMIN'].includes(user?.rol||'') && !ESTADOS_FINALES.includes(codigo)
  // Expulsables: participantes activos/inscritos; el líder no se expulsa — se
  // transfiere el liderazgo primero (HU-060).
  const expulsables = miembros.filter((m:any)=>
    m.id_estudiante !== p.id_estudiante_lider &&
    ['INSCRITO','ACTIVO'].includes((m.estado_participacion||'').toUpperCase()))
  const estadoInfo = estadosBpmn.find((e: any) => e.codigo === codigo)

  const totalEnt = entregables.length
  const entregados = entregables.filter(e=> ['ENVIADO','APROBADO'].includes(normEstadoEnt(e.estado||''))).length
  const pctEnt = totalEnt>0 ? Math.round((entregados/totalEnt)*100) : 0

  const reloadEntregables = async ()=>{
    try{ const e:any = await api.get(`/api/v1/proyectos/${id}/entregables`); setEntregables(asArray(e.data)); setEntregablesError('') }
    catch(ex:any){ setEntregablesError(ex?.message||'No se pudieron cargar los entregables') }
  }
  const reloadHistorial = async ()=>{
    try{ const h:any = await api.get(`/api/v1/proyectos/${id}/historial`); setHistorial(asArray(h.data)); setHistorialError('') }
    catch(ex:any){ setHistorialError(ex?.message||'No se pudo cargar el historial') }
  }

  // HU-060: transferir el liderazgo — notifica por panel y correo a ambos.
  const transferirLider = async ()=>{
    if(!liderNuevo){ setLiderMsg({type:'err', text:'Elige al nuevo líder del equipo.'}); return }
    if(liderMotivo.trim().length < 10){ setLiderMsg({type:'err', text:'Escribe el motivo del cambio (mínimo 10 caracteres).'}); return }
    setLiderBusy(true); setLiderMsg(null)
    try{
      await api.post(`/api/v1/proyectos/${id}/lider`, { id_nuevo_lider: Number(liderNuevo), motivo: liderMotivo.trim() })
      setLiderMsg({type:'ok', text:'Liderazgo transferido. Se avisó por correo al líder saliente y al nuevo líder. Actualizando...'})
      setTimeout(()=>{ load() }, 900)
    }catch(ex:any){
      setLiderMsg({type:'err', text: mensajeError(ex, 'No se pudo transferir el liderazgo')})
    }finally{ setLiderBusy(false) }
  }

  // HU-070: expulsar a un integrante con causal y motivo. El backend valida el
  // rol del token, el cupo del equipo y notifica a docente, expulsado y líder.
  const expulsarMiembro = async ()=>{
    if(!expSel){ setExpMsg({type:'err', text:'Elige al integrante que será expulsado.'}); return }
    if(!['FALTAS','TARDANZAS','CONDUCTA','OTRO'].includes(expCausal)){ setExpMsg({type:'err', text:'Selecciona la causal de la expulsión.'}); return }
    if(expMotivo.trim().length < 10){ setExpMsg({type:'err', text:'Describe el hecho observado (mínimo 10 caracteres).'}); return }
    setExpBusy(true); setExpMsg(null)
    try{
      await api.post(`/api/v1/proyectos/${id}/expulsar`, { id_estudiante: Number(expSel), causal: expCausal, motivo: expMotivo.trim() })
      setExpMsg({type:'ok', text:'Expulsión registrada. Se notificó al estudiante, al docente y al líder. Actualizando...'})
      setTimeout(()=>{ load() }, 900)
    }catch(ex:any){
      setExpMsg({type:'err', text: mensajeError(ex, 'No se pudo registrar la expulsión')})
    }finally{ setExpBusy(false) }
  }
  const reloadBeneficiarios = async ()=>{
    try{ const b:any = await api.get(`/api/v1/beneficiarios`); setBeneficiarios(asArray(b.data)); setBeneficiariosError('') }
    catch(ex:any){ setBeneficiariosError(ex?.message||'No se pudieron cargar los beneficiarios') }
  }

  // ── Fase 2 · Aprobación (HU-F2-04..06) ──
  // El oficio lo genera el Decano (o ADMIN) en EN_DICTAMEN_CONSEJO: construye
  // el PDF con membrete y datos del expediente, lo registra y queda listo para
  // imprimir, firmar y subir el escaneado. La activación la resuelve la
  // Dirección RS de Facultad (opción C): 7→8 y 8→9 con el sustento DRSU.
  const generarOficio = async ()=>{
    setFase2Busy(true); setFase2Msg(null)
    try{
      await api.post(`/api/v1/proyectos/${id}/oficio-elevacion`, {})
      setFase2Msg({type:'ok', text:'Oficio de Elevación generado. Imprímelo, fírmalo al pie y sube el escaneado como sustento del expediente.'})
      await load()
    }catch(ex:any){ setFase2Msg({type:'err', text: mensajeError(ex, 'No se pudo generar el oficio')}) }
    finally{ setFase2Busy(false) }
  }
  const descargarOficio = async ()=>{
    setFase2Busy(true); setFase2Msg(null)
    try{ await api.download(`/api/v1/proyectos/${id}/oficio-elevacion/descargar`, `oficio-elevacion-${p.codigo_proyecto}.pdf`) }
    catch(ex:any){ setFase2Msg({type:'err', text: mensajeError(ex, 'No se pudo descargar el oficio')}) }
    finally{ setFase2Busy(false) }
  }
  const activarProyecto = async ()=>{
    const idDoc = Number(fase2DocId)
    if(!Number.isInteger(idDoc) || idDoc<=0){
      setFase2Msg({type:'err', text:'Registra primero el documento de sustento y anota su ID (pestaña Entregables/Documentos).'})
      return
    }
    setFase2Busy(true); setFase2Msg(null)
    try{
      await api.post(`/api/v1/proyectos/${id}/activar`, { id_documento_sustento: idDoc })
      setFase2Msg({type:'ok', text:'Proyecto activado: quedó en ejecución y se notificó al líder y al asesor.'})
      await load()
    }catch(ex:any){ setFase2Msg({type:'err', text: mensajeError(ex, 'No se pudo activar el proyecto')}) }
    finally{ setFase2Busy(false) }
  }
  const reloadSolicitudes = async ()=>{
    try{
      const s:any = await api.get(`/api/v1/proyectos/${id}/solicitudes-union`)
      setSolicitudes(asArray(s.data)); setSolicitudesError('')
    }catch(ex:any){ setSolicitudesError(ex?.message||'No se pudieron cargar las solicitudes') }
    if(esEstudiante){
      try{
        const m:any = await api.get(`/api/v1/estudiantes/${user?.persona_id}/solicitudes-union`)
        setMisSolicitudes(asArray(m.data))
      }catch{ /* noop */ }
      try{
        const e:any = await api.get(`/api/v1/proyectos/${id}/es-miembro/${user?.persona_id}`)
        setEsMiembro(!!e.data?.es_miembro)
      }catch{ /* noop */ }
      try{
        const ms:any = await api.get(`/api/v1/proyectos/${id}/estudiantes`)
        const lista = asArray(ms.data)
        setMiembros(lista)
        setMiembrosIds(lista.map((x:any)=> x.id_estudiante).filter(Boolean))
      }catch{ /* noop */ }
    }
  }

  // ── Solicitudes de unión a PEP (HU-065..HU-068) ──
  const solicitarUnirse = async ()=>{
    // Verificadores en form: mensaje corto, PEP abierto, sin solicitud pendiente.
    if(mensajeUnion.trim().length > 500){ setSolMsg({type:'err', text:'El mensaje no puede pasar de 500 caracteres.'}); return }
    if(!pepAbierto){ setSolMsg({type:'err', text:'Este proyecto no recibe solicitudes (no es PEP abierto).'}); return }
    if(miSolicitudPendiente){ setSolMsg({type:'err', text:'Ya tienes una solicitud pendiente en este proyecto.'}); return }
    if(ocupados >= 5){ setSolMsg({type:'err', text:'El equipo ya está completo (5/5).'}); return }
    setSolBusy(true); setSolMsg(null)
    try{
      await api.post(`/api/v1/proyectos/${id}/solicitudes-union`, { id_estudiante: user?.persona_id, mensaje: mensajeUnion.trim() })
      setMensajeUnion('')
      setSolMsg({type:'ok', text:'Solicitud enviada al responsable del PEP. Te avisaremos por notificaciones.'})
      await reloadSolicitudes()
    }catch(ex:any){ setSolMsg({type:'err', text: mensajeError(ex, 'No se pudo enviar la solicitud')}) } finally{ setSolBusy(false) }
  }
  const aceptarSolicitud = async (idSol:number)=>{
    setSolBusy(true); setSolMsg(null)
    try{
      await api.patch(`/api/v1/solicitudes-union/${idSol}/aceptar`, { id_revisor: user?.persona_id })
      setSolMsg({type:'ok', text:'Solicitud aceptada: el estudiante ya es miembro del equipo.'})
      await reloadSolicitudes()
    }catch(ex:any){ setSolMsg({type:'err', text: mensajeError(ex, 'No se pudo aceptar')}) } finally{ setSolBusy(false) }
  }
  const rechazarSolicitud = async ()=>{
    // Verificadores en form: motivo rápido obligatorio; OTRO exige texto.
    if(!motivoRapido){ setSolMsg({type:'err', text:'Elige un motivo rápido de rechazo.'}); return }
    if(motivoRapido==='OTRO' && motivoTexto.trim().length < 5){ setSolMsg({type:'err', text:'Con motivo OTRO escribe la razón (mínimo 5 caracteres).'}); return }
    if(motivoTexto.trim().length > 500){ setSolMsg({type:'err', text:'El motivo no puede pasar de 500 caracteres.'}); return }
    if(rechazoId==null) return
    setSolBusy(true); setSolMsg(null)
    try{
      await api.patch(`/api/v1/solicitudes-union/${rechazoId}/rechazar`, { id_revisor: user?.persona_id, motivo_rapido: motivoRapido, motivo_rechazo: motivoTexto.trim() })
      setRechazoId(null); setMotivoRapido(''); setMotivoTexto('')
      setSolMsg({type:'ok', text:'Solicitud rechazada: se notificó al estudiante con el motivo.'})
      await reloadSolicitudes()
    }catch(ex:any){ setSolMsg({type:'err', text: mensajeError(ex, 'No se pudo rechazar')}) } finally{ setSolBusy(false) }
  }
  const cancelarSolicitud = async (idSol:number)=>{
    setSolBusy(true); setSolMsg(null)
    try{
      await api.del(`/api/v1/solicitudes-union/${idSol}?id_estudiante=${user?.persona_id}`)
      setSolMsg({type:'ok', text:'Solicitud cancelada.'})
      await reloadSolicitudes()
    }catch(ex:any){ setSolMsg({type:'err', text: mensajeError(ex, 'No se pudo cancelar')}) } finally{ setSolBusy(false) }
  }

  const openModal = async (m:typeof modal)=>{
    setModal(m); setModalMsg(null); setModalBusy(false)
    if(m==='edit'){
      setEditForm({
        titulo: p.titulo||'',
        objetivo_general: p.objetivo_general||'',
        descripcion: p.descripcion||'',
        lugar_intervencion: p.lugar_intervencion||'',
        presupuesto_aprobado: p.presupuesto_aprobado!=null? String(p.presupuesto_aprobado):''
      })
    }
    if(m==='monitoreo'){
      setMonForm({fecha_monitoreo: new Date().toISOString().slice(0,10), porcentaje_avance: String(p.porcentaje_avance ?? ''), resultado:'', observaciones:''})
    }
    if(m==='transicion'){
      setTransLoading(true); setTransOptions([]); setEstadosCat([]); setTransForm({estado_destino:'', id_rol_actor:'', resultado:'APROBADO', comentarios:''})
      try{
        const [t,e] = await Promise.all([
          api.get('/api/v1/catalogos/transiciones'),
          api.get('/api/v1/catalogos/estados')
        ])
        const estados = asArray<any>((e as any).data)
        setEstadosCat(estados)
        const byId = new Map<number,string>(estados.map((x:any)=>[Number(x.id_estado), x.codigo]))
        const ts = asArray<any>((t as any).data)
        const mios = ts.filter(x=> Number(x.estado_origen)===Number(p.id_estado_actual))
        const propios = user?.rol_actor_id ? mios.filter(x=> Number(x.id_rol_actor)===Number(user.rol_actor_id)) : []
        const elegibles = propios.length? propios : mios
        setTransOptions(elegibles)
        if(elegibles.length){
          const cod = byId.get(Number(elegibles[0].estado_destino)) || ''
          setTransForm({estado_destino:cod, id_rol_actor:String(elegibles[0].id_rol_actor), resultado:'APROBADO', comentarios:''})
        }else{
          setModalMsg({type:'err', text:'No hay transiciones BPMN disponibles para tu rol desde el estado actual.'})
        }
      }catch(ex:any){
        setModalMsg({type:'err', text: ex?.message || 'No se pudo cargar el catálogo de transiciones'})
      }finally{ setTransLoading(false) }
    }
    if(m==='entregable'){
      setEntForm({orden:'1', horas:'', id_tipo_doc:'', archivo:null})
      try{ const d:any = await api.get('/api/v1/catalogos/tipos-documento'); setTiposDoc(asArray(d.data)) }
      catch(ex:any){ setTiposDoc([]); setModalMsg({type:'err', text: ex?.message||'No se pudo cargar los tipos de documento'}) }
    }
    if(m==='vincular'){
      setBenSel(''); setBenSearch(''); setBenList([])
      try{ const b:any = await api.get('/api/v1/beneficiarios'); setBenList(asArray(b.data)) }
      catch(ex:any){ setModalMsg({type:'err', text: ex?.message||'No se pudo cargar el padrón de beneficiarios'}) }
    }
    if(m==='fotos'){
      setFotosForm({id_actividad: actividades[0]?.id_actividad ? String(actividades[0].id_actividad):'', archivos:[]})
    }
  }

  const buscarBeneficiarios = async ()=>{
    setModalBusy(true); setModalMsg(null)
    try{
      const b:any = await api.get(`/api/v1/beneficiarios?search=${encodeURIComponent(benSearch)}`)
      setBenList(asArray(b.data))
      if(!asArray(b.data).length) setModalMsg({type:'err', text:'Sin coincidencias en el padrón'})
    }catch(ex:any){ setBenList([]); setModalMsg({type:'err', text: ex?.message||'Error al buscar'}) }
    finally{ setModalBusy(false) }
  }

  const guardarEdicion = async ()=>{
    setModalBusy(true); setModalMsg(null)
    try{
      await api.put(`/api/v1/proyectos/${id}`, {
        titulo: editForm.titulo,
        objetivo_general: editForm.objetivo_general,
        descripcion: editForm.descripcion,
        lugar_intervencion: editForm.lugar_intervencion,
        presupuesto_aprobado: editForm.presupuesto_aprobado===''? undefined : Number(editForm.presupuesto_aprobado)
      })
      setModalMsg({type:'ok', text:'Proyecto actualizado'})
      await load()
      setTimeout(()=> setModal(''), 600)
    }catch(ex:any){ setModalMsg({type:'err', text: ex?.message||'No se pudo actualizar'}) }
    finally{ setModalBusy(false) }
  }

  const guardarMonitoreo = async ()=>{
    setModalBusy(true); setModalMsg(null)
    if(!monForm.fecha_monitoreo || !monForm.resultado){ setModalMsg({type:'err', text:'Fecha y resultado son obligatorios'}); setModalBusy(false); return }
    try{
      await api.post('/api/v1/monitoreos', {
        id_proyecto: Number(id),
        id_monitor: Number(user?.persona_id),
        fecha_monitoreo: monForm.fecha_monitoreo,
        porcentaje_avance: monForm.porcentaje_avance===''? undefined : Number(monForm.porcentaje_avance),
        resultado: monForm.resultado,
        observaciones: monForm.observaciones || undefined
      })
      setModalMsg({type:'ok', text:'Monitoreo registrado'})
      await load()
      setTimeout(()=> setModal(''), 600)
    }catch(ex:any){ setModalMsg({type:'err', text: ex?.message||'No se pudo registrar el monitoreo'}) }
    finally{ setModalBusy(false) }
  }

  const guardarTransicion = async ()=>{
    setModalBusy(true); setModalMsg(null)
    if(!transForm.estado_destino || !transForm.id_rol_actor){ setModalMsg({type:'err', text:'Selecciona la transición'}); setModalBusy(false); return }
    // El rol actor y el usuario los resuelve el backend desde el token. El
    // id_rol_actor que se muestra en el selector es solo para encuadrar la
    // transición elegida, no para autorizar: mandarlo sería permitir que el
    // cliente aprobara en nombre de otro rol.
    try{
      await api.post(`/api/v1/proyectos/${id}/transicion`, {
        estado_destino: String(transForm.estado_destino),
        resultado: transForm.resultado,
        comentarios: transForm.comentarios || undefined
      })
      setModalMsg({type:'ok', text:'Transición registrada'})
      await Promise.all([load(), reloadHistorial()])
      setTimeout(()=> setModal(''), 600)
    }catch(ex:any){ setModalMsg({type:'err', text: ex?.message?.replace(/^HTTP \d+: /,'') || 'Transición rechazada por el flujo BPMN'}) }
    finally{ setModalBusy(false) }
  }

  const guardarEntregable = async ()=>{
    setModalMsg(null)
    if(!entForm.archivo){ setModalMsg({type:'err', text:'Selecciona el archivo PDF'}); return }
    if(!entForm.horas || Number(entForm.horas)<=0){ setModalMsg({type:'err', text:'Indica las horas del entregable'}); return }
    if(!entForm.id_tipo_doc){ setModalMsg({type:'err', text:'Selecciona el tipo de documento'}); return }
    // Validación cliente antes de subir (el backend revalida siempre).
    const errArchivo = validarArchivo(entForm.archivo, 'pdf')
    if(errArchivo){ setModalMsg({type:'err', text: errArchivo}); return }
    setModalBusy(true)
    try{
      const fd = new FormData()
      fd.append('orden', entForm.orden)
      fd.append('horas_asignadas', entForm.horas)
      fd.append('id_tipo_doc', entForm.id_tipo_doc)
      fd.append('id_usuario_subida', String(user?.persona_id))
      fd.append('archivo', entForm.archivo)
      await api.upload(`/api/v1/proyectos/${id}/entregables/registrar`, fd)
      setModalMsg({type:'ok', text:'Entregable enviado'})
      await reloadEntregables()
      setTimeout(()=> setModal(''), 600)
    }catch(ex:any){ setModalMsg({type:'err', text: ex?.message||'No se pudo registrar el entregable'}) }
    finally{ setModalBusy(false) }
  }

  const vincularBeneficiario = async ()=>{
    setModalBusy(true); setModalMsg(null)
    if(!benSel){ setModalMsg({type:'err', text:'Selecciona un beneficiario'}); setModalBusy(false); return }
    try{
      await api.post('/api/v1/beneficiarios/vincular', {id_proyecto: Number(id), id_beneficiario: Number(benSel)})
      setModalMsg({type:'ok', text:'Beneficiario vinculado'})
      await reloadBeneficiarios()
      setTimeout(()=> setModal(''), 600)
    }catch(ex:any){ setModalMsg({type:'err', text: ex?.message||'No se pudo vincular'}) }
    finally{ setModalBusy(false) }
  }

  const subirFotos = async ()=>{
    setModalMsg(null)
    if(!fotosForm.id_actividad){ setModalMsg({type:'err', text:'Selecciona la actividad'}); return }
    if(!fotosForm.archivos.length){ setModalMsg({type:'err', text:'Selecciona al menos una foto (JPG/PNG)'}); return }
    // Validación cliente del lote: JPG/PNG, 2MB c/u, máximo 7 (R12/R13).
    const errLote = validarLote(fotosForm.archivos, 'foto', 7)
    if(errLote){ setModalMsg({type:'err', text: errLote}); return }
    setModalBusy(true)
    try{
      for(const f of fotosForm.archivos){
        const fd = new FormData()
        fd.append('id_actividad', fotosForm.id_actividad)
        fd.append('archivo', f)
        await api.upload('/api/v1/actividades/fotos', fd)
      }
      setModalMsg({type:'ok', text:`${fotosForm.archivos.length} foto(s) subida(s)`})
      setFotosForm({id_actividad:fotosForm.id_actividad, archivos:[]})
      await load()
    }catch(ex:any){ setModalMsg({type:'err', text: ex?.message||'No se pudieron subir las fotos'}) }
    finally{ setModalBusy(false) }
  }

  const handleCrearActividad = async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!formAct.nombre || !formAct.descripcion || !formAct.fecha) return
    // HU-011: hora fin > inicio y duración válida antes de enviar al backend
    const totalMin = (formAct.horas||0)*60 + (formAct.minutos||0)
    if(totalMin<=0){ setActMsg({type:'err', text:'Indica la duración (horas/minutos mayor a 0)'}); return }
    if(formAct.horaFin && formAct.horaFin <= formAct.horaInicio){
      setActMsg({type:'err', text:'La hora de finalización debe ser posterior a la de inicio'}); return
    }
    setSubmitting(true); setActMsg(null)
    try{
      await api.post('/api/v1/actividades', {
        id_proyecto: Number(id),
        nombre: formAct.nombre,
        descripcion: formAct.descripcion,
        fecha_programada: formAct.fecha,
        lugar: p.lugar_intervencion,
        hora_inicio: formAct.horaInicio ? formAct.horaInicio + ':00' : null,
        hora_fin: formAct.horaFin ? formAct.horaFin + ':00' : null,
        minutos: totalMin,
      })
      const a:any = await api.get(`/api/v1/proyectos/${id}/actividades`)
      setActividades(asArray(a.data))
      setFormAct({fecha: new Date().toISOString().slice(0,10), nombre:'', horas:0, minutos:0, horaInicio:'09:00', horaFin:'', descripcion:''})
      setActMsg({type:'ok', text:'Actividad registrada'})
    }catch(err:any){ setActMsg({type:'err', text: err?.message||'No se pudo registrar la actividad'}) } finally { setSubmitting(false)}
  }

  if(bloqueado){
    // HU-064: un estudiante sí puede VER un PEP abierto (vista previa para
    // unirse). Solo se bloquea cuando el proyecto no es suyo y además no es
    // un PEP abierto — y el motivo se dice claro según el caso.
    const pepCerrado = esPEP
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 grid place-items-center mx-auto text-xl">!</div>
        <h2 className="font-bold text-slate-800 mt-3">{pepCerrado ? 'Este PEP ya cerró' : 'Este no es tu proyecto'}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {pepCerrado
            ? 'El proyecto ya cerró (o fue validado) y no recibe nuevas solicitudes de unión. Busca otro PEP abierto para participar.'
            : 'Solo puedes ver tu único proyecto activo. Los PEP abiertos sí puedes verlos y pedir unirte desde la pestaña Equipo. Si fuiste retirado, contacta al docente responsable.'}
        </p>
        <div className="flex justify-center gap-2 flex-wrap mt-4">
          <Link to="/mis-proyectos" className="inline-flex px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold">Volver a mi proyecto</Link>
          <Link to="/mis-proyectos" className="inline-flex px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold">Ver PEPs abiertos</Link>
        </div>
      </div>
    )
  }

  const tabs = esEstudiante
    ? [['general','Resumen'], ['equipo','Equipo'], ['entregables','Entregables'], ['evidencias','Evidencias'], ['beneficiarios','Beneficiarios']]
    : [['general','General'], ['equipo','Equipo'], ['entregables','Entregables'], ['evidencias','Evidencias'], ['flujo','Flujo'], ['beneficiarios','Beneficiarios']]
  const tab = tabs.some(([k])=> k===tabParam) ? tabParam : 'general'
  const nombreEstado = (idEstado:any)=> estadosCat.find((e:any)=> Number(e.id_estado)===Number(idEstado))?.nombre || `Estado ${idEstado}`
  const codigoEstado = (idEstado:any)=> estadosCat.find((e:any)=> Number(e.id_estado)===Number(idEstado))?.codigo || String(idEstado)

  // ── Fase 2 · Aprobación: quién puede hacer qué ──
  // E1 (opción C): el Decano genera el oficio cuando el expediente está en
  // dictamen; la Dirección RS de Facultad activa el proyecto con el sustento.
  const esDecanoUI = ['DECANO','ADMIN'].includes(user?.rol_actor||'')
  const esRSFUI = ['DIR_RS_FACULTAD','ADMIN'].includes(user?.rol_actor||'')
  const puedeGenerarOficio = esDecanoUI && codigo==='EN_DICTAMEN_CONSEJO'
  const puedeActivar = esRSFUI && codigo==='EN_ASIGNACION_CARGA'

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
          <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">Avance</div><div className="font-black text-lg">{p.porcentaje_avance}%</div><div className="h-2 bg-slate-200 rounded-full mt-1"><div className="h-full bg-emerald-600 rounded-full" style={{width:`${p.porcentaje_avance}%`}}/></div></div>
          <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">Presupuesto</div><div className="font-semibold">S/ {p.presupuesto_aprobado?.toLocaleString()} aprobado</div><div className="text-xs text-slate-500">Ejecutado S/ {p.monto_ejecutado?.toLocaleString()}</div></div>
          <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">Lugar</div><div className="font-semibold">{p.lugar_intervencion || '—'}</div><div className="text-xs text-slate-500">{p.poblacion_beneficiaria || '—'}</div></div>
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
          <p className="text-sm text-slate-600">{p.objetivo_general || 'Sin objetivo registrado.'}</p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">Población:</span> {p.poblacion_beneficiaria || '—'}</div>
            <div><span className="text-slate-500">Lugar:</span> {p.lugar_intervencion || '—'}</div>
          </div>
          <div className="pt-3 flex gap-2 flex-wrap">
            {editableByStudent && <Button onClick={()=>openModal('edit')} leftIcon={<Pencil size={14}/>} variant="secondary">Editar proyecto</Button>}
            {editableByStudent && <Button onClick={()=>openModal('transicion')} leftIcon={<ClipboardCheck size={14}/>}>Solicitar revisión</Button>}
            {isDocente && codigo==='EN_EJECUCION' && <Button onClick={()=>openModal('monitoreo')} className="bg-emerald-600 hover:bg-emerald-700" leftIcon={<ClipboardCheck size={14}/>}>Registrar monitoreo</Button>}
            {isDirectivo && tieneLane(codigo) && <Button onClick={()=>openModal('transicion')} className="bg-amber-600 hover:bg-amber-700" leftIcon={<Gavel size={14}/>}>Revisar y dictaminar</Button>}
          </div>

          {/* ── Fase 2 · Oficio de elevación (lo genera el Decano) ── */}
          {(p.numero_oficio || puedeGenerarOficio || puedeActivar || fase2Msg) && (
            <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wide text-indigo-700">Fase 2 · Ejecución y activación</div>
              {p.numero_oficio && (
                <div className="text-sm text-slate-700">
                  <span className="font-mono">{p.numero_oficio}</span>
                  {p.fecha_elevacion && <> · elevado el {new Date(p.fecha_elevacion).toLocaleDateString('es-PE')}</>}
                  <button disabled={fase2Busy} onClick={descargarOficio} className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">
                    <Download size={12}/> Descargar oficio (PDF)
                  </button>
                </div>
              )}
              {puedeGenerarOficio && (
                <div>
                  <button disabled={fase2Busy} onClick={generarOficio} className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold disabled:opacity-60">
                    <FileText size={14}/> {fase2Busy ? 'Generando…' : 'Generar Oficio de Elevación'}
                  </button>
                  <div className="text-[11px] text-slate-500 mt-1">El PDF sale con membrete, datos del expediente y espacios para firma y sello del Decano.</div>
                </div>
              )}
              {puedeActivar && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-600">La resolución es documento externo: súbela en Documentos y anota su ID (HU-F2-F: se carga, nunca se genera).</div>
                  <div className="flex gap-2 items-center mt-1">
                    <input
                      value={fase2DocId}
                      onChange={e=>setFase2DocId(e.target.value.replace(/\D/g,''))}
                      placeholder="ID documento sustento"
                      className="w-44 px-2 py-1.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-indigo-600"
                    />
                    <button disabled={fase2Busy} onClick={activarProyecto} className="inline-flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold disabled:opacity-60">
                      <Check size={14}/> Activar proyecto
                    </button>
                  </div>
                </div>
              )}
              {fase2Msg && <Alert variant={fase2Msg.type==='ok'?'success':'error'} className="text-xs">{fase2Msg.text}</Alert>}
            </div>
          )}
        </div>
      )}

      {tab==='equipo' && (
        <div className="space-y-4">
          {/* ── Equipo actual (HU-064) ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-bold flex items-center gap-2"><Users size={16}/>Equipo del proyecto</h3>
              <span className="text-xs bg-sky-50 border border-sky-200 text-sky-700 px-2 py-1 rounded-full font-semibold">Cupos {ocupados}/5</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-500">Líder</div>
                <div className="font-semibold">{p.estudiante_lider ? `${p.estudiante_lider.nombres} ${p.estudiante_lider.apellidos}` : '—'}</div>
                {p.estudiante_lider?.celular && <div className="text-xs text-slate-500 mt-0.5">Cel: <span className="font-mono">{p.estudiante_lider.celular}</span></div>}
              </div>
              <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">Docente responsable / asesor</div><div className="font-semibold">{p.docente_asesor ? `${p.docente_asesor.nombres} ${p.docente_asesor.apellidos}` : '—'}</div></div>
            </div>
            {puedeTransferirLider && (
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <Button variant="outline" size="sm" leftIcon={<Crown size={14}/>} onClick={()=>{ setLiderNuevo(''); setLiderMotivo(''); setLiderMsg(null); setLiderOpen(true) }}>
                  Transferir liderazgo
                </Button>
                <span className="text-xs text-slate-400">Decide el equipo o la Dirección RSU de Facultad (HU-060). Se notifica por correo a los dos líderes.</span>
              </div>
            )}
            {puedeExpulsar && (
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <Button variant="outline" size="sm" className="text-red-700 border-red-200 hover:bg-red-50" leftIcon={<Gavel size={14}/>}
                  onClick={()=>{ setExpSel(''); setExpCausal(''); setExpMotivo(''); setExpMsg(null); setExpOpen(true) }}>
                  Expulsar integrante
                </Button>
                <span className="text-xs text-slate-400">HU-070: solo Dirección RS de Facultad. Requiere causal y motivo; el líder se sustituye con HU-060.</span>
              </div>
            )}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[560px]">
                <thead><tr className="bg-slate-900 text-white text-xs">
                  <th className="px-3 py-2 text-left font-semibold">NOMBRE</th>
                  <th className="px-3 py-2 text-left font-semibold">CÓDIGO</th>
                  <th className="px-3 py-2 text-left font-semibold">CORREO</th>
                  <th className="px-3 py-2 text-center font-semibold">ESTADO</th>
                </tr></thead>
                <tbody>
                  {miembros.length===0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-500">Sin participantes registrados (solo el líder).</td></tr>}
                  {miembros.map((m:any)=>(
                    <tr key={m.id_participante ?? m.id_estudiante} className="border-b border-slate-200">
                      <td className="px-3 py-2 font-medium text-slate-700">{m.estudiante ? `${m.estudiante.nombres} ${m.estudiante.apellidos}` : `#${m.id_estudiante}`}</td>
                      <td className="px-3 py-2 font-mono text-xs">{m.estudiante?.codigo_estudiante || '—'}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{m.estudiante?.correo_institucional || '—'}</td>
                      <td className="px-3 py-2 text-center"><span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">{m.estado_participacion}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Unirse al PEP (HU-065): estudiante no miembro en PEP abierto ── */}
          {esEstudiante && !esMiembroEquipo && pepAbierto && (
            <div className="bg-white rounded-2xl border border-violet-200 p-6">
              <h3 className="font-bold flex items-center gap-2"><UserPlus size={16}/>Unirse a este PEP</h3>
              {miSolicitudPendiente ? (
                <div className="mt-3 text-sm">
                  <Alert variant="warning">Ya enviaste una solicitud — está <b>PENDIENTE</b> de revisión del responsable. Te avisaremos por notificaciones.</Alert>
                  <Button variant="outline" size="sm" className="mt-2" disabled={solBusy} onClick={()=>cancelarSolicitud(miSolicitudPendiente.solicitud.id_solicitud)}>Cancelar mi solicitud</Button>
                </div>
              ) : ocupados >= 5 ? (
                <Alert variant="warning">El equipo ya está completo (5/5).</Alert>
              ) : (
                <div className="mt-3 space-y-2">
                  <Label>Mensaje al responsable (opcional)</Label>
                  <Textarea rows={2} value={mensajeUnion} onChange={e=>setMensajeUnion(e.target.value)} placeholder="Cuéntales por qué quieres unirte..." maxLength={500}/>
                  <div className="text-xs text-slate-400 text-right">{mensajeUnion.trim().length}/500</div>
                  <Button disabled={solBusy} onClick={solicitarUnirse} leftIcon={<UserPlus size={14}/>}>{solBusy?'Enviando...':'Solicitar unirme'}</Button>
                </div>
              )}
            </div>
          )}

          {/* ── Mis solicitudes (estudiante) ── */}
          {esEstudiante && misSolicitudes.length>0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold flex items-center gap-2"><Inbox size={16}/>Mis solicitudes</h3>
              <div className="mt-3 space-y-2">
                {misSolicitudes.map((s:any)=>(
                  <div key={s.solicitud.id_solicitud} className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 text-sm flex-wrap">
                    <span className="font-mono text-[11px] bg-slate-900 text-white px-2 py-0.5 rounded-lg">{s.solicitud?.proyecto?.codigo_proyecto || `#${s.solicitud.id_proyecto}`}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.solicitud.estado==='PENDIENTE'?'bg-amber-100 text-amber-700':s.solicitud.estado==='ACEPTADA'?'bg-emerald-100 text-emerald-700':s.solicitud.estado==='RECHAZADA'?'bg-red-100 text-red-600':'bg-slate-100 text-slate-500'}`}>{s.solicitud.estado}</span>
                    {s.solicitud.estado==='RECHAZADA' && <span className="text-xs text-slate-500">Motivo: <b>{s.solicitud.motivo_rapido}</b>{s.solicitud.motivo_rechazo ? ` — ${s.solicitud.motivo_rechazo}` : ''}</span>}
                    {s.solicitud.estado==='PENDIENTE' && <button disabled={solBusy} onClick={()=>cancelarSolicitud(s.solicitud.id_solicitud)} className="ml-auto text-xs text-red-600 hover:underline font-semibold">Cancelar</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Bandeja del responsable (HU-066..HU-068) ── */}
          {soyResponsable && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-bold flex items-center gap-2"><Inbox size={16}/>Solicitudes de unión</h3>
                <span className="text-xs bg-violet-50 border border-violet-200 text-violet-700 px-2 py-1 rounded-full font-semibold">{solicitudesPendientes.length} pendiente(s)</span>
              </div>
              {/* Razones rápidas arriba del panel (nota de desarrollo) */}
              <div className="mt-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="font-semibold text-slate-700">Motivos rápidos de rechazo:</span> {MOTIVOS_RAPIDOS.map(m=><span key={m} className="ml-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded-md font-mono text-[10px]">{m}</span>)}
              </div>
              {solMsg && <Alert variant={solMsg.type==='ok'?'success':'error'} className="mt-3 text-xs">{solMsg.text}</Alert>}
              {solicitudesError && <Alert variant="error" className="mt-3 text-xs">{solicitudesError} <button className="underline font-semibold" onClick={reloadSolicitudes}>Reintentar</button></Alert>}
              <div className="mt-3 space-y-3">
                {solicitudes.length===0 && !solicitudesError && <div className="text-sm text-slate-500 text-center py-4">Sin solicitudes.</div>}
                {solicitudes.map((s:any)=>{
                  const sol = s.solicitud
                  const est = sol.estudiante
                  return (
                    <div key={sol.id_solicitud} className="border border-slate-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800">{est ? `${est.nombres} ${est.apellidos}` : `#${sol.id_estudiante}`}</span>
                        <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded-full">ciclo {s.ciclo || '—'}</span>
                        <span className="font-mono text-[11px] bg-slate-900 text-white px-2 py-0.5 rounded-lg">{est?.codigo_estudiante || ''}</span>
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[11px] font-semibold ${sol.estado==='PENDIENTE'?'bg-amber-100 text-amber-700':sol.estado==='ACEPTADA'?'bg-emerald-100 text-emerald-700':sol.estado==='RECHAZADA'?'bg-red-100 text-red-600':'bg-slate-100 text-slate-500'}`}>{sol.estado}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{s.escuela || ''} · {est?.correo_institucional || ''} · {sol.fecha_solicitud ? new Date(sol.fecha_solicitud).toLocaleDateString('es-PE') : ''}</div>
                      {sol.mensaje_solicitud && <div className="text-xs text-slate-600 mt-1 italic">“{sol.mensaje_solicitud}”</div>}
                      {sol.estado==='RECHAZADA' && <div className="text-xs text-slate-500 mt-1">Motivo: <b>{sol.motivo_rapido}</b>{sol.motivo_rechazo ? ` — ${sol.motivo_rechazo}` : ''}</div>}
                      {sol.estado==='PENDIENTE' && (
                        <div className="mt-2">
                          {rechazoId===sol.id_solicitud ? (
                            <div className="space-y-2 bg-red-50/50 border border-red-100 rounded-xl p-3">
                              <Label>Motivo rápido *</Label>
                              <Select value={motivoRapido} onChange={e=>setMotivoRapido(e.target.value)}>
                                <option value="">-- elegir motivo --</option>
                                {MOTIVOS_RAPIDOS.map(m=><option key={m} value={m}>{m}</option>)}
                              </Select>
                              <Label>Comentario {motivoRapido==='OTRO' ? '(obligatorio)' : '(opcional)'}</Label>
                              <Textarea rows={2} value={motivoTexto} onChange={e=>setMotivoTexto(e.target.value)} placeholder="Razón del rechazo..." maxLength={500}/>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" disabled={solBusy} onClick={()=>{setRechazoId(null); setMotivoRapido(''); setMotivoTexto('')}}>Volver</Button>
                                <Button size="sm" className="bg-red-600 hover:bg-red-700" disabled={solBusy || !motivoRapido} onClick={rechazarSolicitud} leftIcon={<X size={14}/>}>Confirmar rechazo</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={solBusy} onClick={()=>aceptarSolicitud(sol.id_solicitud)} leftIcon={<Check size={14}/>}>Aceptar</Button>
                              <Button size="sm" variant="outline" disabled={solBusy} onClick={()=>{setRechazoId(sol.id_solicitud); setMotivoRapido(''); setMotivoTexto(''); setSolMsg(null)}} leftIcon={<X size={14}/>}>Rechazar</Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {solMsg && !soyResponsable && <Alert variant={solMsg.type==='ok'?'success':'error'} className="text-xs">{solMsg.text}</Alert>}
        </div>
      )}

      {tab==='entregables' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
            <div className="flex justify-between items-center gap-2">
              <h3 className="font-bold text-sm">Progreso del proyecto</h3>
              <span className="text-xs text-slate-500">{entregados} / {totalEnt} completados{totalEnt>0 && ` · ${pctEnt}%`}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-slate-800 rounded-full" style={{width:`${pctEnt}%`}}/></div>
            {entregablesError && <Alert variant="error" className="mt-3 text-xs">{entregablesError} <button className="underline font-semibold" onClick={reloadEntregables}>Reintentar</button></Alert>}
            <div className="mt-6 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-sm border-collapse min-w-[820px]">
                <thead>
                  <tr className="bg-[#0f2b24] text-white text-xs">
                    <th className="px-3 py-3 text-left font-semibold border border-[#0f2b24]">ENTREGA</th>
                    <th className="px-3 py-3 text-center font-semibold border border-[#0f2b24]">ORDEN</th>
                    <th className="px-3 py-3 text-center font-semibold border border-[#0f2b24]">FECHA LIMITE DE PRESENTACIÓN</th>
                    <th className="px-3 py-3 text-center font-semibold border border-[#0f2b24]">ARCHIVO</th>
                    <th className="px-3 py-3 text-center font-semibold border border-[#0f2b24]">HORAS</th>
                    <th className="px-3 py-3 text-center font-semibold border border-[#0f2b24]">ESTADO</th>
                    <th className="px-3 py-3 text-center font-semibold border border-[#0f2b24]">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {totalEnt===0 && (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-xs text-slate-500">Sin entregables registrados para este proyecto.</td></tr>
                  )}
                  {entregables.map((e:any)=>{
                    const est = normEstadoEnt(e.estado||'')
                    const enviado = est==='ENVIADO' || est==='APROBADO'
                    const url = e.documento?.url_archivo ? api.fileUrl(e.documento.url_archivo) : ''
                    return (
                      <tr key={e.id_entregable ?? e.orden} className="border-b border-slate-200">
                        <td className="px-3 py-3 font-medium text-slate-700">{e.nombre}</td>
                        <td className="px-3 py-3 text-center"><span className="inline-flex min-w-6 h-6 px-1 bg-sky-600 text-white rounded items-center justify-center text-[10px]">{e.orden}</span></td>
                        <td className="px-3 py-3 text-center text-xs">{e.fecha_limite ? new Date(e.fecha_limite).toLocaleDateString('es-PE') : <span className="text-slate-400">No aplica</span>}{enviado && <span className="ml-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px]">Presentada</span>}</td>
                        <td className="px-3 py-3 text-center text-xs">{e.documento ? <span className="inline-flex items-center gap-1 text-slate-700"><FileText size={12}/>{e.documento.nombre_archivo}</span> : <span className="text-slate-400">Sin archivo</span>}</td>
                        <td className="px-3 py-3 text-center"><span className="px-2 py-1 bg-slate-100 rounded-full text-xs">{e.horas_asignadas ? `${e.horas_asignadas} horas` : 'No Aplica'}</span></td>
                        <td className="px-3 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${enviado?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-600'}`}>{est}</span></td>
                        <td className="px-3 py-3 text-center text-xs">
                          {url ? (
                            <button onClick={()=>window.open(url,'_blank','noopener')} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"><Download size={12}/> Descargar</button>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {puedeSubirDocs && <Button onClick={()=>openModal('entregable')} className="mt-4 bg-emerald-600 hover:bg-emerald-700" leftIcon={<Upload size={14}/>}>Subir entregable</Button>}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Horas</label>
                  <input type="number" min={0} max={23} value={formAct.horas} onChange={e=> setFormAct({...formAct, horas: Number(e.target.value)})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Minutos</label>
                  <input type="number" min={0} max={59} value={formAct.minutos} onChange={e=> setFormAct({...formAct, minutos: Number(e.target.value)})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Hora de inicio</label>
                  <input type="time" value={formAct.horaInicio} onChange={e=> setFormAct({...formAct, horaInicio:e.target.value})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Hora de finalización</label>
                  <input type="time" value={formAct.horaFin} onChange={e=> setFormAct({...formAct, horaFin:e.target.value})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Descripción</label>
                <textarea placeholder="Describe la actividad..." value={formAct.descripcion} onChange={e=> setFormAct({...formAct, descripcion:e.target.value})} rows={3} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"/>
              </div>
              {actMsg && <Alert variant={actMsg.type==='ok'?'success':'error'} className="text-xs">{actMsg.text}</Alert>}
              {puedeRegistrarActividad ? (
                <button disabled={submitting} type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">{submitting? 'Guardando...':'Registrar Actividad'}</button>
              ) : (
                <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">No puedes registrar actividades en el estado actual ({codigo}) o no eres miembro del equipo.</div>
              )}
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-sm">Capturar Evidencia</h3>
            <p className="text-xs text-slate-500 mt-1">Sube hasta 7 fotos JPG/PNG por actividad (máx 2MB c/u). Las evidencias quedan visibles para el docente y directores.</p>
            <div className="mt-3 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
              <div className="text-sm text-slate-500">Adjunta las fotos de cada actividad registrada</div>
              <Button size="sm" variant="outline" className="mt-2" onClick={()=>openModal('fotos')} disabled={actividades.length===0} leftIcon={<Camera size={14}/>}>Seleccionar fotos</Button>
              {actividades.length===0 && <div className="text-xs text-slate-400 mt-2">Primero registra una actividad para poder subir evidencias.</div>}
            </div>
            {actividadesError && <Alert variant="error" className="mt-3 text-xs">{actividadesError}</Alert>}
            {actividades.length>0 && (
              <div className="mt-4 space-y-2">
                {actividades.map((a:any)=>(
                  <div key={a.id_actividad} className="border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2 justify-between text-sm"><div><b>{a.nombre}</b><div className="text-xs text-slate-500">{a.fecha_programada?.slice(0,10)} · {a.lugar || '—'}</div></div><span className="px-2 py-1 bg-slate-100 rounded-full text-xs">{a.estado}</span></div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-sm">Asistencia de beneficiarios</h3>
            <p className="text-xs text-slate-500">Marca quién asistió y sube la ficha firmada.</p>
            <div className="mt-3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">
              {beneficiariosError && <div className="text-red-600 mb-2">{beneficiariosError}</div>}
              {beneficiarios.length===0 ? 'Sin beneficiarios vinculados. Vincúlalos en la pestaña Beneficiarios.' :
                `${beneficiarios.length} beneficiario(s) vinculado(s) a este proyecto: ${beneficiarios.map((b:any)=> b.razon_social || [b.apellidos,b.nombres].filter(Boolean).join(', ')).join(' · ')}`}
            </div>
          </div>
        </div>
      )}

      {tab==='flujo' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">Historial</h3>
            <Button size="sm" variant="outline" onClick={reloadHistorial}>Actualizar</Button>
          </div>
          {historialError && <Alert variant="error" className="mt-3 text-xs">{historialError}</Alert>}
          <div className="mt-4 space-y-3">
            {historial.length===0 && !historialError && <Empty title="Sin transiciones registradas" description="El flujo de aprobación aparecerá aquí cuando el proyecto cambie de estado."/>}
            {historial.map(h=>(
              <div key={h.id_flujo} className="flex gap-3 items-center border border-slate-200 rounded-xl p-3">
                <div className={`w-2 h-10 rounded-full ${h.resultado==='APROBADO'?'bg-emerald-500':'bg-amber-500'}`}/>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{h.estado_origen?.nombre || '—'} → {h.estado_destino?.nombre || '—'}</div>
                  <div className="text-xs text-slate-500">{h.rol_actor?.nombre || '—'} · {h.resultado} · {h.fecha_transicion?.slice(0,10)}</div>
                  {h.comentarios && <div className="text-xs text-slate-500 mt-1">{h.comentarios}</div>}
                </div>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded-lg">{h.resultado}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {flujo.map((e, i) => {
              const esMio = tieneLane(e.codigo)
              return (
                <span
                  key={e.codigo}
                  title={e.nombre}
                  className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                    e.codigo === codigo
                      ? 'bg-slate-900 text-white border-slate-900'
                      : esMio
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  {i + 1}. {e.codigo}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {tab==='beneficiarios' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">Beneficiarios vinculados</h3>
            <Button size="sm" variant="outline" onClick={reloadBeneficiarios}>Actualizar</Button>
          </div>
          <p className="text-xs text-slate-500">Solo los de este proyecto. Estudiantes y docentes pueden vincular.</p>
          {beneficiariosError && <Alert variant="error" className="mt-3 text-xs">{beneficiariosError}</Alert>}
          <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
            {beneficiarios.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-4 col-span-2">No hay beneficiarios vinculados</div>
            ) : beneficiarios.map((b: any) => (
              <div key={b.id_beneficiario} className="border border-slate-200 rounded-xl p-3">
                <b>{b.nombres ? `${b.apellidos}, ${b.nombres}` : b.razon_social}</b> · {b.dni || b.ruc || '—'} · {b.distrito || '—'}
                <span className="ml-2 px-2 py-0.5 bg-sky-100 rounded-full text-xs">{b.tipo_beneficiario}</span>
              </div>
            ))}
          </div>
          {(puedeSubirDocs || editableByStudent || isDocente) && <Button className="mt-3" onClick={()=>openModal('vincular')} leftIcon={<Link2 size={14}/>}>Vincular beneficiario</Button>}
        </div>
      )}

      {/* ── HU-060: transferir liderazgo ── */}
      <Modal open={liderOpen} busy={liderBusy} onClose={()=>setLiderOpen(false)}
             title="Transferir liderazgo" desc={`El nuevo líder dirigirá ${p?.codigo_proyecto||'el proyecto'}. Se notifica por correo al líder saliente y al entrante.`}>
        {liderMsg && <Alert variant={liderMsg.type==='ok'?'success':'error'} className="text-xs mb-3">{liderMsg.text}</Alert>}
        {candidatosLider.length===0 ? (
          <Alert variant="warning">No hay otros miembros en el equipo: primero inscribe a un compañero para poder transferirle el liderazgo.</Alert>
        ) : (
          <div className="space-y-3">
            <div>
              <Label required>Nuevo líder (miembro del equipo)</Label>
              <Select value={liderNuevo} onChange={e=>setLiderNuevo(e.target.value)}>
                <option value="">-- elegir miembro --</option>
                {candidatosLider.map((m:any)=>(
                  <option key={m.id_estudiante} value={m.id_estudiante}>
                    {m.estudiante ? `${m.estudiante.nombres} ${m.estudiante.apellidos}` : `#${m.id_estudiante}`}
                    {m.estudiante?.codigo_estudiante ? ` — ${m.estudiante.codigo_estudiante}` : ''}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Motivo del cambio</Label>
              <Textarea rows={3} value={liderMotivo} maxLength={500}
                        onChange={e=>setLiderMotivo(e.target.value)}
                        placeholder="Ej. Cambio de turno del coordinador; decisión del equipo en reunión del 12/10..."/>
              <div className="text-xs text-slate-400 text-right">{liderMotivo.trim().length}/500</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={()=>setLiderOpen(false)} disabled={liderBusy}>Cancelar</Button>
              <Button onClick={transferirLider} disabled={liderBusy} leftIcon={<Crown size={14}/>}>
                {liderBusy?'Transfiriendo...':'Transferir y notificar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── HU-070: expulsión por causales (Dirección RS de Facultad) ── */}
      <Modal open={expOpen} busy={expBusy} onClose={()=>setExpOpen(false)}
             title="Expulsar integrante" desc={`Retiro disciplinario documentado para ${p?.codigo_proyecto||'el proyecto'}. Se notifica al estudiante, al docente y al líder.`}>
        {expMsg && <Alert variant={expMsg.type==='ok'?'success':'error'} className="text-xs mb-3">{expMsg.text}</Alert>}
        {expulsables.length===0 ? (
          <Alert variant="warning">No hay integrantes expulsables: el líder se retira con cambio de liderazgo (HU-060) y los inscritos/activos aparecen aquí.</Alert>
        ) : (
          <div className="space-y-3">
            <div>
              <Label required>Integrante</Label>
              <Select value={expSel} onChange={e=>setExpSel(e.target.value)}>
                <option value="">-- elegir integrante --</option>
                {expulsables.map((m:any)=>(
                  <option key={m.id_estudiante} value={m.id_estudiante}>
                    {m.estudiante ? `${m.estudiante.nombres} ${m.estudiante.apellidos}` : `#${m.id_estudiante}`}
                    {m.estudiante?.codigo_estudiante ? ` — ${m.estudiante.codigo_estudiante}` : ''}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Causal de la expulsión</Label>
              <Select value={expCausal} onChange={e=>setExpCausal(e.target.value)}>
                <option value="">-- elegir causal --</option>
                <option value="FALTAS">FALTAS — inasistencias sin justificar</option>
                <option value="TARDANZAS">TARDANZAS — llegadas tarde reiteradas</option>
                <option value="CONDUCTA">CONDUCTA — indisciplina o conducta inapropiada</option>
                <option value="OTRO">OTRO — otro hecho observado</option>
              </Select>
            </div>
            <div>
              <Label required>Motivo del retiro</Label>
              <Textarea rows={3} value={expMotivo} maxLength={500}
                        onChange={e=>setExpMotivo(e.target.value)}
                        placeholder="Ej. Acumula 3 faltas injustificadas en actividades del 02, 09 y 16 de octubre..."/>
              <div className="text-xs text-slate-400 text-right">{expMotivo.trim().length}/500</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={()=>setExpOpen(false)} disabled={expBusy}>Cancelar</Button>
              <Button onClick={expulsarMiembro} disabled={expBusy} className="bg-red-600 hover:bg-red-700" leftIcon={<Gavel size={14}/>}>
                {expBusy?'Procesando...':'Expulsar y notificar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modal==='edit'} busy={modalBusy} onClose={()=>setModal('')} title="Editar proyecto" desc="PATCH/PUT a /api/v1/proyectos/:id — solo campos editables por el equipo"
        footer={<>
          <Button variant="outline" onClick={()=>setModal('')} disabled={modalBusy}>Cancelar</Button>
          <Button onClick={guardarEdicion} loading={modalBusy}>Guardar cambios</Button>
        </>}>
        <div className="space-y-3">
          <div><Label required>Título</Label><Input value={editForm.titulo} onChange={e=>setEditForm({...editForm, titulo:e.target.value})}/></div>
          <div><Label>Objetivo general</Label><Textarea rows={2} value={editForm.objetivo_general} onChange={e=>setEditForm({...editForm, objetivo_general:e.target.value})}/></div>
          <div><Label>Descripción</Label><Textarea rows={3} value={editForm.descripcion} onChange={e=>setEditForm({...editForm, descripcion:e.target.value})}/></div>
          <div><Label>Lugar de intervención</Label><Input value={editForm.lugar_intervencion} onChange={e=>setEditForm({...editForm, lugar_intervencion:e.target.value})}/></div>
          <div><Label>Presupuesto aprobado (S/)</Label><Input type="number" min="0" step="0.01" value={editForm.presupuesto_aprobado} onChange={e=>setEditForm({...editForm, presupuesto_aprobado:e.target.value})}/></div>
          {modalMsg && <Alert variant={modalMsg.type==='ok'?'success':'error'} className="text-xs">{modalMsg.text}</Alert>}
        </div>
      </Modal>

      <Modal open={modal==='monitoreo'} busy={modalBusy} onClose={()=>setModal('')} title="Registrar monitoreo" desc="POST /api/v1/monitoreos"
        footer={<>
          <Button variant="outline" onClick={()=>setModal('')} disabled={modalBusy}>Cancelar</Button>
          <Button onClick={guardarMonitoreo} loading={modalBusy}>Registrar</Button>
        </>}>
        <div className="space-y-3">
          <div><Label required>Fecha de monitoreo</Label><Input type="date" value={monForm.fecha_monitoreo} onChange={e=>setMonForm({...monForm, fecha_monitoreo:e.target.value})}/></div>
          <div><Label>Porcentaje de avance (%)</Label><Input type="number" min="0" max="100" value={monForm.porcentaje_avance} onChange={e=>setMonForm({...monForm, porcentaje_avance:e.target.value})}/></div>
          <div><Label required>Resultado</Label><Input value={monForm.resultado} onChange={e=>setMonForm({...monForm, resultado:e.target.value})} placeholder="Ej. Cumple con lo planificado"/></div>
          <div><Label>Observaciones</Label><Textarea rows={3} value={monForm.observaciones} onChange={e=>setMonForm({...monForm, observaciones:e.target.value})}/></div>
          {modalMsg && <Alert variant={modalMsg.type==='ok'?'success':'error'} className="text-xs">{modalMsg.text}</Alert>}
        </div>
      </Modal>

      <Modal open={modal==='transicion'} busy={modalBusy} onClose={()=>setModal('')} title="Transición de flujo BPMN" desc="POST /api/v1/proyectos/:id/transicion — validado contra RSU_Transicion_Estado"
        footer={<>
          <Button variant="outline" onClick={()=>setModal('')} disabled={modalBusy||transLoading}>Cancelar</Button>
          <Button onClick={guardarTransicion} loading={modalBusy} disabled={transLoading||transOptions.length===0}>Confirmar transición</Button>
        </>}>
        <div className="space-y-3">
          {transLoading ? <Skeleton className="h-24 w-full"/> : (
            transOptions.length===0 && !modalMsg ? <Alert variant="warning" className="text-xs">No hay transiciones disponibles para tu rol desde {p.estado_actual?.nombre}.</Alert> :
            <>
              <div>
                <Label required>Transición permitida</Label>
                <Select value={transForm.estado_destino} onChange={e=>{
                  const t = transOptions.find(x=> (codigoEstado(x.estado_destino)===e.target.value))
                  setTransForm({...transForm, estado_destino:e.target.value, id_rol_actor: t? String(t.id_rol_actor): transForm.id_rol_actor})
                }}>
                  {transOptions.map((t:any)=>(
                    <option key={`${t.estado_origen}-${t.estado_destino}-${t.id_rol_actor}`} value={codigoEstado(t.estado_destino)}>
                      → {nombreEstado(t.estado_destino)} {t.rol_actor?.nombre? `(${t.rol_actor.nombre})`:''}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label required>Resultado</Label>
                <Select value={transForm.resultado} onChange={e=>setTransForm({...transForm, resultado:e.target.value})}>
                  {RESULTADOS.map(r=><option key={r} value={r}>{r}</option>)}
                </Select>
              </div>
              <div><Label>Comentarios</Label><Textarea rows={2} value={transForm.comentarios} onChange={e=>setTransForm({...transForm, comentarios:e.target.value})} placeholder="Observaciones del revisor"/></div>
              <div className="text-xs text-slate-500">Estado actual: <b>{p.estado_actual?.nombre}</b> ({p.estado_actual?.codigo})</div>
            </>
          )}
          {modalMsg && <Alert variant={modalMsg.type==='ok'?'success':'error'} className="text-xs">{modalMsg.text}</Alert>}
        </div>
      </Modal>

      <Modal open={modal==='entregable'} busy={modalBusy} onClose={()=>setModal('')} title="Subir entregable" desc="POST /api/v1/proyectos/:id/entregables/registrar (multipart)"
        footer={<>
          <Button variant="outline" onClick={()=>setModal('')} disabled={modalBusy}>Cancelar</Button>
          <Button onClick={guardarEntregable} loading={modalBusy}>Enviar entregable</Button>
        </>}>
        <div className="space-y-3">
          <div>
            <Label required>Orden (1-5)</Label>
            <Select value={entForm.orden} onChange={e=>setEntForm({...entForm, orden:e.target.value})}>
              {ORDENES.map(o=><option key={o} value={String(o)}>{o} — {o<=3?'Entregable': o===4?'Encuesta':'Informe final'}</option>)}
            </Select>
          </div>
          <div><Label required>Horas asignadas</Label><Input type="number" min="0.5" step="0.5" value={entForm.horas} onChange={e=>setEntForm({...entForm, horas:e.target.value})} placeholder="4"/></div>
          <div>
            <Label required>Tipo de documento</Label>
            <Select value={entForm.id_tipo_doc} onChange={e=>setEntForm({...entForm, id_tipo_doc:e.target.value})}>
              <option value="">-- seleccionar --</option>
              {tiposDoc.map((t:any)=><option key={t.id_tipo_doc} value={String(t.id_tipo_doc)}>{t.nombre} · {t.etapa}</option>)}
            </Select>
          </div>
          <div>
            <Label required>Archivo PDF</Label>
            <input type="file" accept=".pdf,application/pdf" onChange={e=>setEntForm({...entForm, archivo: e.target.files?.[0]||null})} className="w-full text-xs"/>
            {entForm.archivo && <div className="text-xs text-slate-500 mt-1">{entForm.archivo.name} · {(entForm.archivo.size/1024).toFixed(1)} KB</div>}
          </div>
          {modalMsg && <Alert variant={modalMsg.type==='ok'?'success':'error'} className="text-xs">{modalMsg.text}</Alert>}
        </div>
      </Modal>

      <Modal open={modal==='vincular'} busy={modalBusy} onClose={()=>setModal('')} title="Vincular beneficiario" desc="POST /api/v1/beneficiarios/vincular"
        footer={<>
          <Button variant="outline" onClick={()=>setModal('')} disabled={modalBusy}>Cerrar</Button>
          <Button onClick={vincularBeneficiario} loading={modalBusy}>Vincular</Button>
        </>}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input value={benSearch} onChange={e=>setBenSearch(e.target.value)} placeholder="Buscar por DNI, nombre o razón social..." onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); buscarBeneficiarios() } }}/>
            <Button variant="secondary" onClick={buscarBeneficiarios} loading={modalBusy}>Buscar</Button>
          </div>
          <div>
            <Label required>Beneficiario</Label>
            <Select value={benSel} onChange={e=>setBenSel(e.target.value)}>
              <option value="">-- seleccionar --</option>
              {benList.map((b:any)=>(
                <option key={b.id_beneficiario} value={String(b.id_beneficiario)}>
                  {b.razon_social || `${b.apellidos||''}, ${b.nombres||''}`} — {b.dni||b.ruc||'S/D'} · {b.distrito||'—'}
                </option>
              ))}
            </Select>
          </div>
          {benList.length===0 && <div className="text-xs text-slate-500 text-center py-2">Sin beneficiarios cargados. Realiza una búsqueda.</div>}
          {modalMsg && <Alert variant={modalMsg.type==='ok'?'success':'error'} className="text-xs">{modalMsg.text}</Alert>}
        </div>
      </Modal>

      <Modal open={modal==='fotos'} busy={modalBusy} onClose={()=>setModal('')} title="Seleccionar fotos" desc="POST /api/v1/actividades/fotos (multipart)"
        footer={<>
          <Button variant="outline" onClick={()=>setModal('')} disabled={modalBusy}>Cerrar</Button>
          <Button onClick={subirFotos} loading={modalBusy}>Subir fotos</Button>
        </>}>
        <div className="space-y-3">
          <div>
            <Label required>Actividad</Label>
            <Select value={fotosForm.id_actividad} onChange={e=>setFotosForm({...fotosForm, id_actividad:e.target.value})}>
              <option value="">-- seleccionar actividad --</option>
              {actividades.map((a:any)=><option key={a.id_actividad} value={String(a.id_actividad)}>{a.nombre} · {a.fecha_programada?.slice(0,10)||''}</option>)}
            </Select>
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
            <Camera className="mx-auto text-slate-400" size={22}/>
            <div className="text-sm font-semibold mt-1">JPG / PNG (máx 2MB c/u, hasta 7 por actividad)</div>
            <input type="file" accept=".jpg,.jpeg,.png" multiple onChange={e=>setFotosForm({...fotosForm, archivos: Array.from(e.target.files||[])})} className="mt-2 text-xs w-full"/>
            {fotosForm.archivos.length>0 && <div className="text-xs text-slate-500 mt-1">{fotosForm.archivos.length} archivo(s): {fotosForm.archivos.map(f=>f.name).join(', ')}</div>}
          </div>
          {modalMsg && <Alert variant={modalMsg.type==='ok'?'success':'error'} className="text-xs">{modalMsg.text}</Alert>}
        </div>
      </Modal>
    </div>
  )
}
