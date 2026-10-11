import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, clearSession, isTokenExpired, setSessionToken, setUnauthorizedHandler } from '../api/client'

export type RolGlobal = 'ESTUDIANTE' | 'DOCENTE' | 'DIRECTIVO' | 'ADMIN'

export interface User {
  id: number
  persona_id: number
  nombre: string
  correo: string
  rol: RolGlobal
  rol_actor: string
  rol_actor_id: number
  tipo_actor: string
  token: string
}

interface Ctx {
  user: User | null
  /** Sesión ya validada contra el servidor (ver nota en AppShell). */
  ready: boolean
  login: (correo: string, password: string) => Promise<User>
  logout: () => void
  isEstudiante: boolean
  isDocente: boolean
  isDirectivo: boolean
  isAdmin: boolean
}

const TOKEN_KEY = 'undc_user'
const AuthCtx = createContext<Ctx>(null as any)

function readStoredUser(): User | null {
  try {
    const s = localStorage.getItem(TOKEN_KEY)
    if (!s) return null
    const u = JSON.parse(s)
    if (!u?.token) return null
    // Token expirado o corrupto: sesión inválida, se descarta.
    if (isTokenExpired()) {
      localStorage.removeItem(TOKEN_KEY)
      return null
    }
    return u as User
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser)
  const [ready, setReady] = useState<boolean>(() => !readStoredUser())

  useEffect(() => {
    setSessionToken(user?.token ?? null)
    if (user) localStorage.setItem(TOKEN_KEY, JSON.stringify(user))
    else localStorage.removeItem(TOKEN_KEY)
  }, [user])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  // Cualquier 401 devuelto por la API cierra la sesión (token revocado/expirado).
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  // Valida la sesión contra el servidor al arrancar. Si el token guardado ya no es
  // válido (expirado, revocado o de una versión anterior), se descarta y el guard
  // redirige al login en lugar de dejar la app "logueada" con todas las llamadas en 401.
  useEffect(() => {
    let cancelled = false
    const stored = readStoredUser()
    if (!stored) {
      setReady(true)
      return
    }
    api
      .get('/api/v1/auth/me')
      .then((r: any) => {
        if (cancelled) return
        const d = r?.data ?? {}
        if (d && d.activo === false) {
          logout()
          return
        }
        setUser(prev =>
          prev
            ? {
                ...prev,
                nombre: d.nombre || prev.nombre,
                rol: d.rol || prev.rol,
                rol_actor: d.rol_actor || prev.rol_actor,
                rol_actor_id: d.rol_actor_id ?? prev.rol_actor_id,
                persona_id: d.persona_id ?? prev.persona_id,
              }
            : prev,
        )
      })
      .catch(() => {
        // 401 ya cerró sesión en el cliente; cualquier otro error mantiene la sesión.
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [logout])

  const login = async (correo: string, password: string): Promise<User> => {
    const r: any = await api.post('/api/v1/auth/login', { correo, password })
    const d = r.data ?? r
    const u: User = {
      id: d.id,
      persona_id: d.persona_id || 0,
      nombre: d.nombre || d.correo,
      correo: d.correo || correo,
      rol: d.rol,
      rol_actor: d.rol_actor,
      rol_actor_id: d.rol_actor_id,
      tipo_actor: d.tipo_actor,
      token: d.token,
    }
    // Se persiste de forma SINCRÓNICA antes de actualizar el estado: el cliente HTTP
    // lee el token de localStorage, y las pantallas que se montan tras el login
    // disparan sus peticiones inmediatamente. Si la escritura quedara para el
    // useEffect, saldrían sin header Authorization y la API respondería 401.
    try {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(u))
    } catch {
      /* modo privado sin storage: el estado en memoria sostiene la sesión */
    }
    setSessionToken(u.token)
    setUser(u)
    return u
  }

  return (
    <AuthCtx.Provider
      value={{
        user: ready ? user : null,
        // true cuando la sesión ya se validó contra el servidor. Las pantallas
        // deben esperar este flag antes de decidir: si no, un F5 en una ruta
        // profunda renderizaba el login y luego saltaba a "/".
        ready,
        login,
        logout,
        isEstudiante: user?.rol === 'ESTUDIANTE',
        isDocente: user?.rol === 'DOCENTE',
        isDirectivo: user?.rol === 'DIRECTIVO' || user?.rol === 'ADMIN',
        isAdmin: user?.rol === 'ADMIN',
      }}
    >
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)