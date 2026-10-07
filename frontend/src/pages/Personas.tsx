import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Empty } from '../components/ui/Empty'
import { GraduationCap, Users, Search, Plus, Mail, CreditCard, Building2, Clock, BookOpen } from 'lucide-react'

export default function Personas(){
  const [tab,setTab]=useState<'docentes'|'estudiantes'>('docentes')
  const [docs,setDocs]=useState<any[]>([])
  const [ests,setEsts]=useState<any[]>([])
  const [search,setSearch]=useState('')
  const [loading,setLoading]=useState(true)
  const [formEst,setFormEst]=useState({codigo:'', dni:'', nombres:'', apellidos:'', correo:'', escuela:'1'})
  const [formDoc,setFormDoc]=useState({codigo:'', dni:'', nombres:'', apellidos:'', correo:'', escuela:'1', tipo:'ORDINARIO_TC', carga:'8'})

  const load = async()=>{
    setLoading(true)
    try{
      const [d,e]=await Promise.all([
        api.get(`/api/v1/docentes?search=${search}`).then((r:any)=> r.data||[]).catch(()=>[
          {id_docente:1,codigo_docente:'DOC001', dni:'10000001', nombres:'Laura', apellidos:'Torres', correo_institucional:'docente@undc.edu.pe', tipo_docente:'ORDINARIO_TC', categoria:'PRINCIPAL', carga_no_lectiva_max:8},
          {id_docente:2,codigo_docente:'DOC002', dni:'10000002', nombres:'Pedro', apellidos:'Flores', correo_institucional:'pflores@undc.edu.pe', tipo_docente:'CONTRATADO', carga_no_lectiva_max:6},
        ]),
        api.get(`/api/v1/estudiantes?search=${search}`).then((r:any)=> r.data||[]).catch(()=>[
          {id_estudiante:1,codigo_estudiante:'EST001', dni:'20000001', nombres:'Ana', apellidos:'Quispe', correo_institucional:'estudiante@undc.edu.pe', estado:'ACTIVO', id_escuela:1},
          {id_estudiante:2,codigo_estudiante:'EST002', dni:'20000002', nombres:'Carlos', apellidos:'Ramos', correo_institucional:'cramos@undc.edu.pe', estado:'ACTIVO'},
        ])
      ])
      setDocs(d); setEsts(e)
    }finally{ setLoading(false)}
  }
  useEffect(()=>{ load()},[])

  const createEst = async(e:React.FormEvent)=>{
    e.preventDefault()
    try{ await api.post('/api/v1/estudiantes', {codigo_estudiante: formEst.codigo, dni: formEst.dni, nombres: formEst.nombres, apellidos: formEst.apellidos, correo_institucional: formEst.correo, id_escuela: Number(formEst.escuela)}); setFormEst({codigo:'', dni:'', nombres:'', apellidos:'', correo:'', escuela:'1'}); load()}catch{}
  }
  const createDoc = async(e:React.FormEvent)=>{
    e.preventDefault()
    try{ await api.post('/api/v1/docentes', {codigo_docente: formDoc.codigo, dni: formDoc.dni, nombres: formDoc.nombres, apellidos: formDoc.apellidos, correo_institucional: formDoc.correo, id_escuela: Number(formDoc.escuela), tipo_docente: formDoc.tipo, carga_no_lectiva_max: Number(formDoc.carga)}); load()}catch{}
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Docentes & Estudiantes"
        subtitle="Gestión de personas UNDC — validación carga no lectiva (Art.79/86), ciclos académicos y escuelas. Fuente para asignaciones RSU."
        icon={<Users size={20}/>}
        badge={<span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-xs font-bold">{docs.length} docentes · {ests.length} estudiantes</span>}
      />

      <div className="flex gap-2">
        <Button variant={tab==='docentes'?'secondary':'outline'} onClick={()=>setTab('docentes')} leftIcon={<GraduationCap size={14}/>}>Docentes ({docs.length})</Button>
        <Button variant={tab==='estudiantes'?'secondary':'outline'} onClick={()=>setTab('estudiantes')} leftIcon={<Users size={14}/>}>Estudiantes ({ests.length})</Button>
      </div>

      <Card className="p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <Input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder={tab==='docentes'?'Buscar docente por nombre/DNI/correo':'Buscar estudiante por nombre/DNI/código'} className="pl-9 bg-slate-50"/>
        </div>
        <Button onClick={load}>Buscar</Button>
      </Card>

      {tab==='estudiantes' ? (
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <Card hover>
            <CardHeader>
              <CardTitle><Users size={16}/> Estudiantes</CardTitle>
              <p className="text-xs text-slate-500">Validación ciclo mínimo al inscribir a proyecto (HU-003) · Estudiante_Ciclo</p>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-64"/> :
                ests.length===0 ? <Empty title="Sin estudiantes" description="Registra el primero para probar asignaciones"/> :
                <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                  {ests.map(s=>(
                    <div key={s.id_estudiante} className="border border-slate-200 rounded-xl p-3 flex gap-3">
                      <img src={`https://i.pravatar.cc/100?u=${s.correo_institucional}`} className="w-10 h-10 rounded-xl"/>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{s.apellidos}, {s.nombres}</div>
                        <div className="text-xs text-slate-500 flex gap-2 flex-wrap">
                          <span className="flex items-center gap-1"><CreditCard size={12}/>{s.dni}</span>
                          <span className="flex items-center gap-1"><Mail size={12}/>{s.correo_institucional}</span>
                          <span className="flex items-center gap-1"><Building2 size={12}/>{s.id_escuela}</span>
                        </div>
                        <div className="flex gap-1.5 mt-1"><Badge color="#1b5e20" variant="soft">{s.estado || 'ACTIVO'}</Badge><span className="text-xs bg-slate-100 border px-2 py-0.5 rounded-full font-mono">{s.codigo_estudiante}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader><CardTitle><Plus size={16}/> Nuevo estudiante</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={createEst} className="space-y-3">
                <div className="grid grid-cols-2 gap-3"><div><Label required>Código</Label><Input value={formEst.codigo} onChange={e=>setFormEst({...formEst, codigo:e.target.value})} placeholder="EST003"/></div><div><Label required>DNI</Label><Input value={formEst.dni} onChange={e=>setFormEst({...formEst, dni:e.target.value})} maxLength={8} placeholder="20000003"/></div></div>
                <div className="grid grid-cols-2 gap-3"><div><Label required>Nombres</Label><Input value={formEst.nombres} onChange={e=>setFormEst({...formEst, nombres:e.target.value})}/></div><div><Label required>Apellidos</Label><Input value={formEst.apellidos} onChange={e=>setFormEst({...formEst, apellidos:e.target.value})}/></div></div>
                <div><Label required>Correo institucional</Label><Input type="email" value={formEst.correo} onChange={e=>setFormEst({...formEst, correo:e.target.value})} placeholder="correo@undc.edu.pe"/></div>
                <div><Label>Escuela ID</Label><Input value={formEst.escuela} onChange={e=>setFormEst({...formEst, escuela:e.target.value})}/></div>
                <Button type="submit" className="w-full">Registrar estudiante</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <Card hover>
            <CardHeader>
              <CardTitle><GraduationCap size={16} className="text-undc-700"/> Docentes</CardTitle>
              <p className="text-xs text-slate-500">Carga no lectiva máxima valida asignación a proyectos (Art.86) — RSU_Asignacion_Docente</p>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-64"/> :
                <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                  {docs.map(d=>(
                    <div key={d.id_docente} className="border border-slate-200 rounded-xl p-3 flex gap-3">
                      <img src={`https://i.pravatar.cc/100?u=${d.correo_institucional}`} className="w-10 h-10 rounded-xl"/>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{d.apellidos}, {d.nombres} · <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded border">{d.codigo_docente}</span></div>
                        <div className="text-xs text-slate-500 flex gap-2 flex-wrap">
                          <span className="flex items-center gap-1"><CreditCard size={12}/>{d.dni}</span><span className="flex items-center gap-1"><Mail size={12}/>{d.correo_institucional}</span>
                        </div>
                        <div className="flex gap-1.5 mt-1 flex-wrap"><Badge color="#1b5e20" variant="soft">{d.tipo_docente}</Badge>{d.categoria && <Badge color="#64748b" variant="soft">{d.categoria}</Badge>}<span className="text-xs px-2 py-1 bg-amber-50 border border-amber-200 rounded-full flex items-center gap-1"><Clock size={12}/> No lectiva máx {d.carga_no_lectiva_max}h</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader><CardTitle><Plus size={16}/> Nuevo docente</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={createDoc} className="space-y-3">
                <div className="grid grid-cols-2 gap-3"><div><Label required>Código</Label><Input value={formDoc.codigo} onChange={e=>setFormDoc({...formDoc, codigo:e.target.value})} placeholder="DOC003"/></div><div><Label required>DNI</Label><Input value={formDoc.dni} onChange={e=>setFormDoc({...formDoc, dni:e.target.value})} maxLength={8}/></div></div>
                <div className="grid grid-cols-2 gap-3"><div><Label required>Nombres</Label><Input value={formDoc.nombres} onChange={e=>setFormDoc({...formDoc, nombres:e.target.value})}/></div><div><Label required>Apellidos</Label><Input value={formDoc.apellidos} onChange={e=>setFormDoc({...formDoc, apellidos:e.target.value})}/></div></div>
                <div><Label required>Correo</Label><Input type="email" value={formDoc.correo} onChange={e=>setFormDoc({...formDoc, correo:e.target.value})}/></div>
                <div className="grid grid-cols-2 gap-3"><div><Label>Tipo</Label><Select value={formDoc.tipo} onChange={e=>setFormDoc({...formDoc, tipo:e.target.value})}><option>ORDINARIO_TC</option><option>ORDINARIO_DE</option><option>CONTRATADO</option></Select></div><div><Label>Carga no lectiva máx</Label><Input type="number" value={formDoc.carga} onChange={e=>setFormDoc({...formDoc, carga:e.target.value})}/></div></div>
                <div><Label>Escuela ID</Label><Input value={formDoc.escuela} onChange={e=>setFormDoc({...formDoc, escuela:e.target.value})}/></div>
                <Button type="submit" className="w-full bg-undc-700 hover:bg-undc-800">Registrar docente</Button>
                <div className="text-xs bg-amber-50 border border-amber-200 rounded-xl p-2.5">Al asignar horas, el backend suma <b>SUM horas_asignadas</b> en el ciclo y valida ≤ carga_no_lectiva_max (Art.86).</div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
