import { cn } from '../../lib/utils'
export function Badge({color, children, variant='solid', size='md', dot}:{color?:string, children:React.ReactNode, variant?:'solid'|'soft'|'outline', size?:'sm'|'md', dot?:boolean}){
  if(variant==='soft'){
    return <span className={cn("inline-flex items-center gap-1.5 rounded-full font-semibold border", size==='sm'?'px-2 py-0.5 text-xs':'px-2.5 py-1 text-xs')} style={{background: `${color||'#607D8B'}15`, color: color||'#607D8B', borderColor: `${color||'#607D8B'}30`}}>{dot && <span className="w-1.5 h-1.5 rounded-full" style={{background:color}}/>}{children}</span>
  }
  if(variant==='outline'){
    return <span className={cn("inline-flex items-center gap-1.5 rounded-full font-semibold border bg-white", size==='sm'?'px-2 py-0.5 text-xs':'px-2.5 py-1 text-xs')} style={{color: color||'#607D8B', borderColor: color||'#607D8B'}}>{dot && <span className="w-1.5 h-1.5 rounded-full" style={{background:color}}/>}{children}</span>
  }
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full font-semibold text-white shadow-sm", size==='sm'?'px-2 py-0.5 text-xs':'px-2.5 py-1 text-xs')} style={{background: color||'#607D8B'}}>{dot && <span className="w-1.5 h-1.5 rounded-full bg-white/90"/>}{children}</span>
}
export function EstadoBadge({codigo,nombre,color}:{codigo:string,nombre:string,color?:string}){
  return <Badge color={color} variant="soft" dot>{nombre}</Badge>
}
