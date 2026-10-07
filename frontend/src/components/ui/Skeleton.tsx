import { cn } from '../../lib/utils'
export function Skeleton({className, ...p}: React.HTMLAttributes<HTMLDivElement>){
  return <div className={cn('animate-pulse rounded-xl bg-slate-200/70', className)} {...p}/>
}
export function CardSkeleton(){
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <div className="flex gap-2"><Skeleton className="h-5 w-24"/><Skeleton className="h-5 w-32"/><Skeleton className="h-5 w-20 ml-auto"/></div>
      <Skeleton className="h-6 w-3/4"/>
      <Skeleton className="h-4 w-full"/>
      <Skeleton className="h-2 w-full"/>
    </div>
  )
}
export function TableSkeleton({rows=5}:{rows?:number}){
  return (
    <div className="space-y-2">
      {Array.from({length:rows}).map((_,i)=><Skeleton key={i} className="h-12 w-full"/>)}
    </div>
  )
}
