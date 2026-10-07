import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Clock, Award, BookOpen, TrendingUp, Calendar, AlertCircle } from 'lucide-react'

export default function EstudianteHoras(){
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mis horas y créditos"
        subtitle="RSU_Participante_Estudiante — horas_acumuladas, creditos_otorgados, estado INSCRITO/ACTIVO/RETIRADO/FINALIZADO, validacion_ciclo. Base para constancia y bachiller."
        icon={<Clock size={20}/>}
        badge={<span className="px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-700 rounded-full text-xs font-bold">3 proyectos · 42h</span>}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 text-center border-sky-200 bg-sky-50/50">
          <Clock size={20} className="mx-auto text-sky-600"/>
          <div className="text-2xl font-black mt-1">42 h</div>
          <div className="text-xs text-slate-500">Horas acumuladas</div>
          <div className="text-xs font-bold text-sky-700 mt-1">RSU_Participante_Estudiante</div>
        </Card>
        <Card className="p-5 text-center border-violet-200 bg-violet-50/50">
          <Award size={20} className="mx-auto text-violet-600"/>
          <div className="text-2xl font-black mt-1">3.0</div>
          <div className="text-xs text-slate-500">Créditos otorgados</div>
          <div className="text-xs font-bold text-violet-700 mt-1">HU-058 bachiller</div>
        </Card>
        <Card className="p-5 text-center">
          <BookOpen size={20} className="mx-auto text-undc-700"/>
          <div className="text-2xl font-black mt-1">3</div>
          <div className="text-xs text-slate-500">Proyectos participados</div>
          <div className="text-xs text-slate-500">líder o miembro equipo</div>
        </Card>
      </div>

      <Card hover>
        <CardHeader>
          <CardTitle><TrendingUp size={16}/> Detalle por proyecto</CardTitle>
          <p className="text-xs text-slate-500">Horas por actividad de campo (RSU_Actividad_Campo.minutos) sumadas → horas_acumuladas</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            {codigo:'RSU-2026-007', titulo:'Taller emprendimiento juvenil', horas:18, creditos:1.5, estado:'ACTIVO', rol:'Ejecutor', ciclo:5},
            {codigo:'RSU-2026-011', titulo:'Campaña anemia - San Luis', horas:14, creditos:1.0, estado:'ACTIVO', rol:'Proponente (líder)', ciclo:5},
            {codigo:'RSU-2026-009', titulo:'Reciclaje comunitario', horas:10, creditos:0.5, estado:'FINALIZADO', rol:'Apoyo', ciclo:5},
          ].map(p=>(
            <div key={p.codigo} className="border border-slate-200 rounded-xl p-4 flex gap-3 items-center">
              <div className="w-12 h-12 rounded-xl bg-sky-600 text-white grid place-items-center font-black text-sm">{p.horas}h</div>
              <div className="flex-1">
                <div className="flex gap-2 items-center"><span className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded">{p.codigo}</span><Badge color={p.estado==='ACTIVO'?'#0ea5e9':'#10b981'} variant="soft">{p.estado}</Badge><span className="text-xs bg-slate-100 border px-2 py-1 rounded-full">{p.rol}</span></div>
                <div className="font-semibold text-sm mt-1">{p.titulo}</div>
                <div className="text-xs text-slate-500">Ciclo {p.ciclo} · {p.creditos} créditos · validacion_ciclo=true</div>
              </div>
              <div className="text-right"><div className="font-black">{p.horas}h</div><div className="text-xs text-slate-500">{p.creditos} cr</div></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 font-bold"><Calendar size={16}/> Ciclo y validación</div>
          <p className="text-xs text-slate-600 mt-1">Cada inscripción valida que tu <b>ciclo_numerico</b> ≥ <b>ciclo_minimo_estudiante</b> del tipo proyecto. Ej: Proyección Social requiere ciclo ≥5.</p>
          <div className="mt-2 text-xs bg-sky-50 border border-sky-200 rounded-xl p-2">Tú estás en ciclo 5 (Estudiante_Ciclo id_ciclo=1) ✓ — puedes postular a todos excepto Investigación Aplicada (ciclo ≥7).</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 font-bold"><AlertCircle size={16} className="text-amber-600"/> Equivalencia</div>
          <p className="text-xs text-slate-600 mt-1">Horas → créditos según reglamento UNDC. Requiere estado ACTIVO/FINALIZADO y validacion_ciclo=true.</p>
          <Button size="sm" variant="outline" className="mt-2">Ver reglamento créditos</Button>
        </Card>
      </div>
    </div>
  )
}
