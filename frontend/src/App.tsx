import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { RoleSidebar } from './components/layout/RoleSidebar'
import { Header } from './components/layout/Header'
import { RequireAuth } from './components/RoleGuard'
import Login from './pages/Login'
import Proyectos from './pages/Proyectos'
import ProyectoDetalle from './pages/ProyectoDetalle'
import Beneficiarios from './pages/Beneficiarios'
import Estructura from './pages/Estructura'
import Placeholder from './pages/Placeholder'
import EstudianteDashboard from './pages/roles/EstudianteDashboard'
import DocenteDashboard from './pages/roles/DocenteDashboard'
import DirectivoDashboard from './pages/roles/DirectivoDashboard'
import Bandeja from './pages/Bandeja'
import CrearProyecto from './pages/CrearProyecto'
import Presupuesto from './pages/Presupuesto'
import Actividades from './pages/Actividades'
import Documentos from './pages/Documentos'
import Monitoreo from './pages/Monitoreo'
import Encuestas from './pages/Encuestas'
import Reportes from './pages/Reportes'
import Catalogos from './pages/Catalogos'
import Personas from './pages/Personas'
import DocenteCarga from './pages/DocenteCarga'
import DocenteEntregables from './pages/DocenteEntregables'
import EstudianteHoras from './pages/EstudianteHoras'
import EstudianteConstancias from './pages/EstudianteConstancias'
import Fases from './pages/estudiante/Fases'
import Ejecucion from './pages/estudiante/Ejecucion'
import Evidencias from './pages/estudiante/Evidencias'
import ModificarInforme from './pages/estudiante/ModificarInforme'
import Justificacion from './pages/estudiante/Justificacion'
import EncuestaDocente from './pages/estudiante/EncuestaDocente'
import AutorizacionImagen from './pages/estudiante/AutorizacionImagen'

function HomeRouter(){
  const {user} = useAuth()
  if(!user) return <Navigate to="/login" replace/>
  if(user.rol==='ESTUDIANTE') return <EstudianteDashboard/>
  if(user.rol==='DOCENTE') return <DocenteDashboard/>
  return <DirectivoDashboard/>
}

function AppShell(){
  const {user} = useAuth()
  if(!user) return <Login/>
  return (
    <div className="flex min-h-screen">
      <RoleSidebar/>
      <div className="flex-1 min-w-0 flex flex-col">
        <Header/>
        <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<HomeRouter/>}/>
            <Route path="/mis-proyectos" element={<Proyectos/>}/>
            <Route path="/proyectos" element={<Proyectos/>}/>
            <Route path="/proyectos/nuevo" element={<CrearProyecto/>}/>
            <Route path="/proyectos/:id" element={<ProyectoDetalle/>}/>
            <Route path="/fases" element={<Fases/>}/>
            <Route path="/ejecucion" element={<Ejecucion/>}/>
            <Route path="/evidencias" element={<Evidencias/>}/>
            <Route path="/modificar-informe" element={<ModificarInforme/>}/>
            <Route path="/justificacion" element={<Justificacion/>}/>
            <Route path="/encuesta-docente" element={<EncuestaDocente/>}/>
            <Route path="/autorizacion-imagen" element={<AutorizacionImagen/>}/>
            <Route path="/solicitud-constancia" element={<EstudianteConstancias/>}/>
            <Route path="/bandeja" element={<Bandeja/>}/>
            <Route path="/beneficiarios" element={<Beneficiarios/>}/>
            <Route path="/estructura" element={<Estructura/>}/>
            <Route path="/personas" element={<Personas/>}/>
            <Route path="/actividades" element={<Actividades/>}/>
            <Route path="/docente/carga" element={<DocenteCarga/>}/>
            <Route path="/docente/proyectos" element={<Proyectos/>}/>
            <Route path="/docente/entregables" element={<DocenteEntregables/>}/>
            <Route path="/estudiante/horas" element={<EstudianteHoras/>}/>
            <Route path="/estudiante/constancias" element={<EstudianteConstancias/>}/>
            <Route path="/monitoreo" element={<Monitoreo/>}/>
            <Route path="/presupuesto" element={<Presupuesto/>}/>
            <Route path="/encuestas" element={<Encuestas/>}/>
            <Route path="/reportes" element={<Reportes/>}/>
            <Route path="/documentos" element={<Documentos/>}/>
            <Route path="/catalogos" element={<Catalogos/>}/>
            <Route path="*" element={<Placeholder title="404" desc="Página no encontrada"/>}/>
          </Routes>
        </main>
        <footer className="px-6 py-3 text-xs text-slate-400 border-t border-slate-200 bg-white">UNDC · Cañete, Lima — © 2026</footer>
      </div>
    </div>
  )
}

export default function App(){
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginWrapper/>}/>
          <Route path="/*" element={<RequireAuth><AppShell/></RequireAuth>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
function LoginWrapper(){
  const {user} = useAuth()
  if(user) return <Navigate to="/" replace/>
  return <Login/>
}
