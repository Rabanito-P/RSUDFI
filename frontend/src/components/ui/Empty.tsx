import { cn } from '../../lib/utils'
import { Inbox, SearchX } from 'lucide-react'

export function Empty({title="Sin resultados", description, icon, action}:{title?:string, description?:string, icon?:React.ReactNode, action?:React.ReactNode}){
  return (
    <div className="py-12 px-6 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 grid place-items-center text-slate-400 mb-3">
        {icon || <Inbox size={22}/>}
      </div>
      <h3 className="font-bold text-slate-800">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
export function EmptySearch({query}:{query?:string}){
  return <Empty title="No se encontraron resultados" description={query? `Sin coincidencias para "${query}". Intenta con otros términos.`:'Prueba ajustar los filtros.'} icon={<SearchX size={22}/>}/>
}
