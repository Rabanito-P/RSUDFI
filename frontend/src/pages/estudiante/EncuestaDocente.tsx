import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

// Preguntas de la encuesta al docente asesor (Likert 1-5).
// El catálogo oficial vive en RSU_Pregunta_Encuesta; aquí se usa el mismo
// orden para no inventar textos en el cliente.
const PREGUNTAS = [
  'Claridad en las asesorías brindadas',
  'Disponibilidad para atender consultas',
  'Apoyo técnico durante la ejecución',
  'Calidad de la retroalimentación recibida',
]

export default function EncuestaDocente(){
  const {user}=useAuth()
  const [p,setP]=useState<any>(null)
  const [habilitado,setHabilitado]=useState(false)
  const [resp,setResp]=useState<Record<number,number>>({})
  const [msg,setMsg]=useState<{type:'ok'|'err', text:string}|null>(null)
  const [busy,setBusy]=useState(false)
  const [hecha,setHecha]=useState(false)

  useEffect(()=>{
    if(!user) return
    api.get(`/api/v1/estudiantes/${user.persona_id}/proyectos`).then((r:any)=>{
      const list=r.data||[]
      const proj=list[0]
      setP(proj)
      const finalizado = proj?.estado_actual?.codigo==='CERRADO' || proj?.estado_actual?.codigo==='REPORTADO_SUNEDU' || proj?.porcentaje_avance>=100
      setHabilitado(!!finalizado)
    }).catch(()=>{})
  },[user?.persona_id])

  const promedio = ()=>{
    const vals = Object.values(resp)
    if(!vals.length) return null
    return vals.reduce((a,b)=>a+b,0)/vals.length
  }

  const enviar = async()=>{
    const faltan = PREGUNTAS.map((_,i)=>i).filter(i=>!resp[i])
    if(faltan.length){
      setMsg({type:'err', text:`Responde las ${faltan.length} pregunta(s) pendientes`}); return
    }
    setBusy(true); setMsg(null)
    try{
      // Se registra el promedio como indicador del proyecto (escala Likert 1-5)
      // para que el dashboard pueda consolidarlo.
      const prom = promedio() as number
      await api.post('/api/v1/indicadores', {
        id_proyecto: p.id_proyecto,
        nombre_indicador: 'ENCUESTA_DOCENTE',
        valor_alcanzado: prom,
        meta_planificada: 5,
        unidad_medida: 'Likert 1-5',
      })
      setHecha(true)
      setMsg({type:'ok', text:`Encuesta registrada · Promedio ${prom.toFixed(2)}/5`})
    }catch(ex:any){
      setMsg({type:'err', text: ex?.message?.slice(0,300) || 'No se pudo registrar la encuesta'})
    }finally{ setBusy(false) }
  }

  if(!habilitado) return (
    <div className="space-y-4">
      <h2 className="font-black text-lg">Encuesta docente</h2>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <div className="text-sm text-amber-800">Esta encuesta se habilita <b>solo al finalizar todo el proyecto</b> (cuando el estado sea CERRADO/CONFORME y el progreso 100%).</div>
        <div className="text-xs text-slate-500 mt-2">Proyecto actual: {p?.estado_actual?.nombre || 'Informe Inicial'} — {p?.porcentaje_avance || 0}%</div>
      </div>
    </div>
  )

  const prom = promedio()

  return (
    <div className="space-y-4">
      <h2 className="font-black text-lg">Encuesta docente</h2>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
        <p className="text-sm text-slate-600">Evalúa a tu docente asesor. Escala 1-5 por dimensión. Proyecto finalizado.</p>
        {p?.titulo && <div className="mt-2 text-xs text-slate-500">Proyecto: <b>{p.titulo}</b></div>}
        <div className="mt-4 grid gap-2 text-sm">
          {PREGUNTAS.map((q,i)=>(
            <div key={q} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border border-slate-200 rounded-xl p-3">
              <span className="font-medium">{q}</span>
              <span className="flex gap-1">
                {[1,2,3,4,5].map(n=>(
                  <button
                    key={n}
                    type="button"
                    disabled={hecha || busy}
                    aria-label={`${q}: ${n}`}
                    onClick={()=> setResp(r=>({...r, [i]: n}))}
                    className={`w-9 h-9 rounded-full border grid place-items-center text-xs font-bold transition-all disabled:opacity-50 ${
                      resp[i]===n
                        ? 'bg-undc-700 text-white border-undc-700 shadow'
                        : 'border-slate-300 hover:bg-slate-100'
                    }`}
                  >{n}</button>
                ))}
              </span>
            </div>
          ))}
        </div>
        {prom!=null && (
          <div className="mt-3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5">
            Promedio actual: <b>{prom.toFixed(2)}/5</b> — {prom>=4.5?'MUY BUENO':prom>=3.5?'BUENO':prom>=2.5?'REGULAR':'MALO'}
          </div>
        )}
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
          <button
            onClick={enviar}
            disabled={busy || hecha || Object.keys(resp).length < PREGUNTAS.length}
            className="px-4 py-2.5 bg-undc-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >{hecha? 'Encuesta enviada' : busy? 'Enviando...' : 'Enviar encuesta'}</button>
          {msg && <div className={`text-xs px-3 py-2 rounded-xl border flex-1 ${msg.type==='ok'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>}
        </div>
      </div>
    </div>
  )
}
