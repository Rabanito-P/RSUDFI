import { Navigate } from 'react-router-dom'
import { useAuth, RolGlobal } from '../context/AuthContext'
import { Skeleton } from './ui/Skeleton'

export function RequireAuth({children}:{children:React.ReactNode}){
  const {user, ready} = useAuth()
  // Mientras la sesión se valida contra el servidor NO se decide nada: el
  // contexto expone user=null hasta que ready es true, así que redirigir aquí
  // dejaba cualquier F5 o enlace directo (/administracion, /proyectos/3...)
  // rebotando a /login y de allí al Home en lugar de la página pedida.
  if(!ready) return <Skeleton className="h-screen w-full"/>
  if(!user) return <Navigate to="/login" replace/>
  return <>{children}</>
}
export function RequireRole({roles, children}:{roles:RolGlobal[], children:React.ReactNode}){
  const {user, ready} = useAuth()
  if(!ready) return <Skeleton className="h-screen w-full"/>
  if(!user) return <Navigate to="/login" replace/>
  // Si el rol no corresponde se muestra el 404 y no se redirige: el backend
  // responde 404 cuando el módulo no está habilitado, y la interfaz debe
  // contar la misma historia para no revelar la existencia de la sección.
  if(!roles.includes(user.rol) && user.rol!=='ADMIN') return <RutaNoEncontrada/>
  return <>{children}</>
}

// RutaNoEncontrada es la pantalla que el usuario ve cuando su rol no tiene
// acceso. Reemplaza al 404 genérico para poder explicarlo.
function RutaNoEncontrada(){
  const {user} = useAuth()
  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <div className="max-w-md text-center space-y-3">
        <div className="text-6xl font-black text-slate-200 leading-none">404</div>
        <h2 className="text-lg font-black text-slate-700">Sección no disponible para tu rol</h2>
        <p className="text-sm text-slate-500">
          Esta sección no está habilitada para tu rol
          {user ? ` (${user.rol})` : ''}. Si crees que deberías verla, solicítalo a la
          Facultad de Ingeniería: el administrador puede habilitar el módulo.
        </p>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50"
        >
          Volver
        </button>
      </div>
    </div>
  )
}
