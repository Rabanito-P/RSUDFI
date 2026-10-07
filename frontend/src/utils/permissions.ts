// Mapeo BPMN por estado (orden_flujo) → qué rol puede actuar
// Basado en RSU_Estado_Proyecto (16) y RSU_Rol_Actor (12) — V3 mejorado con 12 roles + notificaciones + estudiante aislado

export const ESTADOS = [
  {codigo:'BORRADOR', orden:1, label:'Informe Inicial', actor:'ESTUDIANTE_PROP', rol:'ESTUDIANTE', desc:'Informe Inicial original — edita y envía'},
  {codigo:'EN_REVISION_ESCUELA', orden:2, label:'En revisión Escuela', actor:'DIR_ESCUELA', rol:'DIRECTIVO', desc:'Director de Escuela evalúa viabilidad'},
  {codigo:'CON_VB_ESCUELA', orden:3, label:'Con V°B° Escuela', actor:'COMITE_PS', rol:'DIRECTIVO', desc:'Comité PS revisa no duplicidad'},
  {codigo:'EN_PRIORIZACION_FACULTAD', orden:4, label:'En priorización Facultad', actor:'DIR_RS_FACULTAD', rol:'DIRECTIVO', desc:'Dir. RS Facultad prioriza banco y presupuesto'},
  {codigo:'EN_DICTAMEN_CONSEJO', orden:5, label:'En dictamen Consejo', actor:'CONSEJO_FACULTAD', rol:'DIRECTIVO', desc:'Consejo evalúa para Resolución'},
  {codigo:'APROBADO_CON_RESOLUCION', orden:6, label:'Aprobado con Resolución', actor:'CONSEJO_FACULTAD', rol:'DIRECTIVO', desc:'Con Resolución de Facultad — legal'},
  {codigo:'EN_ASIGNACION_CARGA', orden:7, label:'En asignación de carga', actor:'DIR_DEPTO', rol:'DIRECTIVO', desc:'Dir. Departamento asigna carga no lectiva'},
  {codigo:'REGISTRADO_OFICIAL', orden:8, label:'Registrado oficialmente', actor:'DIR_CENTRAL_RS', rol:'DIRECTIVO', desc:'Dir. Central registra en padrón oficial'},
  {codigo:'EN_EJECUCION', orden:9, label:'En ejecución', actor:'DOCENTE_RESP', rol:'DOCENTE', desc:'Equipo ejecuta actividades de campo'},
  {codigo:'EN_MONITOREO', orden:10, label:'En monitoreo', actor:'DIR_RS_FACULTAD', rol:'DIRECTIVO', desc:'Dir. RS Facultad monitorea in situ'},
  {codigo:'INFORME_FINAL_PRESENTADO', orden:11, label:'Informe final presentado', actor:'ESTUDIANTE_EJEC', rol:'ESTUDIANTE', desc:'Equipo presenta informe final'},
  {codigo:'CON_CONFORMIDAD_ESCUELA', orden:12, label:'Con conformidad Escuela', actor:'DIR_ESCUELA', rol:'DIRECTIVO', desc:'Dir. Escuela da conformidad'},
  {codigo:'CERRADO', orden:13, label:'Cerrado', actor:'CONSEJO_FACULTAD', rol:'DIRECTIVO', desc:'Consejo emite Resolución de Cierre + constancias'},
  {codigo:'EN_EVALUACION_IMPACTO', orden:14, label:'En evaluación de impacto', actor:'COMITE_CALIDAD', rol:'DIRECTIVO', desc:'Comité Calidad procesa encuestas Likert'},
  {codigo:'EVALUACION_VALIDADA', orden:15, label:'Evaluación validada', actor:'COMITE_CALIDAD', rol:'DIRECTIVO', desc:'Conformidad evaluación con Resolución'},
  {codigo:'REPORTADO_SUNEDU', orden:16, label:'Reportado a SUNEDU', actor:'DIR_CENTRAL_RS', rol:'DIRECTIVO', desc:'Memoria anual → SUNEDU (Ind.29)'},
]

// ── 12 ROLES BPMN (RSU_Rol_Actor) — ficha completa con permisos y pantallas ──
export const ROLES_12 = [
  {codigo:'DOCENTE_RESP', id:1, nombre:'Docente Responsable', tipo:'DOCENTE', global:'DOCENTE', color:'emerald', pantallas:['Proyectos asesorados','Actividades campo','Entregables','Monitoreo'], puede: 'Envía a Escuela, ejecuta campo, presenta informe final'},
  {codigo:'DOCENTE_COLAB', id:2, nombre:'Docente Colaborador', tipo:'DOCENTE', global:'DOCENTE', color:'teal', pantallas:['Proyectos colaborados','Actividades'], puede: 'Apoya ejecución, sube evidencias'},
  {codigo:'ESTUDIANTE_PROP', id:3, nombre:'Estudiante Proponente', tipo:'ESTUDIANTE', global:'ESTUDIANTE', color:'sky', pantallas:['Mi proyecto','Crear Informe Inicial','Justificar falta','Constancias'], puede: 'Propone Informe Inicial, registra cronograma, justifica faltas (máx 2), autoriza imagen'},
  {codigo:'ESTUDIANTE_EJEC', id:4, nombre:'Estudiante Ejecutor', tipo:'ESTUDIANTE', global:'ESTUDIANTE', color:'cyan', pantallas:['Mis proyectos (equipo)','Registro evidencias','Modificar informe','Encuesta docente'], puede: 'Ejecuta actividades, sube fotos (5), asistencia beneficiarios, encuesta asesor'},
  {codigo:'DIR_ESCUELA', id:5, nombre:'Director de Escuela Profesional', tipo:'AUTORIDAD', global:'DIRECTIVO', color:'amber', pantallas:['Viabilidades pendientes','Conformidad informes','Padrón beneficiarios'], puede: 'Da/niega V°B° viabilidad + conformidad final con checklist 5'},
  {codigo:'COMITE_PS', id:6, nombre:'Comité de Proyección Social', tipo:'COMITE', global:'DIRECTIVO', color:'orange', pantallas:['Revisión no duplicidad'], puede: 'Valida alineación Plan RS'},
  {codigo:'DIR_RS_FACULTAD', id:7, nombre:'Director RS Facultad', tipo:'AUTORIDAD', global:'DIRECTIVO', color:'violet', pantallas:['Banco proyectos','Presupuesto y vouchers','Monitoreo campo','Evaluación impacto','Lecciones'], puede: 'Prioriza banco, aprueba vouchers, monitorea % avance, formula lecciones curriculares'},
  {codigo:'CONSEJO_FACULTAD', id:8, nombre:'Consejo de Facultad', tipo:'AUTORIDAD', global:'DIRECTIVO', color:'indigo', pantallas:['Dictámenes','Cierre','Validar evaluación'], puede: 'Emite Resoluciones (aprobación/cierre/evaluación) — validez legal'},
  {codigo:'DIR_DEPTO', id:9, nombre:'Director de Departamento Académico', tipo:'AUTORIDAD', global:'DIRECTIVO', color:'blue', pantallas:['Asignación carga no lectiva'], puede: 'Asigna horas NO_LECTIVA validando carga_max Art.86 (≤8h)'},
  {codigo:'DIR_CENTRAL_RS', id:10, nombre:'Director Central RS / VRA', tipo:'AUTORIDAD', global:'DIRECTIVO', color:'slate', pantallas:['Padrón oficial','Memoria anual','Reportes SUNEDU'], puede: 'Registra padrón oficial, consolida Memoria Anual Ind.29 (2% presupuesto)'},
  {codigo:'UNIDAD_ABAST', id:11, nombre:'Unidad de Abastecimiento', tipo:'ADMINISTRATIVO', global:'DIRECTIVO', color:'zinc', pantallas:['Presupuesto','Vouchers'], puede: 'Verifica Pecosa/Factura, registra EJECUCION/TRANSFERENCIA/DEVOLUCION'},
  {codigo:'COMITE_CALIDAD', id:12, nombre:'Comité de Calidad', tipo:'COMITE', global:'DIRECTIVO', color:'purple', pantallas:['Procesar impacto','Matriz indicadores'], puede: 'Procesa encuestas Likert P01-P06, calcula % logro vs línea base'},
] as const

export function getRolMeta(codigo:string){
  return (ROLES_12 as any).find((r:any)=> r.codigo===codigo) || null
}
export function bandejaParaRol(rol_actor:string, codigo:string){
  const e = ESTADOS.find(x=>x.codigo===codigo)
  if(!e) return false
  return e.actor===rol_actor
}
export function countBandejaParaRol(rol_actor:string){
  return ESTADOS.filter(e=> e.actor===rol_actor).length
}

export function canStudentEdit(codigo:string){
  // HU-004, HU-033: estudiante edita en borrador o cuando observado; aplica a cualquier miembro del equipo
  return ['BORRADOR','INFORME_FINAL_PRESENTADO'].includes(codigo)
}

// ── NUEVO: equipo completo puede actuar aunque no sea líder (HU-010..HU-014, HU-033) ──
export function isStudentMemberOfProject(proyecto:any, userId:number|undefined): boolean {
  if(!proyecto || !userId) return false
  if(proyecto.id_estudiante_lider === userId) return true
  // lista de participantes inyectada en proyecto._participantes o equipo
  const miembros: number[] = proyecto._miembros_ids || proyecto.miembros_ids || []
  if(miembros.includes(userId)) return true
  return false
}

// ── Aislamiento estudiante: solo ve sus proyectos (líder o miembro ACTIVO) ──
export function shouldIsolateEstudiante(user:any): boolean {
  return user?.rol==='ESTUDIANTE'
}
export function estudianteProyectosEndpoint(userId:number, search=''){
  const q = new URLSearchParams()
  if(search) q.set('search', search)
  q.set('page','1'); q.set('limit','20')
  return `/api/v1/estudiantes/${userId}/proyectos?${q.toString()}`
}

// cualquier miembro del equipo (líder o participante ACTIVO/INSCRITO) puede subir docs/actividades/entregables
export function canStudentUploadDocs(codigoEstado:string, user:any, proyecto:any, esMiembro:boolean){
  if(!user || user.rol!=='ESTUDIANTE') return false
  if(!esMiembro) return false
  // no puede subir en estados finales cerrados/reportados
  if(['CERRADO','REPORTADO_SUNEDU','EVALUACION_VALIDADA'].includes(codigoEstado)) return false
  return true
}

export function canStudentRegisterActivity(codigo:string, esMiembro:boolean){
  if(!esMiembro) return false
  return ['EN_EJECUCION','EN_MONITOREO'].includes(codigo)
}

// ── Visibilidad de pantallas por rol_actor (12) — Sidebar + Guard ──
export function canAccessRoute(rol_actor:string, path:string): boolean {
  const p = path.toLowerCase()
  // estudiante: solo mis-proyectos, no /proyectos (todos)
  if(rol_actor==='ESTUDIANTE_PROP' || rol_actor==='ESTUDIANTE_EJEC'){
    if(p==='/proyectos' || p.startsWith('/proyectos?')) return false // redirige a /mis-proyectos
    if(p==='/bandeja') return false
    if(p.startsWith('/presupuesto') || p.startsWith('/reportes') || p.startsWith('/estructura')) return false
  }
  // docente responsable/colab: no ve bandeja directiva, pero ve sus proyectos asesorados
  if(rol_actor==='DOCENTE_RESP' || rol_actor==='DOCENTE_COLAB'){
    if(p==='/' || p.startsWith('/bandeja') || p.startsWith('/reportes/sunedu')) {
      // docente usa su dashboard, no bandeja general
      // permitimos /bandeja solo si lo mapeamos a sus estados (EN_EJECUCION)
    }
  }
  // comité calidad solo ve impacto
  // dir central solo ve reportes etc — por defecto todo directivo ve
  return true
}

// Labels cortos para badge rol
export function rolBadgeLabel(rol_actor:string){
  const m:any = getRolMeta(rol_actor)
  if(!m) return rol_actor
  return m.nombre
}
