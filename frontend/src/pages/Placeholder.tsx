export default function Placeholder({title,desc}:{title:string,desc:string}){
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
      <h2 className="text-xl font-extrabold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">{desc}</p>
      <div className="mt-6 inline-flex px-4 py-2 bg-undc-600 text-white rounded-xl text-sm font-semibold">Próximamente — conectado a API</div>
    </div>
  )
}
