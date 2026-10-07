export interface Proyecto {
  id_proyecto:number
  codigo_proyecto:string
  titulo:string
  id_escuela:number
  id_tipo:number
  id_estado_actual:number
  estado_actual?:{id_estado:number; codigo:string; nombre:string; color_ui?:string; orden_flujo:number}
  escuela?:{id_escuela:number; nombre:string; facultad?:{nombre:string}}
  tipo?:{id_tipo:number; nombre:string}
  docente_asesor?:{nombres:string; apellidos:string}
  estudiante_lider?:{nombres:string; apellidos:string}
  presupuesto_solicitado:number
  presupuesto_aprobado:number
  monto_ejecutado:number
  porcentaje_avance:number
  fecha_inicio_plan?:string
  fecha_fin_plan?:string
  created_at:string
}
export interface Beneficiario {
  id_beneficiario:number
  tipo_beneficiario:string
  dni?:string
  nombres?:string
  apellidos?:string
  razon_social?:string
  distrito?:string
  celular?:string
}
export interface KPI {
  total_proyectos:number
  proyectos_en_ejecucion:number
  total_beneficiarios:number
  total_docentes:number
  total_estudiantes:number
  presupuesto_aprobado:number
  presupuesto_ejecutado:number
  promedio_satisfaccion?:number|null
  proyectos_por_estado:{estado:string; total:number; color?:string}[]
  proyectos_por_facultad:{facultad:string; total:number}[]
}
