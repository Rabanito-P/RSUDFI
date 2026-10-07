import { cn } from '../../lib/utils'
export function PageHeader({title, subtitle, badge, actions, icon}:{title:string, subtitle?:string, badge?:React.ReactNode, actions?:React.ReactNode, icon?:React.ReactNode}){
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          {icon && <div className="w-10 h-10 rounded-xl bg-undc-700 text-white grid place-items-center shadow-sm">{icon}</div>}
          <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900 leading-tight">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-slate-500 mt-1.5 leading-relaxed max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
export function SectionTitle({title, desc, action}:{title:string, desc?:string, action?:React.ReactNode}){
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
      {action}
    </div>
  )
}
