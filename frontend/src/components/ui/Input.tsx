import * as React from 'react'
import { cn } from '../../lib/utils'
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & {error?:boolean}>(({className, error, ...p},ref)=>
  <input ref={ref} className={cn('w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm outline-none placeholder:text-slate-400 transition-all', error? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/30':'border-slate-200 focus:border-undc-500 focus:ring-4 focus:ring-undc-500/10', className)} {...p}/>
)
Input.displayName='Input'
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & {error?:boolean}>(({className, error, ...p},ref)=>
  <textarea ref={ref} className={cn('w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm outline-none resize-none', error? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10':'border-slate-200 focus:border-undc-500 focus:ring-4 focus:ring-undc-500/10', className)} {...p}/>
)
Textarea.displayName='Textarea'
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & {error?:boolean}>(({className, error, children, ...p},ref)=>
  <select ref={ref} className={cn('w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm outline-none', error? 'border-red-300 focus:border-red-500':'border-slate-200 focus:border-undc-500 focus:ring-4 focus:ring-undc-500/10', className)} {...p}>{children}</select>
)
Select.displayName='Select'
export function Label({className, required, ...p}:React.LabelHTMLAttributes<HTMLLabelElement> & {required?:boolean}){ return <label className={cn('text-xs font-semibold text-slate-700 flex items-center gap-1',className)} {...p}>{p.children}{required && <span className="text-red-500">*</span>}</label> }
export function FieldError({msg}:{msg?:string}){ if(!msg) return null; return <p className="text-xs text-red-600 mt-1 flex items-center gap-1">{msg}</p> }
export function HelperText({children}:{children:React.ReactNode}){ return <p className="text-xs text-slate-500 mt-1">{children}</p> }
