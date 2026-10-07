import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'

export type RolGlobal = 'ESTUDIANTE'|'DOCENTE'|'DIRECTIVO'|'ADMIN'
export interface User {
  id:number
  nombre:string
  correo:string
  rol: RolGlobal
  rol_actor:string // CODIGO RSU_Rol_Actor
  rol_actor_id:number
  tipo_actor:string
  token:string
}

interface Ctx {
  user: User | null
  login: (correo:string, password:string)=>Promise<void>
  logout: ()=>void
  isEstudiante: boolean
  isDocente: boolean
  isDirectivo: boolean
  isAdmin: boolean
}

const AuthCtx = createContext<Ctx>(null as any)

export function AuthProvider({children}:{children:React.ReactNode}){
  const [user,setUser]=useState<User|null>(()=>{
    try{ const s=localStorage.getItem('undc_user'); return s? JSON.parse(s): null }catch{return null}
  })
  useEffect(()=>{
    if(user) localStorage.setItem('undc_user', JSON.stringify(user))
    else localStorage.removeItem('undc_user')
  },[user])

  const login = async (correo:string, password:string)=>{
    const r:any = await api.post('/api/v1/auth/login', {correo, password})
    const d = r.data
    const u:User = {
      id: d.id, nombre: d.nombre, correo: d.correo || correo,
      rol: d.rol, rol_actor: d.rol_actor, rol_actor_id: d.rol_actor_id,
      tipo_actor: d.tipo_actor, token: d.token
    }
    setUser(u)
  }
  const logout = ()=> setUser(null)

  return <AuthCtx.Provider value={{
    user, login, logout,
    isEstudiante: user?.rol==='ESTUDIANTE',
    isDocente: user?.rol==='DOCENTE',
    isDirectivo: user?.rol==='DIRECTIVO' || user?.rol==='ADMIN',
    isAdmin: user?.rol==='ADMIN'
  }}>{children}</AuthCtx.Provider>
}
export const useAuth = ()=> useContext(AuthCtx)
