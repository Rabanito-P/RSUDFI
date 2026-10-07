import * as React from 'react'
import { cn } from '../../lib/utils'
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
export function Alert({variant='info', className, hideIcon, ...p}:React.HTMLAttributes<HTMLDivElement> & {variant?:'info'|'success'|'warning'|'error', hideIcon?:boolean}){
  const m:Record<string,string> = {
    info:'bg-sky-50 border-sky-200 text-sky-800',
    success:'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning:'bg-amber-50 border-amber-200 text-amber-800',
    error:'bg-red-50 border-red-200 text-red-700'
  }
  const icons = {info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle}
  const Icon = icons[variant]
  return <div className={cn('rounded-xl border p-3.5 text-sm leading-relaxed flex gap-2.5',m[variant],className)} {...p}>
    {!hideIcon && <Icon size={18} className="shrink-0 mt-0.5 opacity-80"/>}
    <div className="flex-1 min-w-0">{p.children}</div>
  </div>
}
