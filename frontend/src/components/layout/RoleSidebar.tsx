import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, FolderKanban, Users2, Building2, GraduationCap, FileText, BarChart3, Settings, ClipboardList, HeartHandshake, Wallet, CheckCircle, ClipboardCheck, LogOut, Clock3, Play, RotateCcw, FileEdit, ShieldCheck, Camera, Award } from 'lucide-react'

export function RoleSidebar(){
  const {user, logout} = useAuth()
  if(!user) return null

  // ── Menú estudiante exacto Image1 — 8 secciones verdes #0f2b24 ──
  const estudianteMenu = [
    {to:'/fases', label:'Fases del proyecto', icon: Clock3, desc:'Resumen y avances'},
    {to:'/ejecucion', label:'Ejecución proyecto', icon: Play, desc:'Entregables por subir'},
    {to:'/evidencias', label:'Registro de evidencias', icon: RotateCcw, desc:'Actividades y fotos'},
    {to:'/modificar-informe', label:'Modificar Informe Inicial', icon: FileEdit, desc:'Solicitudes de cambio'},
    {to:'/justificacion', label:'Justificación de Faltas', icon: ShieldCheck, desc:'Hasta 2 faltas'},
    {to:'/encuesta-docente', label:'Encuesta docente', icon: ClipboardList, desc:'Evalúa a tu asesor'},
    {to:'/autorizacion-imagen', label:'Autorización imagen', icon: Camera, desc:'Consentimiento'},
    {to:'/solicitud-constancia', label:'Solicitud constancia', icon: Award, desc:'Constancias'},
  ]
  const estudiantePropNav = estudianteMenu
  const estudianteEjecNav = estudianteMenu
  const docenteNav = [
    {to:'/', label:'Inicio docente', icon: LayoutDashboard, desc:'Carga y asesorías'},
    {to:'/docente/proyectos', label:'Proyectos asesorados', icon: FolderKanban, desc:'Donde soy asesor'},
    {to:'/docente/carga', label:'Mi carga', icon: Wallet, desc:'Horas asignadas'},
    {to:'/actividades', label:'Actividades', icon: ClipboardList, desc:'Campo'},
    {to:'/docente/entregables', label:'Entregables', icon: CheckCircle, desc:'Verificar'},
    {to:'/encuestas', label:'Encuestas', icon: BarChart3, desc:'Satisfacción'},
    {to:'/monitoreo', label:'Monitoreo', icon: ClipboardCheck, desc:'Avance'},
  ]
  // Directivo fino por rol_actor (12) — sin tecnicismos legales en desc
  const dirEscuelaNav = [
    {to:'/', label:'Dashboard Escuela', icon: LayoutDashboard, desc:'Director'},
    {to:'/bandeja', label:'Pendientes por revisar', icon: ClipboardCheck, badge:'•', desc:'Por aprobar'},
    {to:'/bandeja?rol=DIR_ESCUELA&only=conformidad', label:'Conformidad', icon: CheckCircle, desc:'Informes finales'},
    {to:'/proyectos', label:'Proyectos', icon: FolderKanban, desc:'De mi escuela'},
    {to:'/beneficiarios', label:'Beneficiarios', icon: HeartHandshake, desc:'Padrón'},
    {to:'/reportes', label:'Reportes', icon: BarChart3, desc:'Resumen'},
  ]
  const dirRSFacultadNav = [
    {to:'/', label:'Dashboard Facultad', icon: LayoutDashboard, desc:'Director RS'},
    {to:'/bandeja', label:'Banco de proyectos', icon: FolderKanban, badge:'•', desc:'Priorizar'},
    {to:'/presupuesto', label:'Presupuesto', icon: Wallet, desc:'Pagos y vouchers'},
    {to:'/monitoreo', label:'Monitoreo', icon: CheckCircle, desc:'Avance'},
    {to:'/encuestas', label:'Evaluación', icon: BarChart3, desc:'Satisfacción'},
    {to:'/proyectos', label:'Proyectos', icon: Building2, desc:'Facultad'},
  ]
  const consejoNav = [
    {to:'/', label:'Dashboard Consejo', icon: LayoutDashboard, desc:'Consejo'},
    {to:'/bandeja', label:'Dictámenes', icon: ClipboardCheck, badge:'•', desc:'Por dictaminar'},
    {to:'/bandeja?rol=CONSEJO_FACULTAD&only=cierre', label:'Cierres', icon: FileText, desc:'Por cerrar'},
    {to:'/proyectos', label:'Proyectos', icon: FolderKanban, desc:'En cierre'},
    {to:'/reportes', label:'Resoluciones', icon: Settings, desc:'Documentos'},
  ]
  const dirDeptoNav = [
    {to:'/', label:'Dashboard', icon: LayoutDashboard, desc:'Departamento'},
    {to:'/bandeja', label:'Cargas', icon: Wallet, badge:'•', desc:'Por asignar'},
    {to:'/docente/carga', label:'Carga docente', icon: ClipboardList, desc:'Horas'},
    {to:'/proyectos', label:'Proyectos', icon: FolderKanban, desc:'Vigentes'},
  ]
  const dirCentralNav = [
    {to:'/', label:'Dashboard Central', icon: LayoutDashboard, desc:'RSU Central'},
    {to:'/bandeja', label:'Padrón oficial', icon: FileText, badge:'•', desc:'Registro'},
    {to:'/reportes', label:'Memoria Anual', icon: BarChart3, desc:'Anual'},
    {to:'/presupuesto', label:'Presupuesto', icon: Wallet, desc:'Institucional'},
    {to:'/proyectos', label:'Proyectos', icon: Building2, desc:'Todos'},
  ]
  const abastecNav = [
    {to:'/', label:'Panel', icon: LayoutDashboard, desc:'Abastecimiento'},
    {to:'/bandeja', label:'Vouchers', icon: Wallet, badge:'•', desc:'Por verificar'},
    {to:'/presupuesto', label:'Ejecución', icon: FileText, desc:'Comprobantes'},
    {to:'/proyectos', label:'Proyectos', icon: FolderKanban, desc:'Activos'},
  ]
  const calidadNav = [
    {to:'/', label:'Panel', icon: LayoutDashboard, desc:'Calidad'},
    {to:'/bandeja', label:'Evaluaciones', icon: BarChart3, badge:'•', desc:'Por procesar'},
    {to:'/encuestas', label:'Encuestas', icon: ClipboardList, desc:'Resultados'},
    {to:'/reportes', label:'Indicadores', icon: Settings, desc:'Matriz'},
  ]
  const directivoGenericNav = [
    {to:'/', label:'Panel', icon: LayoutDashboard, desc:'General'},
    {to:'/bandeja', label:'Bandeja', icon: ClipboardCheck, badge:'•', desc:'Pendientes'},
    {to:'/proyectos', label:'Proyectos', icon: FolderKanban, desc:'Todos'},
    {to:'/presupuesto', label:'Presupuesto', icon: Wallet, desc:'Finanzas'},
    {to:'/monitoreo', label:'Monitoreo', icon: CheckCircle, desc:'Seguimiento'},
    {to:'/encuestas', label:'Encuestas', icon: BarChart3, desc:'Satisfacción'},
    {to:'/reportes', label:'Reportes', icon: FileText, desc:'Anual'},
    {to:'/estructura', label:'Estructura', icon: Building2, desc:'Escuelas'},
    {to:'/personas', label:'Personas', icon: GraduationCap, desc:'Registro'},
    {to:'/catalogos', label:'Catálogos', icon: Settings, desc:'Config'},
    {to:'/documentos', label:'Documentos', icon: FileText, desc:'Archivo'},
  ]

  let nav: any[] = []
  if(user.rol==='ESTUDIANTE'){
    nav = user.rol_actor==='ESTUDIANTE_PROP' ? estudiantePropNav : estudianteEjecNav
    // ejec autor usa Prop si es ambos; por defecto prop
    if(user.rol_actor!=='ESTUDIANTE_PROP' && user.rol_actor!=='ESTUDIANTE_EJEC') nav = estudiantePropNav
  } else if(user.rol==='DOCENTE'){
    nav = docenteNav
  } else {
    // directivo: mapea fino por rol_actor (12)
    switch(user.rol_actor){
      case 'DIR_ESCUELA': nav = dirEscuelaNav; break
      case 'DIR_RS_FACULTAD': nav = dirRSFacultadNav; break
      case 'CONSEJO_FACULTAD': nav = consejoNav; break
      case 'DIR_DEPTO': nav = dirDeptoNav; break
      case 'DIR_CENTRAL_RS': nav = dirCentralNav; break
      case 'UNIDAD_ABAST': nav = abastecNav; break
      case 'COMITE_CALIDAD': nav = calidadNav; break
      case 'COMITE_PS': nav = [{to:'/', label:'Panel Comité PS', icon: LayoutDashboard, desc:'Proyección Social'}, ...dirEscuelaNav.slice(1)]; break
      default: nav = directivoGenericNav
    }
  }

  const roleColor = user.rol==='ESTUDIANTE'?'bg-sky-600':user.rol==='DOCENTE'?'bg-emerald-600':user.rol==='ADMIN'?'bg-violet-600':'bg-undc-700'
  const roleLabel = `${user.rol_actor} · ${user.tipo_actor}`

  const isEstudiante = user.rol==='ESTUDIANTE'
  const sidebarBg = isEstudiante ? 'bg-[#0f2b24]' : 'bg-slate-900'
  const activeClass = isEstudiante ? 'bg-[#1a9e6a] text-white shadow-md' : 'bg-white text-slate-900 shadow-md'
  return (
    <aside className={`w-[288px] shrink-0 ${sidebarBg} text-white flex flex-col min-h-screen sticky top-0 overflow-hidden`}>
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white grid place-items-center overflow-hidden">
            <span className="font-black text-[#0f2b24] text-sm leading-none">UNDC<br/><span className="text-[9px]">RSU</span></span>
          </div>
          <div>
            <div className="font-black tracking-tight leading-none text-sm">UNDC</div>
            <div className="text-[11px] opacity-80 leading-tight">Responsabilidad<br/>Social Universitaria</div>
          </div>
        </div>
        {isEstudiante && <div className="mt-3 text-[11px] opacity-60">{user.nombre?.split(' ')[0]} · {user.rol_actor}</div>}
        {!isEstudiante && <div className={`mt-3 inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-sm ${roleColor}`}>{roleLabel}</div>}
      </div>



      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {nav.map(n=>(
          <NavLink key={n.to} to={n.to} className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${isActive ? activeClass : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
            <n.icon size={18} className="shrink-0"/>
            <span className="flex-1 leading-tight">{n.label}</span>
            {(n as any).badge && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{(n as any).badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-2">
        <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold transition-colors"><LogOut size={16}/> Cerrar sesión</button>
      </div>
    </aside>
  )
}
