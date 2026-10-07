import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Users, Shield, KeyRound } from 'lucide-react'

const presets = [
  { correo:'estudiante@undc.edu.pe', label:'Estudiante Proponente', rol:'ESTUDIANTE', color:'bg-sky-600', desc:'Crea borrador · sube perfil · horas/créditos' },
  { correo:'docente@undc.edu.pe', label:'Docente Responsable', rol:'DOCENTE', color:'bg-emerald-600', desc:'Asesora · monitorea · verifica entregables' },
  { correo:'escuela@undc.edu.pe', label:'Dir. Escuela', rol:'DIRECTIVO', color:'bg-amber-600', desc:'Revisa → V°B° Escuela' },
  { correo:'rsfacultad@undc.edu.pe', label:'Dir. RS Facultad', rol:'DIRECTIVO', color:'bg-orange-600', desc:'Prioriza facultad' },
  { correo:'consejo@undc.edu.pe', label:'Consejo Facultad', rol:'DIRECTIVO', color:'bg-violet-600', desc:'Dictamina → Resolución' },
  { correo:'central@undc.edu.pe', label:'Dir. Central RS / VRA', rol:'DIRECTIVO', color:'bg-undc-700', desc:'Reportes y seguimiento' },
]

export default function Login(){
  const { login } = useAuth()
  const nav = useNavigate()
  const [correo,setCorreo]=useState('estudiante@undc.edu.pe')
  const [password,setPassword]=useState('123456')
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)

  const submit = async (e:React.FormEvent)=>{
    e.preventDefault()
    setErr(''); setLoading(true)
    try{ await login(correo,password); nav('/') }catch(ex:any){ setErr(ex.message||'Error login') } finally{ setLoading(false)}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-undc-700 via-undc-600 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="bg-white rounded-[28px] p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-undc-700 grid place-items-center text-white font-black">U</div>
            <div>
              <div className="font-black text-xl leading-none">UNDC RSU</div>
              <div className="text-xs text-slate-500">Universidad Nacional de Cañete</div>
            </div>
            <span className="ml-auto px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Cañete</span>
          </div>

          <h1 className="text-2xl font-extrabold mt-6">Ingresar por rol</h1>
          <p className="text-sm text-slate-500">Selecciona tu rol. Password demo: <b>123456</b> o <b>undc2026</b></p>

          <div className="grid sm:grid-cols-2 gap-2 mt-4">
            {presets.map(p=>(
              <button key={p.correo} onClick={()=>setCorreo(p.correo)} className={`text-left border rounded-2xl p-3 flex gap-3 items-center ${correo===p.correo?'border-undc-600 bg-undc-50 ring-2 ring-undc-600':'border-slate-200 hover:bg-slate-50'}`}>
                <div className={`w-9 h-9 rounded-xl grid place-items-center text-white ${p.color}`}>{p.rol==='ESTUDIANTE'?<GraduationCap size={16}/>:p.rol==='DOCENTE'?<Users size={16}/>:<Shield size={16}/>}</div>
                <div>
                  <div className="text-sm font-bold leading-tight">{p.label}</div>
                  <div className="text-xs text-slate-500 leading-tight">{p.desc}</div>
                  <div className="text-[11px] font-mono text-slate-400">{p.correo}</div>
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Correo institucional</label>
              <input value={correo} onChange={e=>setCorreo(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 focus:border-undc-600 outline-none text-sm"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Contraseña</label>
              <input value={password} type="password" onChange={e=>setPassword(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 focus:border-undc-600 outline-none text-sm"/>
            </div>
            {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">{err}</div>}
            <button disabled={loading} className="w-full py-3 bg-undc-700 hover:bg-undc-900 text-white rounded-xl font-bold flex items-center justify-center gap-2">
              <KeyRound size={16}/> {loading?'Ingresando...':'Entrar al sistema RSU'}
            </button>
            <div className="text-xs text-slate-400 text-center">Demo: roles, estados y transiciones</div>
          </form>
        </div>

        <div className="text-white flex flex-col justify-center p-4">
          <h2 className="text-3xl font-black leading-tight">Responsabilidad Social<br/>Universitaria</h2>
          <p className="text-white/80 mt-3 text-sm leading-relaxed">Flujo validado. Cada cambio exige rol y documento. Tres experiencias diferenciadas:</p>
          <div className="mt-6 space-y-3">
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10"><div className="font-bold flex items-center gap-2"><GraduationCap size={16}/> Estudiante</div><div className="text-sm opacity-80 mt-1">Propone en <b>BORRADOR</b>, completa perfil, ejecuta actividades, acumula horas/créditos, justifica faltas y solicita constancia. Solo ve <b>sus</b> proyectos.</div></div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10"><div className="font-bold flex items-center gap-2"><Users size={16}/> Docente</div><div className="text-sm opacity-80 mt-1">Asesora, programa actividades de campo, registra monitoreo y verifica entregables (APROBADO/OBSERVADO/RECHAZADO).</div></div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10"><div className="font-bold flex items-center gap-2"><Shield size={16}/> Directivo / Supervisor</div><div className="text-sm opacity-80 mt-1">Bandeja por estado: Escuela V°B°, priorización Facultad, dictamen Consejo y reportes.</div></div>
          </div>
          <div className="mt-6 text-xs opacity-60">Tus proyectos y reportes disponibles</div>
        </div>
      </div>
    </div>
  )
}
