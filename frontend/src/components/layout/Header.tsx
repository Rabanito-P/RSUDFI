import { useEffect, useState, useRef } from 'react'
import { Bell, Search, Command, CheckCheck, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

interface Notif { id_notificacion:number; rol_destino:string; tipo:string; titulo:string; mensaje?:string; id_proyecto?:number; leido:boolean; created_at:string }

export function Header(){
  const {user} = useAuth()
  const roleDot = user?.rol==='ESTUDIANTE'?'bg-sky-500':user?.rol==='DOCENTE'?'bg-emerald-500':user?.rol==='ADMIN'?'bg-violet-500':'bg-undc-600'
  const [notifs,setNotifs]=useState<Notif[]>([])
  const [unread,setUnread]=useState(0)
  const [open,setOpen]=useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = async()=>{
    if(!user) return
    try{
      const r:any = await api.get(`/api/v1/notificaciones?rol_destino=${user.rol_actor}&limit=12`)
      const list:Notif[] = r.data || []
      setNotifs(list)
      setUnread(list.filter((n:any)=> !n.leido).length)
      // fallback si backend no tiene datos (seed), mantiene unread del count endpoint
      if(!list.length){
        try{
          const c:any = await api.get(`/api/v1/notificaciones/count?rol_destino=${user.rol_actor}`)
          setUnread(c.data?.unread ?? 0)
        }catch{}
      }
    }catch{
      // demo fallback: usa seed si API cae
      const demo:Notif[] = [
        {id_notificacion:1, rol_destino:user.rol_actor, tipo:'TRANSICION', titulo:'Demo: revisión pendiente', mensaje:'Si ves este demo, el backend de notificaciones aún no responde — revisa /api/v1/notificaciones/health', leido:false, created_at:new Date().toISOString()},
      ]
      if(user.rol_actor==='ESTUDIANTE_PROP') demo[0]= {id_notificacion:1, rol_destino:'ESTUDIANTE_PROP', tipo:'PROYECTO_CREADO', titulo:'Proyecto RSU-2026-011 en BORRADOR', mensaje:'Tu equipo ya puede subir documentos (HU-033). Solo tu equipo ve este proyecto.', leido:false, created_at:new Date().toISOString()}
      if(user.rol_actor==='DIR_ESCUELA') demo[0]= {id_notificacion:1, rol_destino:'DIR_ESCUELA', tipo:'TRANSICION', titulo:'RSU-2026-011 requiere tu V°B°', mensaje:'Estudiante Ana Quispe envió a revisión Escuela. Revisa viabilidad técnica.', leido:false, created_at:new Date().toISOString()}
      setNotifs(demo); setUnread(1)
    }
  }
  useEffect(()=>{ load(); const id=setInterval(load, 30000); return ()=> clearInterval(id)},[user?.rol_actor])
  useEffect(()=>{
    const h = (e:MouseEvent)=> { if(ref.current && !ref.current.contains(e.target as any)) setOpen(false)}
    document.addEventListener('mousedown', h); return ()=> document.removeEventListener('mousedown',h)
  },[])

  const markOne = async(id:number)=>{
    try{ await api.patch(`/api/v1/notificaciones/${id}/leido`, {})}catch{}
    setNotifs(s=> s.map(n=> n.id_notificacion===id? {...n, leido:true}: n)); setUnread(c=> Math.max(0,c-1))
  }
  const markAll = async()=>{
    try{ await api.patch(`/api/v1/notificaciones/marcar-todas-leidas?rol_destino=${user?.rol_actor}`, {})}catch{}
    setNotifs(s=> s.map(n=> ({...n, leido:true}))); setUnread(0)
  }

  const isEstudiante = user?.rol==='ESTUDIANTE'
  return (
    <header className="h-[64px] bg-white/80 backdrop-blur-xl border-b border-slate-200/70 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {isEstudiante ? (
          <div className="text-sm font-medium text-slate-700">Mis proyectos</div>
        ) : (
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-undc-600 transition-colors" size={18}/>
            <input placeholder="Buscar proyecto, beneficiario, DNI..." className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-undc-500 focus:ring-4 focus:ring-undc-500/10 outline-none text-sm transition-all"/>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-1 text-xs text-slate-400 bg-white border border-slate-200 px-1.5 py-1 rounded-lg"><Command size={12}/> K</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <span className="hidden lg:inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-900 text-white rounded-full shadow-sm">
          <span className={`w-2 h-2 rounded-full ${roleDot} animate-pulse`}/> {user?.rol_actor || '—'} <span className="opacity-60">· {user?.tipo_actor}</span>
        </span>

        <div className="relative" ref={ref}>
          <button onClick={()=> setOpen(o=> !o)} className={`relative p-2.5 rounded-xl transition-colors ${open?'bg-undc-600 text-white':'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
            <Bell size={18}/>
            {unread>0 && <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold grid place-items-center rounded-full shadow-sm px-1">{unread>99? '99+': unread}</span>}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <div><div className="font-bold text-sm">Notificaciones — {user?.rol_actor}</div><div className="text-xs text-slate-500">{unread} sin leer · {notifs.length} recientes · polling 30s</div></div>
                <button onClick={()=> setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16}/></button>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {notifs.length===0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">Sin notificaciones para <b>{user?.rol_actor}</b>. Las alertas llegan a tu lane BPMN cuando el estado te toca (ej. DIR_ESCUELA recibe BORRADOR→EN_REVISION).</div>
                ) : notifs.map(n=>(
                  <div key={n.id_notificacion} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 flex gap-3 ${n.leido?'opacity-60':''}`}>
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.leido?'bg-slate-300':'bg-red-500 animate-pulse'}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold leading-tight truncate">{n.titulo}</div>
                      {n.mensaje && <div className="text-xs text-slate-500 leading-tight line-clamp-2 mt-0.5">{n.mensaje}</div>}
                      <div className="text-[11px] text-slate-400 mt-1 flex gap-2"><span className="px-1.5 py-0.5 bg-slate-100 rounded-full">{n.tipo}</span><span>{n.rol_destino}</span><span>{n.created_at?.slice(0,16)?.replace('T',' ')}</span>{n.id_proyecto && <span className="ml-auto font-mono">#{n.id_proyecto}</span>}</div>
                    </div>
                    {!n.leido && <button onClick={()=> markOne(n.id_notificacion)} className="shrink-0 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-900 hover:text-white">Marcar leída</button>}
                  </div>
                ))}
              </div>
              <div className="p-2.5 bg-slate-50 flex gap-2">
                <button onClick={markAll} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-900 hover:text-white"><CheckCheck size={14}/> Marcar todas leídas ({user?.rol_actor})</button>
                <button onClick={load} className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Actualizar</button>
              </div>
              <div className="px-3 py-2 text-[11px] text-slate-400 bg-white border-t border-slate-100">Notificaciones por tu rol ({user?.rol_actor}) · {unread} sin leer</div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 hidden sm:block"/>
        <div className="flex items-center gap-3 pl-1">
          <img src={`https://i.pravatar.cc/100?u=${user?.correo}`} className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100"/>
          <div className="text-sm leading-tight hidden md:block">
            <div className="font-semibold text-slate-900">{user?.nombre?.split('(')[0] || '—'}</div>
            <div className="text-xs text-slate-500">{user?.correo}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
