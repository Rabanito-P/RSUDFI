import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Settings, Layers, Target, Flag, Users, FileText, HelpCircle, GitBranch } from 'lucide-react'

export default function Catalogos(){
  const [data,setData]=useState<any>({tipos:[], lineas:[], estados:[], roles:[], docs:[], preguntas:[], trans:[]})
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    Promise.allSettled([
      api.get('/api/v1/catalogos/tipos-proyecto').then((r:any)=> setData((d:any)=> ({...d, tipos:r.data||d.tipos}))),
      api.get('/api/v1/catalogos/lineas-accion').then((r:any)=> setData((d:any)=> ({...d, lineas:r.data||d.lineas}))),
      api.get('/api/v1/catalogos/estados').then((r:any)=> setData((d:any)=> ({...d, estados:r.data||d.estados}))),
      api.get('/api/v1/catalogos/roles-actor').then((r:any)=> setData((d:any)=> ({...d, roles:r.data||d.roles}))),
      api.get('/api/v1/catalogos/tipos-documento').then((r:any)=> setData((d:any)=> ({...d, docs:r.data||d.docs}))),
      api.get('/api/v1/catalogos/preguntas-encuesta').then((r:any)=> setData((d:any)=> ({...d, preguntas:r.data||d.preguntas}))),
      api.get('/api/v1/catalogos/transiciones').then((r:any)=> setData((d:any)=> ({...d, trans:r.data||d.trans}))),
    ]).finally(()=> setLoading(false))
    // demo fallback if needed
    setTimeout(()=> setData((d:any)=> ({
      tipos: d.tipos.length? d.tipos : [{id_tipo:1,nombre:'Proyección Social', ciclo_minimo_estudiante:5},{id_tipo:2,nombre:'Extensión Universitaria', ciclo_minimo_estudiante:3},{id_tipo:3,nombre:'Voluntariado', ciclo_minimo_estudiante:1},{id_tipo:4,nombre:'Investigación Aplicada', ciclo_minimo_estudiante:7}],
      lineas: d.lineas.length? d.lineas : [{id_linea:1,nombre:'Salud y Bienestar Comunitario', alineacion_ods:'ODS 3'},{id_linea:2,nombre:'Educación y Cultura', alineacion_ods:'ODS 4'},{id_linea:3,nombre:'Gestión Ambiental', alineacion_ods:'ODS 13'}],
      estados: d.estados.length? d.estados : Array.from({length:16}).map((_,i)=> ({id_estado:i+1, codigo:['BORRADOR','EN_REVISION_ESCUELA','CON_VB_ESCUELA','EN_PRIORIZACION_FACULTAD','EN_DICTAMEN_CONSEJO','APROBADO_CON_RESOLUCION','EN_ASIGNACION_CARGA','REGISTRADO_OFICIAL','EN_EJECUCION','EN_MONITOREO','INFORME_FINAL_PRESENTADO','CON_CONFORMIDAD_ESCUELA','CERRADO','EN_EVALUACION_IMPACTO','EVALUACION_VALIDADA','REPORTADO'][i], nombre:['Borrador','En revisión Escuela','Con V°B° Escuela','En priorización Facultad','En dictamen Consejo','Aprobado con Resolución','En asignación carga','Registrado oficialmente','En ejecución','En monitoreo','Informe final presentado','Con conformidad Escuela','Cerrado','En evaluación impacto','Evaluación validada','Reportado'][i], orden_flujo:i+1, color_ui:['#9E9E9E','#FFC107','#FF9800','#FF5722','#3F51B5','#4CAF50','#009688','#00BCD4','#2196F3','#03A9F4','#8BC34A','#CDDC39','#607D8B','#9C27B0','#673AB7','#212121'][i]})),
      roles: d.roles.length? d.roles : [{id_rol_actor:1,codigo:'DOCENTE_RESP',nombre:'Docente Responsable'},{id_rol_actor:3,codigo:'ESTUDIANTE_PROP',nombre:'Estudiante Proponente'},{id_rol_actor:5,codigo:'DIR_ESCUELA',nombre:'Director Escuela'}],
      docs: d.docs.length? d.docs : [{id_tipo_doc:1,nombre:'Perfil de Proyecto', etapa:'FORMULACION'},{id_tipo_doc:7,nombre:'Ficha de Asistencia', etapa:'EJECUCION'}],
      preguntas: d.preguntas.length? d.preguntas : [{id_pregunta:1,codigo:'P01', texto_pregunta:'Utilidad', dimension:'UTILIDAD', orden:1}],
      trans: d.trans
    })), 700)
  },[])

  if(loading) return <div className="space-y-3"><Skeleton className="h-20 w-full"/><Skeleton className="h-64 w-full"/></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Catálogos"
        subtitle="Tipos, líneas, estados, roles, tipos de documento y preguntas."
        icon={<Settings size={20}/>}
        badge={<span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-xs font-bold">6 catálogos</span>}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card hover>
          <CardHeader><CardTitle><Target size={16} className="text-undc-700"/> Tipos de proyecto</CardTitle><p className="text-xs text-slate-500">Tipo de proyecto — ciclo mínimo</p></CardHeader>
          <CardContent className="space-y-2">
            {data.tipos.map((t:any)=>(
              <div key={t.id_tipo} className="border border-slate-200 rounded-xl px-3 py-2.5 flex justify-between items-center">
                <span className="font-semibold text-sm">{t.nombre}</span>
                <span className="text-xs px-2 py-1 bg-undc-50 border border-undc-200 text-undc-700 rounded-full">ciclo ≥{t.ciclo_minimo_estudiante}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader><CardTitle><Layers size={16} className="text-undc-700"/> Líneas de acción ODS</CardTitle><p className="text-xs text-slate-500">Línea de acción — alineación ODS</p></CardHeader>
          <CardContent className="space-y-2">
            {data.lineas.map((l:any)=>(
              <div key={l.id_linea} className="border border-slate-200 rounded-xl px-3 py-2.5 flex justify-between">
                <span className="font-medium text-sm">{l.nombre}</span><Badge color="#1b5e20" variant="soft">{l.alineacion_ods}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card hover>
        <CardHeader><CardTitle><Flag size={16}/> Estados</CardTitle><p className="text-xs text-slate-500">Flujo 1→16 · Transiciones validadas</p></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {data.estados.map((e:any)=>(
              <span key={e.id_estado} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-white" style={{borderColor: e.color_ui, color: e.color_ui}}>
                <span className="w-2 h-2 rounded-full" style={{background:e.color_ui}}/>{e.orden_flujo}. {e.nombre}
              </span>
            ))}
          </div>
          <div className="mt-3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5">Flujo: BORRADOR → EN_REVISION_ESCUELA → CON_VB_ESCUELA → EN_PRIORIZACION_FACULTAD → EN_DICTAMEN_CONSEJO → APROBADO_CON_RESOLUCION → EN_ASIGNACION_CARGA → REGISTRADO_OFICIAL → EN_EJECUCION → EN_MONITOREO → INFORME_FINAL_PRESENTADO → CON_CONFORMIDAD_ESCUELA → CERRADO → EN_EVALUACION_IMPACTO → EVALUACION_VALIDADA → REPORTADO</div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card hover>
          <CardHeader><CardTitle><Users size={16}/> Roles</CardTitle><p className="text-xs text-slate-500">Rol — DOCENTE / ESTUDIANTE / AUTORIDAD / COMITE</p></CardHeader>
          <CardContent className="grid grid-cols-1 gap-2">
            {data.roles.map((r:any)=>(
              <div key={r.id_rol_actor} className="border border-slate-200 rounded-xl px-3 py-2 flex justify-between items-center">
                <span className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded">{r.codigo}</span><span className="text-sm">{r.nombre}</span><Badge color="#607D8B" variant="soft">{r.tipo || '—'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card hover>
          <CardHeader><CardTitle><FileText size={16}/> Tipos documento</CardTitle><p className="text-xs text-slate-500">Tipo de documento — obligatorio, etapa</p></CardHeader>
          <CardContent className="space-y-2">
            {data.docs.map((d:any)=>(
              <div key={d.id_tipo_doc} className="border border-slate-200 rounded-xl px-3 py-2 flex justify-between">
                <span className="text-sm font-medium">{d.nombre}</span><Badge color={d.etapa==='FORMULACION'?'#3f51b5': d.etapa==='EJECUCION'?'#009688':'#9c27b0'} variant="soft">{d.etapa}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card hover>
          <CardHeader><CardTitle><HelpCircle size={16}/> Preguntas encuesta P01-P06</CardTitle><p className="text-xs text-slate-500">Pregunta — Likert 1-5 por dimensión</p></CardHeader>
          <CardContent className="space-y-2">
            {(data.preguntas.length? data.preguntas : [{id_pregunta:1,codigo:'P01', texto_pregunta:'¿Utilidad del proyecto para resolver su necesidad?', dimension:'UTILIDAD'},{id_pregunta:6,codigo:'P06', texto_pregunta:'¿Impacto en vida diaria?', dimension:'IMPACTO'}]).map((p:any)=>(
              <div key={p.id_pregunta} className="border border-slate-200 rounded-xl p-3">
                <div className="flex gap-2"><Badge variant="soft" color="#673AB7">{p.codigo}</Badge><Badge variant="soft" color="#1b5e20">{p.dimension}</Badge></div>
                <div className="text-sm mt-1">{p.texto_pregunta}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card hover>
          <CardHeader><CardTitle><GitBranch size={16}/> Transiciones</CardTitle><p className="text-xs text-slate-500">Transición — origen → destino + rol + requiere documento</p></CardHeader>
          <CardContent>
            {data.trans?.length ? (
              <div className="space-y-1 max-h-64 overflow-auto text-xs">
                {data.trans.map((t:any)=>(
                  <div key={t.id_transicion} className="border border-slate-200 rounded-lg px-2.5 py-2 flex gap-2">
                    <span>{t.estado_origen} → {t.estado_destino}</span><span className="ml-auto font-mono bg-slate-100 px-1.5 py-0.5 rounded">rol {t.id_rol_actor}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">La matriz completa de transiciones está llena vía seed. Ejemplo: BORRADOR (1) → EN_REVISION_ESCUELA (2) requiere ESTUDIANTE_PROP (3). Validación en <code>POST /proyectos/:id/transicion</code>.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
