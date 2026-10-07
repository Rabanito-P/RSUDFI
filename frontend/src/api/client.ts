const BASE = (import.meta as any).env?.VITE_API_URL ?? ''

function authHeader():Record<string,string>{
  try{
    const s = localStorage.getItem('undc_user')
    if(s){
      const u = JSON.parse(s)
      if(u?.token) return { Authorization: `Bearer ${u.token}` }
    }
  }catch{}
  return {}
}

async function parseError(res: Response): Promise<string> {
  const txt = await res.text()
  try {
    const j = JSON.parse(txt)
    return j.message || j.error || txt
  } catch { return txt }
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<{success:boolean; data:T; meta?:any; message?:string}> {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(opts.headers||{}) },
    ...opts
  })
  if(!res.ok){
    const msg = await parseError(res)
    throw new Error(msg || `HTTP ${res.status}`)
  }
  const json:any = await res.json()
  // Normaliza data null -> {} o [] para evitar crashes .map
  // Backend paginado usa {data: T[], meta} donde data puede ser null cuando vacío
  if(json && json.data === null && Array.isArray(null as any)){
    // no-op, handled below via caller fallback r.data||[]
  }
  return json
}

// helper para uso externo: garantiza array si se esperaba lista
export function asArray<T>(v:T[]|null|undefined):T[]{
  return Array.isArray(v) ? v : []
}
export const api = {
  get: <T>(p:string)=> req<T>(p),
  post: <T>(p:string, body:any)=> req<T>(p,{method:'POST', body: JSON.stringify(body)}),
  put: <T>(p:string, body:any)=> req<T>(p,{method:'PUT', body: JSON.stringify(body)}),
  patch: <T>(p:string, body:any)=> req<T>(p,{method:'PATCH', body: JSON.stringify(body)}),
  del: <T>(p:string)=> req<T>(p,{method:'DELETE'}),
  upload: async (path:string, form:FormData)=>{
    const res = await fetch(`${BASE}${path}`, {method:'POST', headers: {...authHeader()}, body: form})
    if(!res.ok) throw new Error(await parseError(res))
    return res.json()
  }
}
