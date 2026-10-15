import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Command, CheckCheck, X, Menu, ChevronDown, LogOut, Shield, UserCog, Contact, Check, RefreshCw, FolderKanban, ArrowRightLeft, UserPlus, Clock, FileBarChart, AlertTriangle, MessageSquare, Building2, Mail, Activity, Settings, Inbox, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLayout } from '../../context/LayoutContext'
import { rolLegible, actorLegible, colorActor } from '../../lib/roles'
import { api } from '../../api/client'

interface Notif { id_notificacion:number; rol_destino:string; tipo:string; titulo:string; mensaje?:string; id_proyecto?:number; leido:boolean; created_at:string }
interface SearchResult { id_proyecto?:number; codigo_proyecto?:string; titulo?:string; estado?:string|{codigo?:string; nombre?:string}; nombre?:string; correo_institucional?:string; dni?:string }

// El backend puede devolver estado como string o como objeto RSU_Estado_Proyecto.
// React no puede renderizar un objeto como hijo, así que se normaliza aquí.
function etiquetaEstado(v: SearchResult['estado']): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  return v.nombre || v.codigo || ''
}

// ── Notificaciones: icono y color por tipo ──
// Tipos reales de RSU_Notificacion: TRANSICION, ASIGNACION, INVITACION,
// MONITOREO, PROYECTO_CREADO, RECORDATORIO, REPORTE, ALERTA, OBSERVACION, CONFIG,
// SOLICITUD_UNION, UNION_ACEPTADA, UNION_RECHAZADA.
// Si aparece uno nuevo se usa el icono genérico.
const ICONOS_NOTIF: Record<string, any> = {
  TRANSICION: ArrowRightLeft,
  ASIGNACION: UserPlus,
  INVITACION: Mail,
  MONITOREO: Activity,
  PROYECTO_CREADO: FolderKanban,
  RECORDATORIO: Clock,
  REPORTE: FileBarChart,
  ALERTA: AlertTriangle,
  OBSERVACION: MessageSquare,
  CONFIG: Settings,
  SOLICITUD_UNION: Inbox,
  UNION_ACEPTADA: Check,
  UNION_RECHAZADA: X,
}
const TINTAS_NOTIF: Record<string, string> = {
  TRANSICION: 'bg-sky-50 text-sky-600 ring-sky-100',
  ASIGNACION: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  INVITACION: 'bg-teal-50 text-teal-600 ring-teal-100',
  MONITOREO: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  PROYECTO_CREADO: 'bg-undc-50 text-undc-700 ring-undc-100',
  RECORDATORIO: 'bg-amber-50 text-amber-600 ring-amber-100',
  REPORTE: 'bg-violet-50 text-violet-600 ring-violet-100',
  ALERTA: 'bg-red-50 text-red-600 ring-red-100',
  OBSERVACION: 'bg-orange-50 text-orange-600 ring-orange-100',
  CONFIG: 'bg-slate-100 text-slate-600 ring-slate-200',
  SOLICITUD_UNION: 'bg-violet-50 text-violet-600 ring-violet-100',
  UNION_ACEPTADA: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  UNION_RECHAZADA: 'bg-red-50 text-red-600 ring-red-100',
}

function iconoNotif(tipo?: string) {
  return ICONOS_NOTIF[String(tipo || '').toUpperCase()] || Bell
}
function tintaNotif(tipo?: string) {
  return TINTAS_NOTIF[String(tipo || '').toUpperCase()] || TINTAS_NOTIF.CONFIG
}

// Fecha corta en vez del timestamp completo: "hace 5 min", "hoy 14:20", "ayer".
function fechaRelativa(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return String(iso).slice(0, 10)
  const diff = Date.now() - d.getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

function Avatar({ nombre, correo, size='w-9 h-9 text-xs' }: { nombre?:string; correo?:string; size?:string }){
  const name = (nombre || correo || '?').replace(/\(.*\)/,'').trim()
  const parts = name.split(' ').filter(Boolean)
  const initials = parts.length>=2 ? `${parts[0][0]}${parts[parts.length-1][0]}` : parts[0]?.[0] || '?'
  const colors = ['bg-sky-600','bg-emerald-600','bg-violet-600','bg-amber-600','bg-rose-600','bg-teal-600']
  const idx = (correo||nombre||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % colors.length
  return (
    <div className={`${size} ${colors[idx]} rounded-xl grid place-items-center text-white font-bold shrink-0`}>
      {initials.toUpperCase()}
    </div>
  )
}

export function Header(){
  const {user, logout} = useAuth()
  const { toggleMenu } = useLayout()
  const nav = useNavigate()
  const [notifs,setNotifs]=useState<Notif[]>([])
  const [unread,setUnread]=useState(0)
  const [open,setOpen]=useState(false)
  const [filtro,setFiltro]=useState<'todas'|'leer'>('todas')
  const [userOpen,setUserOpen]=useState(false)
  const [searchQuery,setSearchQuery]=useState('')
  const [searchResults,setSearchResults]=useState<SearchResult[]>([])
  const [searchOpen,setSearchOpen]=useState(false)
  const [searchLoading,setSearchLoading]=useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const load = async()=>{
    if(!user) return
    try{
      // Individual: las dirigidas a esta cuenta + las bandera de su rol.
      // Sin ?usuario= se veían los avisos de todas las cuentas del mismo rol.
      const r:any = await api.get(`/api/v1/notificaciones?rol_destino=${user.rol_actor}&usuario=${user.id}&limit=12`)
      const list:Notif[] = r.data || []
      setNotifs(list)
      setUnread(list.filter((n:any)=> !n.leido).length)
      if(!list.length){
        try{
          const c:any = await api.get(`/api/v1/notificaciones/count?rol_destino=${user.rol_actor}&usuario=${user.id}`)
          setUnread(c.data?.unread ?? 0)
        }catch{ setUnread(0) }
      }
    }catch{
      setNotifs([]); setUnread(0)
    }
  }
  useEffect(()=>{ load(); const id=setInterval(load, 30000); return ()=> clearInterval(id)},[user?.rol_actor])
  useEffect(()=>{
    const h = (e:MouseEvent)=> { if(ref.current && !ref.current.contains(e.target as any)) setOpen(false) }
    document.addEventListener('mousedown', h); return ()=> document.removeEventListener('mousedown',h)
  },[])
  useEffect(()=>{
    const h = (e:MouseEvent)=> { if(searchRef.current && !searchRef.current.contains(e.target as any)) setSearchOpen(false) }
    document.addEventListener('mousedown', h); return ()=> document.removeEventListener('mousedown',h)
  },[])
  useEffect(()=>{
    const h = (e:MouseEvent)=> { if(userRef.current && !userRef.current.contains(e.target as any)) setUserOpen(false) }
    document.addEventListener('mousedown', h); return ()=> document.removeEventListener('mousedown',h)
  },[])
  useEffect(()=>{
    if(!userOpen) return
    const h = (e:KeyboardEvent)=> { if(e.key==='Escape') setUserOpen(false) }
    document.addEventListener('keydown', h); return ()=> document.removeEventListener('keydown',h)
  },[userOpen])

  const salir = ()=>{
    setUserOpen(false)
    logout()
    nav('/login')
  }

  const doSearch = async(query:string)=>{
    if(!query.trim()){ setSearchResults([]); setSearchOpen(false); return }
    setSearchLoading(true)
    try{
      const r:any = await api.get(`/api/v1/proyectos?search=${encodeURIComponent(query)}&limit=5`)
      const list:SearchResult[] = r.data || []
      setSearchResults(list)
      setSearchOpen(true)
    }catch{
      setSearchResults([]); setSearchOpen(true)
    }finally{ setSearchLoading(false) }
  }

  const markOne = async(id:number)=>{
    try{ await api.patch(`/api/v1/notificaciones/${id}/leido`, {})}catch{}
    setNotifs(s=> s.map(n=> n.id_notificacion===id? {...n, leido:true}: n)); setUnread(c=> Math.max(0,c-1))
  }
  const markAll = async()=>{
    try{ await api.patch(`/api/v1/notificaciones/marcar-todas-leidas?rol_destino=${user?.rol_actor}&usuario=${user?.id}`, {})}catch{}
    setNotifs(s=> s.map(n=> ({...n, leido:true}))); setUnread(0)
  }

  const isEstudiante = user?.rol === 'ESTUDIANTE'
  // Agrupa las notificaciones por antigüedad para que lo reciente se vea primero.
  const grupos = useMemo(() => {
    const base = filtro==='leer' ? notifs.filter(n=> !n.leido) : notifs
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1)
    const semana = new Date(hoy); semana.setDate(semana.getDate() - 7)
    const g: { hoy: Notif[]; ayer: Notif[]; semana: Notif[]; antiguas: Notif[] } = {
      hoy: [], ayer: [], semana: [], antiguas: [],
    }
    for (const n of base) {
      const d = new Date(n.created_at)
      if (isNaN(d.getTime())) { g.antiguas.push(n); continue }
      const dia = new Date(d); dia.setHours(0, 0, 0, 0)
      if (dia.getTime() === hoy.getTime()) g.hoy.push(n)
      else if (dia.getTime() === ayer.getTime()) g.ayer.push(n)
      else if (dia >= semana) g.semana.push(n)
      else g.antiguas.push(n)
    }
    return [
      { titulo: 'Hoy', items: g.hoy },
      { titulo: 'Ayer', items: g.ayer },
      { titulo: 'Esta semana', items: g.semana },
      { titulo: 'Anteriores', items: g.antiguas },
    ].filter(x => x.items.length > 0)
  }, [notifs, filtro])
  // Total tras el filtro: si no hay nada que mostrar el panel debe decirlo
  // con un mensaje propio y no con la lista vacía.
  const notifsFiltradas = useMemo(
    () => filtro==='leer' ? notifs.filter(n=> !n.leido) : notifs,
    [notifs, filtro]
  )
  // Detalle del actor solo cuando aclara algo que el rol no dice.
  // "Estudiante proponente" / "Docente colaborador" informan; "Estudiante" no.
  const detalleActor = (() => {
    const a = actorLegible(user?.rol_actor)
    if (!a) return ''
    if (a === rolLegible(user?.rol)) return ''
    return a
  })()
  return (
    <header className="h-16 shrink-0 bg-white/85 backdrop-blur-xl border-b border-slate-200/70 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 z-20">
      {/* Hamburguesa: solo móvil/tablet */}
      <button
        onClick={toggleMenu}
        aria-label="Abrir menú"
        className="lg:hidden p-2.5 -ml-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
      >
        <Menu size={20}/>
      </button>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isEstudiante ? (
          <div className="text-sm font-medium text-slate-700 truncate">Mis proyectos</div>
        ) : (
          <div className="relative flex-1 min-w-0 group" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-undc-600 transition-colors pointer-events-none" size={18}/>
            <input
              placeholder="Buscar proyecto, beneficiario, DNI..."
              className="w-full pl-10 pr-3 sm:pr-20 py-2.5 rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-undc-500 focus:ring-4 focus:ring-undc-500/10 outline-none text-sm transition-all"
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'){ doSearch(searchQuery); setSearchOpen(true) } }}
              onFocus={()=>{ if(searchResults.length) setSearchOpen(true) }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-1 text-xs text-slate-400 bg-white border border-slate-200 px-1.5 py-1 rounded-lg"><Command size={12}/> K</span>
            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                {searchLoading ? (
                  <div className="p-4 text-center text-sm text-slate-400">Buscando...</div>
                ) : searchResults.length===0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">Sin resultados para "{searchQuery}"</div>
                ) : (
                  <div className="max-h-[320px] overflow-y-auto">
                    {searchResults.map((r,i)=>(
                      <button key={i} className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center gap-3" onClick={()=>{ setSearchOpen(false); setSearchQuery(''); if(r.id_proyecto) nav(`/proyectos/${r.id_proyecto}`) }}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{r.titulo || r.codigo_proyecto || r.nombre || 'Sin nombre'}</div>
                          <div className="text-xs text-slate-500">{r.codigo_proyecto || r.correo_institucional || r.dni || ''} {etiquetaEstado(r.estado) && <span className="ml-1 px-1.5 py-0.5 bg-slate-100 rounded-full">{etiquetaEstado(r.estado)}</span>}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <span className="hidden lg:inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-900 text-white rounded-full shadow-sm">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{background: colorActor(user?.rol_actor)}}/>
          {detalleActor || rolLegible(user?.rol)}
        </span>

        <div className="relative" ref={ref}>
          <button onClick={()=> setOpen(o=> !o)} className={`relative p-2.5 rounded-xl transition-colors ${open?'bg-undc-600 text-white':'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
            <Bell size={18}/>
            {unread>0 && <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold grid place-items-center rounded-full shadow-sm px-1">{unread>99? '99+': unread}</span>}
          </button>
          {open && (
            <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 sm:w-[400px] top-[70px] sm:top-full sm:mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-[calc(100vh-90px)] flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">Notificaciones</div>
                  <div className="text-xs text-slate-500">{unread>0 ? `${unread} sin leer` : 'Todo al día'} · {notifs.length} recientes</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={load} title="Actualizar" aria-label="Actualizar notificaciones" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><RefreshCw size={14}/></button>
                  <button onClick={()=> setOpen(false)} aria-label="Cerrar notificaciones" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={16}/></button>
                </div>
              </div>

              {/* Filtro rápido: con muchos avisos lo urgente se pierde al fondo. */}
              {notifs.length>0 && (
                <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-1.5">
                  <SlidersHorizontal size={12} className="text-slate-400 shrink-0"/>
                  {([['todas','Todas',notifs.length],['leer','Sin leer',unread]] as const).map(([k,label,n])=>(
                    <button
                      key={k}
                      onClick={()=> setFiltro(k)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${filtro===k ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {label} · {n}
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-[420px] overflow-y-auto">
                {notifs.length===0 ? (
                  <div className="p-8 text-center">
                    <Inbox size={26} className="mx-auto text-slate-300"/>
                    <div className="text-sm font-semibold text-slate-600 mt-2">Sin notificaciones</div>
                    <div className="text-xs text-slate-400 mt-0.5">Aquí verás los avisos de tus proyectos y tareas.</div>
                  </div>
                ) : notifsFiltradas.length===0 ? (
                  <div className="p-8 text-center">
                    <CheckCheck size={26} className="mx-auto text-emerald-300"/>
                    <div className="text-sm font-semibold text-slate-600 mt-2">No tienes avisos sin leer</div>
                    <div className="text-xs text-slate-400 mt-0.5">Revisa «Todas» para ver el historial.</div>
                  </div>
                ) : (
                  <>
                    {grupos.map(g => (
                      <div key={g.titulo}>
                        <div className="sticky top-0 z-10 px-4 py-1.5 bg-slate-50/95 backdrop-blur border-b border-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {g.titulo} · {g.items.length}
                        </div>
                        {g.items.map(n => {
                          const Icono = iconoNotif(n.tipo)
                          return (
                            // Toda la fila es clicable: lleva al proyecto y lo marca leído.
                            <div
                              key={n.id_notificacion}
                              onClick={() => { if(!n.leido) markOne(n.id_notificacion); if(n.id_proyecto){ setOpen(false); nav(`/proyectos/${n.id_proyecto}`) } }}
                              className={`px-4 py-3 border-b border-slate-50 flex gap-3 cursor-pointer transition-colors hover:bg-slate-50 ${n.leido ? '' : 'bg-undc-50/25'}`}
                            >
                              <div className={`mt-0.5 w-8 h-8 rounded-xl grid place-items-center shrink-0 ring-1 ${tintaNotif(n.tipo)}`}>
                                <Icono size={15}/>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm leading-tight ${n.leido ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>{n.titulo}</div>
                                {n.mensaje && <div className="text-xs text-slate-500 leading-snug mt-0.5 line-clamp-2">{n.mensaje}</div>}
                                <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-2 flex-wrap">
                                  {n.id_proyecto && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-undc-50 border border-undc-200 text-undc-700 rounded-full font-bold">
                                      <FolderKanban size={10} /> #{n.id_proyecto}
                                    </span>
                                  )}
                                  <span className="px-1.5 py-0.5 bg-slate-100 rounded-full font-semibold">{n.tipo}</span>
                                  <span>{fechaRelativa(n.created_at)}</span>
                                  {!n.leido && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Sin leer" />}
                                </div>
                              </div>
                              {!n.leido && (
                                <button
                                  onClick={(e)=>{ e.stopPropagation(); markOne(n.id_notificacion) }}
                                  title="Marcar como leída"
                                  aria-label="Marcar como leída"
                                  className="shrink-0 w-8 h-8 grid place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900">
                                  <Check size={13}/>
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </>
                )}
              </div>
              {notifs.length>0 && (
                <div className="p-2.5 bg-slate-50 flex gap-2 shrink-0 border-t border-slate-100">
                  <button onClick={markAll} disabled={unread===0} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-900 hover:text-white hover:border-slate-900 disabled:opacity-40 disabled:pointer-events-none"><CheckCheck size={14}/> <span className="truncate">Marcar todas leídas</span></button>
                </div>
              )}
              <div className="px-3 py-2 text-[11px] text-slate-400 bg-white border-t border-slate-100">Avisos de tu perfil ({rolLegible(user?.rol) || user?.rol_actor}) · se actualizan solas cada 30 s</div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 hidden sm:block"/>
        <div className="relative shrink-0" ref={userRef}>
          <button
            onClick={()=> setUserOpen(o=> !o)}
            aria-haspopup="menu"
            aria-expanded={userOpen}
            className={`flex items-center gap-2 sm:gap-3 p-1 pr-1 sm:pr-2 rounded-2xl transition-colors ${userOpen ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
          >
            <Avatar nombre={user?.nombre} correo={user?.correo}/>
            <div className="text-sm leading-tight hidden md:block text-left min-w-0">
              <div className="font-semibold text-slate-900 truncate max-w-[160px]">{user?.nombre?.split('(')[0] || '—'}</div>
              <div className="text-xs text-slate-500 truncate max-w-[160px]">{user?.correo}</div>
            </div>
            <ChevronDown size={16} className={`hidden sm:block text-slate-400 transition-transform shrink-0 ${userOpen? 'rotate-180':''}`}/>
          </button>

          {userOpen && (
            <div
              role="menu"
              className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[68px] sm:top-full sm:mt-2 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-[calc(100vh-88px)] overflow-y-auto"
            >
              <div className="p-4 flex items-center gap-3 border-b border-slate-100 bg-slate-50/60">
                <Avatar nombre={user?.nombre} correo={user?.correo} size="w-11 h-11 text-sm"/>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 truncate">{user?.nombre?.split('(')[0] || '—'}</div>
                  <div className="text-xs text-slate-500 truncate">{user?.correo}</div>
                </div>
              </div>

              <div className="p-3 border-b border-slate-100 space-y-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <Shield size={13} className="text-slate-400 shrink-0"/>
                  <span className="text-slate-500">Perfil</span>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[11px]">
                    {rolLegible(user?.rol)}
                  </span>
                </div>
                {/* El actor solo se muestra si aporta un detalle que el rol ya no dice:
                    "Estudiante proponente" sí, "Estudiante" a secas sería redundante. */}
                {detalleActor && (
                  <div className="flex items-center gap-2 text-xs">
                    <Contact size={13} className="text-slate-400 shrink-0"/>
                    <span className="text-slate-500">Función</span>
                    <span className="ml-auto font-semibold text-slate-800 truncate text-right max-w-[60%]" title={user?.rol_actor}>
                      {detalleActor}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2">
                <button
                  onClick={salir}
                  role="menuitem"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} className="shrink-0"/> Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
