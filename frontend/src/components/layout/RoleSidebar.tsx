import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLayout } from '../../context/LayoutContext'
import { actorLegible, rolDeActor } from '../../lib/roles'
import { LayoutDashboard, FolderKanban, Users2, Building2, GraduationCap, FileText, BarChart3, Settings, ClipboardList, HeartHandshake, Wallet, CheckCircle, ClipboardCheck , Clock3, Play, RotateCcw, FileEdit, ShieldCheck, Camera, Award, X, UserCog } from 'lucide-react'

export function RoleSidebar(){
  const {user} = useAuth()
  const { menuOpen, setMenuOpen } = useLayout()
  if(!user) return null

  // ── Menú estudiante — 8 secciones verdes #0f2b24 ──
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
    {to:'/facultad/entregables', label:'Entregables', icon: CheckCircle, badge:'•', desc:'Ver y corregir'},
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

  // Navegación por rol de negocio (6 roles UNDC). El switch fino por rol_actor
  // solo ajusta etiquetas de autoridad; las secciones son las del rol.
  let nav: any[] = []
  const negocio = rolDeActor(user.rol_actor)
  if(negocio==='ESTUDIANTE'){
    nav = estudiantePropNav
  } else if(negocio==='DOCENTE'){
    nav = docenteNav
  } else if(negocio==='CONSEJO'){
    nav = consejoNav
  } else if(negocio==='ESCUELA'){
    nav = dirEscuelaNav
  } else if(negocio==='FACULTAD'){
    nav = user.rol_actor==='DIR_RS_FACULTAD' ? dirRSFacultadNav : dirCentralNav
  } else {
    nav = directivoGenericNav
  }

  // El administrador ve todo lo anterior más el panel de usuarios y funciones.
  if(negocio==='ADMIN'){
    nav = [...directivoGenericNav,
      {to:'/administracion', label:'Usuarios y funciones', icon: UserCog, desc:'Altas · accesos · módulos'},
    ]
  }

  const roleColor = user.rol==='ESTUDIANTE'?'bg-sky-600':user.rol==='DOCENTE'?'bg-emerald-600':user.rol==='ADMIN'?'bg-violet-600':'bg-undc-700'
  // Etiqueta legible del rol de negocio (6 roles UNDC), nunca el código crudo.
  const roleLabel = actorLegible(user.rol_actor)

  const isEstudiante = user.rol==='ESTUDIANTE'
  const sidebarBg = isEstudiante ? 'bg-[#0f2b24]' : 'bg-slate-900'
  const activeClass = isEstudiante ? 'bg-[#1a9e6a] text-white shadow-md' : 'bg-white text-slate-900 shadow-md'

  // Al navegar desde el drawer móvil, se cierra para no tapar la pantalla.
  const handleClick = () => { if (window.innerWidth < 1024) setMenuOpen(false) }

  // Escape cierra el drawer en móvil.
  useEffect(() => {
    if (!menuOpen) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [menuOpen, setMenuOpen])

  const sidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/logo-undc.svg" alt="UNDC — Facultad de Ingeniería"
                 className="w-11 h-11 rounded-xl bg-white shrink-0"/>
            <div className="min-w-0">
              <div className="font-black tracking-tight leading-none text-sm">UNDC RSU</div>
              <div className="text-[11px] opacity-80 leading-tight">Responsabilidad<br/>Social Universitaria</div>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="ml-auto lg:hidden p-2 rounded-xl hover:bg-white/10 text-white/80"
              aria-label="Cerrar menú"
            >
              <X size={18}/>
            </button>
          </div>
          {isEstudiante && <div className="mt-3 text-[11px] opacity-60 truncate">{user.nombre?.split(' ')[0]} · {user.rol_actor}</div>}
          {!isEstudiante && <div className={`mt-3 inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-sm ${roleColor} truncate max-w-full`}>{roleLabel}</div>}
        </div>

        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto overscroll-contain">
          {nav.map(n=>(
            <NavLink key={n.to} to={n.to} onClick={handleClick} className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${isActive ? activeClass : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
              <n.icon size={18} className="shrink-0"/>
              <span className="flex-1 leading-tight truncate">{n.label}</span>
              {(n as any).badge && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shrink-0">{(n as any).badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="text-[10px] leading-tight opacity-50 px-1">UNDC Cañete · Sistema RSU · Ley 30220</div>
        </div>
    </>
  )

  return (
    <>
      {/* ── Móvil / tablet: drawer deslizante con fondo oscuro ── */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] ${sidebarBg} text-white flex flex-col shrink-0
          transform transition-transform duration-300 ease-out lg:transition-none lg:static lg:translate-x-0 lg:w-[288px]
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isEstudiante ? 'border-r border-white/10' : ''}`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
