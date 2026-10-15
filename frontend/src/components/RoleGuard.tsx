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
  if(!roles.includes(user.rol) && user.rol!=='ADMIN') return <Navigate to="/" replace/>
  return <>{children}</>
}
