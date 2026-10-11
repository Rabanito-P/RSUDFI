export const API_BASE = (import.meta as any).env?.VITE_API_URL ?? ''
const BASE = API_BASE

const TOKEN_KEY = 'undc_user'
let onUnauthorized: (() => void) | null = null

// Token en memoria: evita depender del momento exacto en que localStorage se
// actualiza (y del modo privado, donde localStorage puede lanzar).
let memToken: string | null = null

// Permite que AuthContext registre el cierre de sesión (evita dependencia circular).
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn
}

// Sincroniza el token en memoria justo después de autenticarse.
export function setSessionToken(token: string | null) {
  memToken = token
}

function readUser(): any {
  if (memToken) return { token: memToken }
  try {
    const s = localStorage.getItem(TOKEN_KEY)
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

function authHeader(): Record<string, string> {
  const u = readUser()
  if (u?.token) return { Authorization: `Bearer ${u.token}` }
  return {}
}

export function clearSession() {
  memToken = null
  localStorage.removeItem(TOKEN_KEY)
  try { onUnauthorized?.() } catch { /* noop */ }
}

export function isTokenExpired(): boolean {
  const u = readUser()
  const t = u?.token
  if (!t) return true
  try {
    const payload = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof payload.exp !== 'number') return false
    return payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

async function parseError(res: Response): Promise<string> {
  const txt = await res.text()
  try {
    const j = JSON.parse(txt)
    return j.message || j.error || txt
  } catch { return txt }
}

async function handleResponse<T>(res: Response): Promise<{ success: boolean; data: T; meta?: any; message?: string }> {
  if (res.status === 401) {
    clearSession()
    throw new Error('HTTP 401: Sesión expirada o no autorizada. Vuelve a iniciar sesión.')
  }
  if (!res.ok) {
    const msg = await parseError(res)
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}: Error`)
  }
  const text = await res.text()
  if (!text) return { success: true, data: {} as T }
  return JSON.parse(text)
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<{ success: boolean; data: T; meta?: any; message?: string }> {
  const headers: Record<string, string> = { ...authHeader(), ...(opts.headers as Record<string, string> || {}) }
  if (opts.body) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${BASE}${path}`, { headers, ...opts })
  return handleResponse<T>(res)
}

export function asArray<T = any>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

export const api = {
  get: <T,>(p: string) => req<T>(p),
  post: <T,>(p: string, body: any) => req<T>(p, { method: 'POST', body: JSON.stringify(body) }),
  put: <T,>(p: string, body: any) => req<T>(p, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T,>(p: string, body: any) => req<T>(p, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T,>(p: string) => req<T>(p, { method: 'DELETE' }),
  upload: async (path: string, form: FormData) => {
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: { ...authHeader() }, body: form })
    return handleResponse(res)
  },
  fileUrl: (u?: string) => {
    if (!u) return ''
    if (/^https?:\/\//i.test(u)) return u
    return `${BASE}${u.startsWith('/') ? u : `/${u}`}`
  },
}