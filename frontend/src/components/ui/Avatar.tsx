import { cn } from '../../lib/utils'

export function initialsOf(nombre?:string, correo?:string){
  const name = (nombre || correo || '').replace(/\(.*\)/,'').trim()
  const parts = name.split(/\s+/).filter(Boolean)
  if(parts.length===0) return '?'
  if(parts.length===1) return (parts[0][0] || '?').toUpperCase()
  return `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase()
}

export function Avatar({nombre, correo, className='w-10 h-10 text-xs'}:{nombre?:string, correo?:string, className?:string}){
  const seed = (correo || nombre || '').split('').reduce((a,c)=>a+c.charCodeAt(0),0)
  const colors = ['bg-sky-600','bg-emerald-600','bg-violet-600','bg-amber-600','bg-rose-600','bg-teal-600']
  return (
    <div className={cn('rounded-xl grid place-items-center text-white font-bold shrink-0', className, colors[seed % colors.length])}>
      {initialsOf(nombre, correo)}
    </div>
  )
}
