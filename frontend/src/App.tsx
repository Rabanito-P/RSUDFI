import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LayoutProvider } from './context/LayoutContext'
import { RoleSidebar } from './components/layout/RoleSidebar'
import { Header } from './components/layout/Header'
import { RequireAuth, RequireRole } from './components/RoleGuard'
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
// Fase 1 · Creación (HU-F1)
const BucleAsesor = lazy(() => import('./pages/BucleAsesor'))
const FormatosDRSU = lazy(() => import('./pages/FormatosDRSU'))

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
              <Route path="/proyectos/nuevo" element={<RequireRole roles={['ESTUDIANTE']}><CrearProyecto/></RequireRole>}/>
              <Route path="/proyectos/:id" element={<ProyectoDetalle/>}/>
              <Route path="/fases" element={<RequireRole roles={['ESTUDIANTE']}><Fases/></RequireRole>}/>
              <Route path="/ejecucion" element={<RequireRole roles={['ESTUDIANTE']}><Ejecucion/></RequireRole>}/>
              <Route path="/evidencias" element={<RequireRole roles={['ESTUDIANTE']}><Evidencias/></RequireRole>}/>
              <Route path="/modificar-informe" element={<RequireRole roles={['ESTUDIANTE']}><ModificarInforme/></RequireRole>}/>
              <Route path="/justificacion" element={<RequireRole roles={['ESTUDIANTE']}><Justificacion/></RequireRole>}/>
              <Route path="/encuesta-docente" element={<RequireRole roles={['ESTUDIANTE']}><EncuestaDocente/></RequireRole>}/>
              <Route path="/autorizacion-imagen" element={<RequireRole roles={['ESTUDIANTE']}><AutorizacionImagen/></RequireRole>}/>
              <Route path="/solicitud-constancia" element={<RequireRole roles={['ESTUDIANTE']}><EstudianteConstancias/></RequireRole>}/>
              <Route path="/bandeja" element={<RequireRole roles={['DIRECTIVO']}><Bandeja/></RequireRole>}/>
              <Route path="/beneficiarios" element={<RequireRole roles={['DOCENTE','DIRECTIVO']}><Beneficiarios/></RequireRole>}/>
              <Route path="/estructura" element={<RequireRole roles={['DIRECTIVO']}><Estructura/></RequireRole>}/>
              <Route path="/personas" element={<RequireRole roles={['DIRECTIVO']}><Personas/></RequireRole>}/>
              <Route path="/actividades" element={<RequireRole roles={['DOCENTE','DIRECTIVO']}><Actividades/></RequireRole>}/>
              <Route path="/docente/carga" element={<RequireRole roles={['DOCENTE']}><DocenteCarga/></RequireRole>}/>
              {/* HU-F1-04: bucle de aceptación/rechazo del docente asesor */}
              <Route path="/docente/asesorias" element={<RequireRole roles={['DOCENTE']}><BucleAsesor/></RequireRole>}/>
              {/* HU-F1-08: catálogo de formatos oficiales DRSU */}
              <Route path="/formatos-drsu" element={<FormatosDRSU/>}/>
              <Route path="/docente/proyectos" element={<RequireRole roles={['DOCENTE']}><Proyectos/></RequireRole>}/>
              <Route path="/docente/entregables" element={<RequireRole roles={['DOCENTE']}><DocenteEntregables/></RequireRole>}/>
              <Route path="/facultad/entregables" element={<RequireRole roles={['DIRECTIVO']}><DocenteEntregables/></RequireRole>}/>
              <Route path="/estudiante/horas" element={<RequireRole roles={['ESTUDIANTE']}><EstudianteHoras/></RequireRole>}/>
              <Route path="/estudiante/constancias" element={<RequireRole roles={['ESTUDIANTE']}><EstudianteConstancias/></RequireRole>}/>
              <Route path="/monitoreo" element={<RequireRole roles={['DOCENTE','DIRECTIVO']}><Monitoreo/></RequireRole>}/>
              <Route path="/presupuesto" element={<RequireRole roles={['DOCENTE','DIRECTIVO']}><Presupuesto/></RequireRole>}/>
              <Route path="/encuestas" element={<RequireRole roles={['DOCENTE','DIRECTIVO']}><Encuestas/></RequireRole>}/>
              <Route path="/reportes" element={<RequireRole roles={['DIRECTIVO']}><Reportes/></RequireRole>}/>
              <Route path="/documentos" element={<RequireRole roles={['ESTUDIANTE','DOCENTE','DIRECTIVO']}><Documentos/></RequireRole>}/>
              <Route path="/catalogos" element={<RequireRole roles={['DIRECTIVO']}><Catalogos/></RequireRole>}/>
            <Route path="/administracion" element={<RequireRole roles={['ADMIN']}><Administracion/></RequireRole>}/>
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
