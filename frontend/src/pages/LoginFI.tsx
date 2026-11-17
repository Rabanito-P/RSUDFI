import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, LogIn, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { LluviaBinaria } from '../components/BinRain'

/**
 * Nuevo ingreso de la Plataforma RSU FI (ruta /p/login).
 *
 * Login normal: correo + contraseña + Ingresar. El acceso con Google
 * queda maquetado pero sin backend (se avisa al pulsarlo). El login
 * demo anterior (/login) se conserva intacto en paralelo.
 */

/** Rol al que dirige cada tipo de usuario tras iniciar sesión. */
const RUTA_INICIO: Record<string, string> = {
  ESTUDIANTE: '/',
  DOCENTE: '/docente/carga',
  DIRECTIVO: '/',
  ADMIN: '/',
}

/** Logo oficial de Google (marca reconocible, trazo del SVG oficial). */
function LogoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

export default function LoginFI() {
  const { user, login } = useAuth()
  const nav = useNavigate()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [err, setErr] = useState('')
  const [aviso, setAviso] = useState('')
  const [cargando, setCargando] = useState(false)

  // Ya con sesión: nada que hacer aquí.
  if (user) {
    return <Navigate to={RUTA_INICIO[user.rol] ?? '/'} replace />
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!correo.trim() || !clave) return
    setErr('')
    setCargando(true)
    try {
      const u = await login(correo.trim(), clave)
      nav(RUTA_INICIO[u.rol] ?? '/', { replace: true })
    } catch (ex: any) {
      setErr(
        ex?.message?.replace(/^HTTP \d+: /, '') ||
          'No se pudo iniciar sesión. Revisa tus datos.',
      )
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      {/* ── Panel institucional (izquierda, solo escritorio) ── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0F2D4A] p-10 text-white lg:flex xl:p-14">
        {/* Lluvia binaria tenue sobre el fondo oscuro */}
        <LluviaBinaria color="text-slate-300/20" className="lg:block" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <img
              src="/favicon-fi.png"
              alt="Sello de la Universidad Nacional de Cañete"
              className="h-12 w-12 rounded-lg bg-white/95 object-contain p-1"
            />
            <div className="leading-tight">
              <div className="text-lg font-bold tracking-tight">FI UNDC</div>
              <div className="text-xs font-medium uppercase tracking-widest text-white/60">
                Plataforma RSU
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="text-2xl font-bold leading-snug xl:text-3xl">
            Cada línea de código que escribes puede dejar algo en tu comunidad.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Ingresa y continúa tu Servicio Social Universitario: cada hora que
            registras forma parte de tu formación como profesional comprometido
            con Cañete.
          </p>
        </div>

        <p className="relative text-xs text-white/40">
          © 2026 Facultad de Ingeniería — Universidad Nacional de Cañete
        </p>
      </aside>

      {/* ── Formulario de ingreso ── */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Marca compacta (móvil: es la única visible) */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:justify-start">
            <img
              src="/favicon-fi.png"
              alt="Sello de la Universidad Nacional de Cañete"
              className="h-11 w-11 rounded-lg bg-white object-contain p-1 shadow-sm lg:hidden"
            />
            <div className="leading-tight">
              <div className="text-lg font-bold tracking-tight text-[#0F2D4A]">
                FI UNDC
              </div>
              <div className="text-[11px] font-medium uppercase tracking-widest text-[#475569]">
                Plataforma RSU
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-bold text-[#1E293B] sm:text-2xl">
              Iniciar sesión
            </h1>
            <p className="mt-1.5 text-sm text-[#475569]">
              Ingresa con tu cuenta institucional de la UNDC.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="correo"
                  className="text-xs font-semibold text-[#475569]"
                >
                  Correo institucional
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="correo"
                    type="email"
                    autoComplete="username"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="nombre@undc.edu.pe"
                    required
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#1E293B] outline-none transition-colors placeholder:text-slate-400 focus:border-[#1D5B96] focus:ring-2 focus:ring-[#1D5B96]/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="clave"
                    className="text-xs font-semibold text-[#475569]"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setAviso(
                        'La recuperación de contraseña estará disponible próximamente; por ahora solicítala a fi@undc.edu.pe.',
                      )
                    }
                    className="text-xs font-medium text-[#1D5B96] transition-colors hover:text-[#0F2D4A]"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="clave"
                    type={verClave ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder="Tu contraseña"
                    required
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-10 text-sm text-[#1E293B] outline-none transition-colors placeholder:text-slate-400 focus:border-[#1D5B96] focus:ring-2 focus:ring-[#1D5B96]/20"
                  />
                  <button
                    type="button"
                    aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setVerClave((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:text-[#475569]"
                  >
                    {verClave ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {err && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {err}
                </div>
              )}
              {aviso && (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
                  {aviso}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F2D4A] py-3 font-medium text-white transition-colors hover:bg-[#18426B] disabled:opacity-60"
              >
                {cargando ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <LogIn size={17} />
                )}
                {cargando ? 'Ingresando…' : 'Ingresar'}
              </button>

              {/* Separador + OAuth de Google (solo vista) */}
              <div className="flex items-center gap-3 pt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <span className="h-px flex-1 bg-[#E2E8F0]" /> o{' '}
                <span className="h-px flex-1 bg-[#E2E8F0]" />
              </div>
              <button
                type="button"
                onClick={() =>
                  setAviso(
                    'El acceso con Google estará disponible próximamente. Usa tu correo y contraseña institucional.',
                  )
                }
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#E2E8F0] bg-white py-3 text-sm font-medium text-[#1E293B] transition-colors hover:bg-[#F5F7FA]"
              >
                <LogoGoogle />
                Continuar con Google
              </button>
            </form>
          </div>

          <a
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#475569] transition-colors hover:text-[#0F2D4A]"
          >
            <ArrowLeft size={15} /> Volver a la portada
          </a>
        </div>
      </main>
    </div>
  )
}
