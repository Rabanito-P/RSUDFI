import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Users, Shield, KeyRound, UserCog, BarChart3, Vote, LogIn, Loader2, UserPlus, ArrowLeft, X } from 'lucide-react'
import { api } from '../api/client'

type Preset = {
  correo: string
  label: string
  rol: 'ESTUDIANTE' | 'DOCENTE' | 'DIRECTIVO' | 'ADMIN'
  color: string
  desc: string
  icon: JSX.Element
}

const PASSWORD = 'undc2026'

// Accesos rápidos: cada tarjeta corresponde a un usuario de RSU_Usuario (db/seed_demo.sql).
// Los roles de negocio (estados y lanes) NO viven aquí: se leen de /api/v1/catalogos/*.
//
// El sistema opera por función: Estudiante, Docente, Dir. Escuela Profesional,
// Dir. RS Facultad, Decano y Administración.
//
// Alineado con rules "fase de propuesta-aprobacion-cierre" §2, la matriz de
// roles incluye al Decano de la Facultad y NO incluye al Consejo de Facultad:
// según las rules, quien valida el expediente en la Facultad es el Comité RSU
// junto al Decano, y el elevate se hace con el Oficio de Elevación.
//
// La DRSU Central y la Vicepresidencia Académica NO tienen tarjeta: no operan
// el sistema (ver NOTA_USUARIO_OCULTO más abajo).
const presets: Preset[] = [
  { correo: 'estudiante@undc.edu.pe', label: 'Estudiante', rol: 'ESTUDIANTE', color: 'bg-sky-600', desc: 'Crea borrador · ejecuta · reporta horas', icon: <GraduationCap size={16} /> },
  { correo: 'ejecutor@undc.edu.pe', label: 'Estudiante ejecutor', rol: 'ESTUDIANTE', color: 'bg-sky-600', desc: 'Integra el equipo y sube evidencias', icon: <Users size={16} /> },
  { correo: 'docente@undc.edu.pe', label: 'Docente Asesor', rol: 'DOCENTE', color: 'bg-emerald-600', desc: 'Asesora · acepta el SSU · verifica', icon: <Users size={16} /> },
  { correo: 'colaborador@undc.edu.pe', label: 'Docente Responsable (PEP)', rol: 'DOCENTE', color: 'bg-emerald-600', desc: 'Crea el PEP · elige el equipo', icon: <Users size={16} /> },
  { correo: 'escuela@undc.edu.pe', label: 'Dir. Escuela Profesional', rol: 'DIRECTIVO', color: 'bg-amber-600', desc: 'Revisa → V°B° Escuela → conformidad', icon: <Shield size={16} /> },
  { correo: 'rsfacultad@undc.edu.pe', label: 'Dir. RS Facultad', rol: 'DIRECTIVO', color: 'bg-violet-600', desc: 'Prioriza banco · registra lo de la DRSU', icon: <BarChart3 size={16} /> },
  { correo: 'decano@undc.edu.pe', label: 'Decano de Facultad', rol: 'DIRECTIVO', color: 'bg-indigo-600', desc: 'Comité RSU · Aprobar y Elevar', icon: <Vote size={16} /> },
  { correo: 'admin@undc.edu.pe', label: 'Administrador', rol: 'ADMIN', color: 'bg-slate-900', desc: 'Usuarios, módulos y permisos', icon: <UserCog size={16} /> },
]

// Cuenta que existe para testear un paso del flujo, no como acceso rápido.
const NOTA_USUARIO_OCULTO = 'rsu.central@undc.edu.pe'

const grupos: { titulo: string; roles: Preset['rol'][] }[] = [
  { titulo: 'Estudiante', roles: ['ESTUDIANTE'] },
  { titulo: 'Docente', roles: ['DOCENTE'] },
  { titulo: 'Autoridades', roles: ['DIRECTIVO'] },
  { titulo: 'Administración', roles: ['ADMIN'] },
]

/** Rol al que dirige cada tipo de usuario tras iniciar sesión. */
const RUTA_INICIO: Record<string, string> = {
  ESTUDIANTE: '/',
  DOCENTE: '/docente/carga',
  DIRECTIVO: '/',
  ADMIN: '/',
}

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [correo, setCorreo] = useState(presets[0].correo)
  const [password, setPassword] = useState(PASSWORD)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState('')
  const [meta, setMeta] = useState({ estados: 0, transiciones: 0, roles: 0 })
  // Registro de estudiante desde la pantalla de ingreso (acceso temporal).
  const [creando, setCreando] = useState(false)
  const [escuelas, setEscuelas] = useState<any[]>([])
  const [ciclos, setCiclos] = useState<any[]>([])
  const [nuevoEst, setNuevoEst] = useState({ dni: '', nombres: '', apellidos: '', correo: '', escuela: '', ciclo: '', cicloNum: '' })
  const [creandoBusy, setCreandoBusy] = useState(false)
  const [creandoMsg, setCreandoMsg] = useState<{ ok: boolean; texto: string } | null>(null)

  // Los conteos del panel informativo salen de la base de datos. Se usa el
  // endpoint público porque en esta pantalla todavía no hay token.
  useEffect(() => {
    api
      .get('/api/v1/public/flujo-resumen')
      .then((r: any) =>
        setMeta({
          estados: Number(r?.data?.estados) || 0,
          transiciones: Number(r?.data?.transiciones) || 0,
          roles: Number(r?.data?.roles) || 0,
        }),
      )
      .catch(() => setMeta({ estados: 0, transiciones: 0, roles: 0 }))
  }, [])

  // Al abrir el registro se cargan las escuelas y los ciclos para los selectores.
  useEffect(() => {
    if (!creando) return
    setCreandoMsg(null)
    api.get('/api/v1/escuelas')
      .then((r: any) => setEscuelas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setEscuelas([]))
    api.get('/api/v1/ciclos')
      .then((r: any) => {
        const lista = Array.isArray(r.data) ? r.data : []
        setCiclos(lista)
        // Se preselecciona el ciclo activo: es el que usan los formularios.
        const activo = lista.find((c: any) => c.activo) || lista[0]
        if (activo?.id_ciclo) setNuevoEst(n => ({ ...n, ciclo: String(activo.id_ciclo) }))
      })
      .catch(() => setCiclos([]))
  }, [creando])

  // Crea la persona y su cuenta de acceso. Endpoint público de registro
  // inicial: solo da de alta estudiantes, con contraseña conocida.
  const crearEstudiante = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreandoMsg(null)
    if (!/^\d{8}$/.test(nuevoEst.dni)) { setCreandoMsg({ ok: false, texto: 'El DNI debe tener 8 dígitos.' }); return }
    if (nuevoEst.nombres.trim().length < 2) { setCreandoMsg({ ok: false, texto: 'Escribe los nombres.' }); return }
    if (nuevoEst.correo.trim().length < 5) { setCreandoMsg({ ok: false, texto: 'Escribe el correo.' }); return }
    if (!nuevoEst.ciclo) { setCreandoMsg({ ok: false, texto: 'Selecciona el ciclo académico.' }); return }
    const cicloNum = Number(nuevoEst.cicloNum)
    if (!Number.isInteger(cicloNum) || cicloNum < 1 || cicloNum > 12) {
      setCreandoMsg({ ok: false, texto: 'Indica el ciclo que cursas (entre 1 y 12). Para proponer un SSU el mínimo es el 5.' }); return
    }
    setCreandoBusy(true)
    try {
      // Se genera un código provisional: el backend exige uno y luego el
      // administrador puede corregirlo desde Personas.
      const codigo = 'EST' + nuevoEst.dni.slice(-5)
      await api.post('/api/v1/registro/estudiante', {
        codigo_estudiante: codigo,
        dni: nuevoEst.dni,
        nombres: nuevoEst.nombres.trim(),
        apellidos: nuevoEst.apellidos.trim() || '—',
        correo_institucional: nuevoEst.correo.trim(),
        id_escuela: nuevoEst.escuela ? Number(nuevoEst.escuela) : undefined,
        id_ciclo: Number(nuevoEst.ciclo),
        ciclo_numerico: cicloNum,
      })
      setCreandoMsg({ ok: true, texto: 'Perfil creado con su matrícula en el ciclo. Ya puedes ingresar con tu correo y la contraseña ' + PASSWORD + '.' })
      setNuevoEst({ dni: '', nombres: '', apellidos: '', correo: '', escuela: '', ciclo: nuevoEst.ciclo, cicloNum: '' })
    } catch (ex: any) {
      setCreandoMsg({ ok: false, texto: String(ex?.message || 'No se pudo crear el perfil').replace(/^HTTP \d+: /, '') })
    } finally {
      setCreandoBusy(false)
    }
  }

  const submit = async (e?: React.FormEvent, correoOverride?: string) => {    e?.preventDefault()
    const correoFinal = (correoOverride ?? correo).trim()
    if (!correoFinal) return
    setErr('')
    setLoading(correoFinal)
    try {
      const u = await login(correoFinal, password)
      nav(RUTA_INICIO[u.rol] ?? '/')
    } catch (ex: any) {
      setCorreo(correoFinal)
      setErr(ex?.message?.replace(/^HTTP \d+: /, '') || 'Error al iniciar sesión')
    } finally {
      setLoading('')
    }
  }

  const colorFor = (p: Preset) =>
    p.rol === 'ESTUDIANTE' ? 'text-sky-600' : p.rol === 'DOCENTE' ? 'text-emerald-600' : p.rol === 'ADMIN' ? 'text-slate-900' : 'text-violet-600'

  return (
    <div className="min-h-screen bg-gradient-to-br from-undc-700 via-undc-600 to-slate-900 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-[1.15fr_0.85fr] gap-4 lg:gap-6">
        <div className="bg-white rounded-[24px] lg:rounded-[28px] p-5 sm:p-8 shadow-2xl order-2 lg:order-1">
          <div className="flex items-center gap-3">
            <img src="/logo-undc.svg" alt="Universidad Nacional de Cañete — Facultad de Ingeniería"
                 className="w-12 h-12 sm:w-14 sm:h-14 shrink-0"/>
            <div className="min-w-0">
              <div className="font-black text-lg sm:text-xl leading-none">UNDC RSU</div>
              <div className="text-xs text-slate-500">Responsabilidad Social Universitaria · Facultad de Ingeniería</div>
            </div>
            <span className="ml-auto px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[11px] sm:text-xs font-bold shrink-0">Cañete</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold mt-5">Ingreso rápido por rol</h1>
          <p className="text-sm text-slate-500">
            Elige un rol e ingresa con un clic, o escribe el correo manualmente. Contraseña: <b>{PASSWORD}</b>
          </p>

          {/* Acceso temporal para dar de alta estudiantes desde la pantalla de ingreso. */}
          <button
            type="button"
            onClick={() => setCreando(true)}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-undc-300 text-undc-700 text-sm font-bold hover:bg-undc-50 transition-colors"
          >
            <UserPlus size={16}/> Crear perfil de estudiante
          </button>

          <div className="mt-4 space-y-4 max-h-[42vh] lg:max-h-[46vh] overflow-auto pr-1">
            {grupos.map(g => (
              <div key={g.titulo}>
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">{g.titulo}</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {presets.filter(p => g.roles.includes(p.rol)).map(p => (
                    <button
                      key={p.correo}
                      type="button"
                      disabled={loading !== ''}
                      onClick={() => submit(undefined, p.correo)}
                      className={`text-left border rounded-2xl p-3 flex gap-3 items-center transition-all disabled:opacity-60 ${
                        loading === p.correo
                          ? 'border-undc-600 bg-undc-50 ring-2 ring-undc-600'
                          : correo === p.correo
                            ? 'border-undc-300 bg-undc-50/60 hover:bg-slate-50'
                            : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl grid place-items-center text-white shrink-0 ${p.color}`}>
                        {loading === p.correo ? <Loader2 size={16} className="animate-spin" /> : p.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold leading-tight truncate">{p.label}</div>
                        <div className="text-xs text-slate-500 leading-tight truncate">{p.desc}</div>
                        <div className={`text-[11px] font-mono truncate ${colorFor(p)}`}>{p.correo}</div>
                      </div>
                      <LogIn size={14} className="shrink-0 text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> o ingresa manualmente <span className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Correo institucional</label>
                <input
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 focus:border-undc-600 outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Contraseña</label>
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 focus:border-undc-600 outline-none text-sm"
                  required
                />
              </div>
            </div>
            {err && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5 flex gap-2">
                <span className="font-bold">No se pudo ingresar:</span>
                <span>{err}</span>
              </div>
            )}
            <button
              disabled={loading !== ''}
              className="w-full py-3 bg-undc-700 hover:bg-undc-900 disabled:opacity-60 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              {loading ? 'Ingresando…' : 'Entrar al sistema RSU'}
            </button>
          </form>
        </div>

        <div className="text-white flex flex-col justify-center p-1 sm:p-4 order-1 lg:order-2">
          <h2 className="text-2xl sm:text-3xl font-black leading-tight">
            Responsabilidad Social
            <br />
            Universitaria
          </h2>
          <p className="text-white/80 mt-3 text-sm leading-relaxed">
            Cada cambio de estado exige rol responsable y evidencia. El flujo se valida contra la matriz de
            transiciones de la base de datos.
          </p>

          {meta.estados > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { n: meta.estados, l: 'Estados' },
                { n: meta.transiciones, l: 'Transiciones' },
                { n: meta.roles, l: 'Roles' },
              ].map(k => (
                <div key={k.l} className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
                  <div className="text-lg sm:text-2xl font-black leading-none">{k.n}</div>
                  <div className="text-[10px] uppercase tracking-wide opacity-70 mt-1">{k.l}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 space-y-3 hidden lg:block">
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <div className="font-bold flex items-center gap-2"><GraduationCap size={16} /> Estudiante</div>
              <div className="text-sm opacity-80 mt-1">
                Propone en <b>BORRADOR</b>, ejecuta actividades, acumula horas, justifica faltas y solicita
                constancia. Solo ve <b>sus</b> proyectos.
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <div className="font-bold flex items-center gap-2"><Users size={16} /> Docente</div>
              <div className="text-sm opacity-80 mt-1">
                Asesora, programa actividades de campo, registra monitoreo y verifica entregables
                (APROBADO / OBSERVADO).
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <div className="font-bold flex items-center gap-2"><Shield size={16} /> Directivo / Supervisor</div>
              <div className="text-sm opacity-80 mt-1">
                Bandeja por estado: Escuela V°B°, priorización Facultad, expedientey presupuesto, reportes SUNEDU.
              </div>
            </div>
          </div>

          {/* ── Nota de prueba: cuenta oculta ── */}
          <div className="mt-5 bg-amber-400/10 border border-amber-300/30 rounded-2xl p-4">
            <div className="font-bold text-xs uppercase tracking-wide text-amber-200">Nota de prueba</div>
            <p className="text-[13px] opacity-90 mt-1.5 leading-relaxed">
              Existe la cuenta oculta <b className="font-mono">{NOTA_USUARIO_OCULTO}</b> (rol <i>RSU Central / VRA</i>).
              No aparece como acceso rápido porque, según las normas del RSU, la DRSU Central y la Vicepresidencia
              Académica <b>no operan el sistema</b>: expiden sus documentos fuera de la plataforma, por Mesa de Partes.
              Quien los <b>sube y registra</b> es el encargado, la Dirección de RSU de la Facultad, para que el
              proyecto pase a ejecución. Esta cuenta existe solo para testear ese paso de la subida de documentos.
            </p>
          </div>
        </div>
      </div>

      {/* ── Registro de estudiante (acceso temporal) ── */}
      {creando && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
             onClick={() => !creandoBusy && setCreando(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900">Crear perfil de estudiante</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Queda con acceso al sistema. La contraseña inicial es <b>{PASSWORD}</b>.
                </p>
              </div>
              <button onClick={() => setCreando(false)} aria-label="Cerrar"
                      className="w-9 h-9 rounded-full bg-slate-100 grid place-items-center shrink-0 hover:bg-slate-200">
                <X size={16}/>
              </button>
            </div>

            <form onSubmit={crearEstudiante} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">DNI *</label>
                <input inputMode="numeric" maxLength={8} value={nuevoEst.dni}
                       onChange={e => setNuevoEst({ ...nuevoEst, dni: e.target.value.replace(/\D/g, '') })}
                       className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-undc-600"
                       placeholder="12345678"/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Nombres *</label>
                  <input value={nuevoEst.nombres} onChange={e => setNuevoEst({ ...nuevoEst, nombres: e.target.value })}
                         className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-undc-600"
                         placeholder="Ana María"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Apellidos</label>
                  <input value={nuevoEst.apellidos} onChange={e => setNuevoEst({ ...nuevoEst, apellidos: e.target.value })}
                         className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-undc-600"
                         placeholder="Quispe Rojas"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Correo institucional *</label>
                <input type="email" value={nuevoEst.correo} onChange={e => setNuevoEst({ ...nuevoEst, correo: e.target.value })}
                       className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-undc-600"
                       placeholder="nombre@undc.edu.pe"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Escuela</label>
                <select value={nuevoEst.escuela} onChange={e => setNuevoEst({ ...nuevoEst, escuela: e.target.value })}
                        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-undc-600 bg-white">
                  <option value="">-- opcional --</option>
                  {escuelas.map(s => <option key={s.id_escuela} value={String(s.id_escuela)}>{s.nombre}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Ciclo académico *</label>
                  <select value={nuevoEst.ciclo} onChange={e => setNuevoEst({ ...nuevoEst, ciclo: e.target.value })}
                          className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-undc-600 bg-white">
                    <option value="">-- seleccionar --</option>
                    {ciclos.map(c => <option key={c.id_ciclo} value={String(c.id_ciclo)}>
                      {c.nombre}{c.activo ? ' (activo)' : ''}
                    </option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Ciclo que cursa *</label>
                  <input inputMode="numeric" maxLength={2} value={nuevoEst.cicloNum}
                         onChange={e => setNuevoEst({ ...nuevoEst, cicloNum: e.target.value.replace(/\D/g, '') })}
                         className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-undc-600"
                         placeholder="5"/>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Para proponer un SSU el mínimo es el <b>ciclo 5</b>.
                  </div>
                </div>
              </div>

              {creandoMsg && (
                <div className={`text-xs rounded-xl p-3 border ${creandoMsg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {creandoMsg.texto}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                <button type="button" onClick={() => setCreando(false)} disabled={creandoBusy}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50">
                  <ArrowLeft size={15}/> Volver al ingreso
                </button>
                <button type="submit" disabled={creandoBusy}
                        className="px-4 py-2.5 bg-undc-700 text-white rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
                  {creandoBusy && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  {creandoBusy ? 'Creando…' : 'Crear perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}