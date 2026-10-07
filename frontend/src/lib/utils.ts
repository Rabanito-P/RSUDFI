import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]){ return twMerge(clsx(inputs)) }
export function fmtDate(d?:string){ if(!d) return '—'; try{return new Date(d).toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'})}catch{return d} }
export function fmtDateTime(d?:string){ if(!d) return '—'; try{return new Date(d).toLocaleString('es-PE')}catch{return d} }
export function fmtMoney(n:number){ return 'S/ ' + (n||0).toLocaleString('es-PE',{minimumFractionDigits:2, maximumFractionDigits:2}) }
export function truncate(str:string, n:number){ if(!str) return ''; return str.length>n? str.slice(0,n)+'…':str }
export function estadoColor(codigo?:string){
  const map:Record<string,string> = {
    BORRADOR:'#9E9E9E',
    EN_REVISION_ESCUELA:'#FFC107',
    CON_VB_ESCUELA:'#FF9800',
    EN_PRIORIZACION_FACULTAD:'#FF5722',
    EN_DICTAMEN_CONSEJO:'#3F51B5',
    APROBADO_CON_RESOLUCION:'#4CAF50',
    EN_ASIGNACION_CARGA:'#009688',
    REGISTRADO_OFICIAL:'#00BCD4',
    EN_EJECUCION:'#2196F3',
    EN_MONITOREO:'#03A9F4',
    INFORME_FINAL_PRESENTADO:'#8BC34A',
    CON_CONFORMIDAD_ESCUELA:'#CDDC39',
    CERRADO:'#607D8B',
    EN_EVALUACION_IMPACTO:'#9C27B0',
    EVALUACION_VALIDADA:'#673AB7',
    REPORTADO_SUNEDU:'#212121',
  }
  return map[codigo||''] || '#607D8B'
}
