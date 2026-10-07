import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Users2, Building2, GraduationCap, FileText, BarChart3, Settings, ClipboardList, HeartHandshake, Wallet } from 'lucide-react'

const nav = [
  {to:'/', label:'Dashboard', icon: LayoutDashboard},
  {to:'/proyectos', label:'Proyectos RSU', icon: FolderKanban},
  {to:'/beneficiarios', label:'Beneficiarios', icon: HeartHandshake},
  {to:'/actividades', label:'Actividades', icon: ClipboardList},
  {to:'/presupuesto', label:'Presupuesto', icon: Wallet},
  {to:'/encuestas', label:'Impacto / Encuestas', icon: BarChart3},
  {to:'/estructura', label:'Estructura UNDC', icon: Building2},
  {to:'/personas', label:'Docentes & Estudiantes', icon: GraduationCap},
  {to:'/documentos', label:'Documentos', icon: FileText},
  {to:'/catalogos', label:'Catálogos', icon: Settings},
]

export function Sidebar(){
  return (
    <aside className="w-[270px] shrink-0 bg-undc-700 text-white flex flex-col min-h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-undc-700">U</div>
          <div>
            <div className="font-extrabold leading-none">UNDC</div>
            <div className="text-xs opacity-80">RSU — Cañete</div>
          </div>
        </div>
        <div className="mt-3 text-[11px] opacity-70 leading-tight">Ley 30220 · Art 124-125<br/>SUNEDU Ind.29 · SINEACE Est.25</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(n=>(
          <NavLink key={n.to} to={n.to} className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive?'bg-white text-undc-700 shadow':'text-white/80 hover:bg-white/10 hover:text-white'}`}>
            <n.icon size={18}/>{n.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="rounded-xl bg-white/10 p-3 text-xs leading-tight">
          <div className="font-semibold">Responsabilidad Social Universitaria</div>
          <div className="opacity-70 mt-1">Sistema integral de proyección social y extensión</div>
        </div>
      </div>
    </aside>
  )
}
