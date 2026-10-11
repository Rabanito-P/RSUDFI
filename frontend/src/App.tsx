import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LayoutProvider } from './context/LayoutContext'
import { RoleSidebar } from './components/layout/RoleSidebar'
import { Header } from './components/layout/Header'
import { RequireAuth } from './components/RoleGuard'
import { Skeleton } from './components/ui/Skeleton'
import Login from './pages/Login'
import EstudianteDashboard from './pages/roles/EstudianteDashboard'
import DocenteDashboard from './pages/roles/DocenteDashboard'
import DirectivoDashboard from './pages/roles/DirectivoDashboard'
import Proyectos from './pages/Proyectos'
import ProyectoDetalle from './pages/ProyectoDetalle'
import Beneficiarios from './pages/Beneficiarios'
import Bandeja from './pages/Bandeja'
import CrearProyecto from './pages/CrearProyecto'
import Presupuesto from './pages/Presupuesto'
import Actividades from './pages/Actividades'
import Encuestas from './pages/Encuestas'
import Reportes from './pages/Reportes'
import Monitoreo from './pages/Monitoreo'

// ── Rutas secundarias: se cargan bajo demanda (code-splitting) ──
const Estructura = lazy(() => import('./pages/Estructura'))
const Placeholder = lazy(() => import('./pages/Placeholder'))
const Documentos = lazy(() => import('./pages/Documentos'))
const Catalogos = lazy(() => import('./pages/Catalogos'))
const Administracion = lazy(() => import('./pages/Administracion'))
const Personas = lazy(() => import('./pages/Personas'))
const DocenteCarga = lazy(() => import('./pages/DocenteCarga'))
const DocenteEntregables = lazy(() => import('./pages/DocenteEntregables'))
const EstudianteHoras = lazy(() => import('./pages/EstudianteHoras'))
const EstudianteConstancias = lazy(() => import('./pages/EstudianteConstancias'))
const Fases = lazy(() => import('./pages/estudiante/Fases'))
const Ejecucion = lazy(() => import('./pages/estudiante/Ejecucion'))
const Evidencias = lazy(() => import('./pages/estudiante/Evidencias'))
const ModificarInforme = lazy(() => import('./pages/estudiante/ModificarInforme'))
const Justificacion = lazy(() => import('./pages/estudiante/Justificacion'))
const EncuestaDocente = lazy(() => import('./pages/estudiante/EncuestaDocente'))
const AutorizacionImagen = lazy(() => import('./pages/estudiante/AutorizacionImagen'))

function RouteFallback(){
  return (
    <div className="space-y-4 animate-fade-in">
      <Skeleton className="h-10 w-64"/>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-24"/><Skeleton className="h-24"/><Skeleton className="h-24"/>
      </div>
      <Skeleton className="h-64 w-full"/>
    </div>
  )
}

function HomeRouter(){
  const {user} = useAuth()
  if(!user) return <Navigate to="/login" replace/>
  if(user.rol==='ESTUDIANTE') return <EstudianteDashboard/>
  if(user.rol==='DOCENTE') return <DocenteDashboard/>
  return <DirectivoDashboard/>
}

function AppShell(){
  const {user, ready} = useAuth()
  // Mientras se valida la sesión contra el servidor NO se decide nada: si se
  // renderiza antes de tener el usuario, un F5 en una ruta profunda
  // (/administracion, /proyectos/3...) caía a "/" al resolverse el guard.
  if(!ready) return <RouteFallback/>
  if(!user) return <Login/>
  return (
    /* Layout de aplicación: alto fijo, la barra lateral y la cabecera no se
       mueven y solo el contenido hace scroll. Antes el <main> llevaba
       overflow-x-hidden dentro de una página que scrolleaba completa, lo que
       provocaba saltos y recortes al desplazar. */
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <RoleSidebar/>
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Header/>
        <main className="flex-1 p-4 sm:p-6 w-full max-w-[1600px] mx-auto overflow-y-auto overscroll-contain">
          <Suspense fallback={<RouteFallback/>}>
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
              <Route path="/facultad/entregables" element={<DocenteEntregables/>}/>
              <Route path="/estudiante/horas" element={<EstudianteHoras/>}/>
              <Route path="/estudiante/constancias" element={<EstudianteConstancias/>}/>
              <Route path="/monitoreo" element={<Monitoreo/>}/>
              <Route path="/presupuesto" element={<Presupuesto/>}/>
              <Route path="/encuestas" element={<Encuestas/>}/>
              <Route path="/reportes" element={<Reportes/>}/>
              <Route path="/documentos" element={<Documentos/>}/>
              <Route path="/catalogos" element={<Catalogos/>}/>
            <Route path="/administracion" element={<Administracion/>}/>
              <Route path="*" element={<Placeholder title="404" desc="Página no encontrada"/>}/>
            </Routes>
          </Suspense>
        </main>
        <footer className="px-4 sm:px-6 py-3 text-[11px] sm:text-xs text-slate-400 border-t border-slate-200 bg-white">UNDC · Cañete, Lima — Sistema RSU · Ley 30220 Art. 124-125</footer>
      </div>
    </div>
  )
}

export default function App(){
  return (
    <AuthProvider>
      <LayoutProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginWrapper/>}/>
            <Route path="/*" element={<RequireAuth><AppShell/></RequireAuth>}/>
          </Routes>
        </BrowserRouter>
      </LayoutProvider>
    </AuthProvider>
  )
}
function LoginWrapper(){
  const {user} = useAuth()
  if(user) return <Navigate to="/" replace/>
  return <Login/>
}
