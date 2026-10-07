import * as React from 'react'
import { cn } from '../../lib/utils'
export function Card({className, hover, ...p}:React.HTMLAttributes<HTMLDivElement> & {hover?:boolean}){ return <div className={cn('bg-white rounded-2xl border border-slate-200/70 shadow-sm', hover && 'card-hover cursor-pointer', className)} {...p}/> }
export function CardHeader({className, ...p}:React.HTMLAttributes<HTMLDivElement>){ return <div className={cn('p-5 border-b border-slate-100/80',className)} {...p}/> }
export function CardContent({className, ...p}:React.HTMLAttributes<HTMLDivElement>){ return <div className={cn('p-5',className)} {...p}/> }
export function CardTitle({className, ...p}:React.HTMLAttributes<HTMLHeadingElement>){ return <h3 className={cn('font-bold text-slate-800 flex items-center gap-2',className)} {...p}/> }
export function CardDesc({className, ...p}:React.HTMLAttributes<HTMLParagraphElement>){ return <p className={cn('text-sm text-slate-500 mt-1 leading-relaxed',className)} {...p}/> }
export function CardStat({label,value,sub,icon,trend}:{label:string,value:React.ReactNode,sub?:string,icon?:React.ReactNode,trend?:'up'|'down'|'neutral'}){
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-4 flex items-center gap-3 shadow-sm hover:shadow-medium transition-shadow">
      {icon && <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0">{icon}</div>}
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="text-lg font-extrabold text-slate-900 leading-tight truncate">{value}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
      </div>
      {trend && <span className={cn('ml-auto text-xs font-bold px-2 py-1 rounded-full', trend==='up'?'bg-emerald-50 text-emerald-700':trend==='down'?'bg-red-50 text-red-700':'bg-slate-100 text-slate-600')}>{trend==='up'?'↑':trend==='down'?'↓':'—'}</span>}
    </div>
  )
}
