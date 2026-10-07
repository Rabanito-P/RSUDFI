import * as React from 'react'
import { cn } from '../../lib/utils'
type Variant = 'primary'|'secondary'|'outline'|'ghost'|'danger'|'soft'
type Size = 'sm'|'md'|'lg'|'icon'
export function Button({variant='primary', size='md', className, loading, leftIcon, rightIcon, ...props}: React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?:Variant,size?:Size, loading?:boolean, leftIcon?:React.ReactNode,rightIcon?:React.ReactNode}){
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none btn-press gap-1.5'
  const variants:Record<Variant,string> = {
    primary:'bg-undc-700 text-white hover:bg-undc-800 focus-visible:ring-undc-700 shadow-sm hover:shadow-md',
    secondary:'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
    outline:'bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 hover:border-slate-300',
    ghost:'bg-transparent hover:bg-slate-100 text-slate-600',
    danger:'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    soft:'bg-slate-100 text-slate-700 hover:bg-slate-200'
  }
  const sizes:Record<Size,string> = { sm:'px-3 py-1.5 text-xs rounded-lg', md:'px-4 py-2.5 text-sm', lg:'px-6 py-3 text-sm', icon:'w-9 h-9 p-0' }
  return <button className={cn(base, variants[variant], sizes[size], loading&&'opacity-80 pointer-events-none', className)} disabled={loading||props.disabled} {...props}>
    {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}{!loading && leftIcon}{props.children}{!loading && rightIcon}
  </button>
}
