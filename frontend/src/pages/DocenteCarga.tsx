import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Wallet, Clock, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react'

export default function DocenteCarga(){
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mi carga RSU"
        subtitle="Horas asignadas vs carga_no_lectiva_max — validación Art.86 Ley 30220. Ciclo 2026-I activo. Fuente: RSU_Asignacion_Docente (APROBADA)."
        icon={<Wallet size={20}/>}
        badge={<span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold">Límite 8h</span>}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12}/> Asignadas 2026-I</div>
          <div className="text-2xl font-black">6.5 <span className="text-base font-normal text-slate-500">/ 8 h</span></div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-undc-700" style={{width:'81%'}}/></div>
          <div className="text-xs text-emerald-700 mt-1">Quedan 1.5h disponibles</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Proyectos activos</div>
          <div className="text-2xl font-black">3</div>
          <div className="text-xs text-slate-500">2 en ejecución · 1 aprobado</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Estado validación</div>
          <div className="flex items-center gap-1.5 mt-1 text-emerald-700 font-bold"><CheckCircle size={16}/> Conforme</div>
          <div className="text-xs text-slate-500">Sin exceso Art.86</div>
        </Card>
      </div>

      <Card hover>
        <CardHeader>
          <CardTitle><BookOpen size={16}/> Detalle asignaciones por proyecto — RSU_Asignacion_Docente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            {codigo:'RSU-2026-007', rol:'Asesor', horas:4, ciclo:'2026-I', estado:'APROBADA', tipo:'NO_LECTIVA'},
            {codigo:'RSU-2026-011', rol:'Responsable', horas:2.5, ciclo:'2026-I', estado:'APROBADA', tipo:'NO_LECTIVA'},
            {codigo:'RSU-2026-009', rol:'Colaborador', horas:0, ciclo:'2026-I', estado:'PENDIENTE', tipo:'NO_LECTIVA'},
          ].map(a=>(
            <div key={a.codigo} className="border border-slate-200 rounded-xl p-3 flex justify-between items-center">
              <div>
                <div className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded-lg inline-block">{a.codigo}</div>
                <div className="font-semibold text-sm mt-1">{a.rol} · {a.horas}h {a.tipo} · Ciclo {a.ciclo}</div>
              </div>
              <Badge color={a.estado==='APROBADA'?'#10b981':'#f59e0b'} variant="soft">{a.estado}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-5 text-sm flex gap-2">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5"/>
          <div>
            <b>Validación backend:</b> Al asignar, el servicio suma <code>SUM(horas_asignadas)</code> donde tipo=NO_LECTIVA y estado=APROBADA para el docente en el ciclo. Si excede <b>carga_no_lectiva_max</b>, rechaza con error 400.
            <div className="text-xs text-slate-600 mt-1">Prueba API: <code>POST /api/v1/asignaciones/docente</code> con 5h extra → debe fallar (quedan 1.5h).</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
