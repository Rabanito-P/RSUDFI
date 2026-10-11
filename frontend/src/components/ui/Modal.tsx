import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Modal({open, onClose, title, desc, children, footer, width='max-w-lg', busy}:{open:boolean, onClose:()=>void, title:string, desc?:string, children?:React.ReactNode, footer?:React.ReactNode, width?:string, busy?:boolean}){
  if(!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={()=>{ if(!busy) onClose() }}>
      <div className={cn('bg-white rounded-t-2xl sm:rounded-2xl w-full p-4 sm:p-6 shadow-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto', width)} onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900">{title}</h3>
            {desc && <p className="text-xs text-slate-500 mt-1">{desc}</p>}
          </div>
          <button type="button" aria-label="Cerrar" onClick={()=>{ if(!busy) onClose() }} className="w-8 h-8 rounded-full bg-slate-100 grid place-items-center hover:bg-slate-200 shrink-0">
            <X size={14}/>
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
