import { Navigate } from 'react-router-dom'
import { useAuth, RolGlobal } from '../context/AuthContext'

export function RequireAuth({children}:{children:React.ReactNode}){
  const {user} = useAuth()
  if(!user) return <Navigate to="/login" replace/>
  return <>{children}</>
}
export function RequireRole({roles, children}:{roles:RolGlobal[], children:React.ReactNode}){
  const {user} = useAuth()
  if(!user) return <Navigate to="/login" replace/>
  if(!roles.includes(user.rol) && user.rol!=='ADMIN') return <Navigate to="/" replace/>
  return <>{children}</>
}
