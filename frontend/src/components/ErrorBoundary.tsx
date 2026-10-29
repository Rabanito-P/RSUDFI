import React from 'react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; error: any }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null }
  static getDerivedStateFromError(error:any){ return { hasError:true, error } }
  componentDidCatch(error:any, info:any){
    console.error('[ErrorBoundary]', error, info)
  }
  render(){
    if(this.state.hasError){
      return (
        <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-red-200 shadow-lg p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 grid place-items-center mx-auto">!</div>
            <h2 className="text-lg font-black text-slate-900 mt-3">Algo se rompió</h2>
            <p className="text-sm text-slate-600 mt-1">Ocurrió un error inesperado en el frontend. Los datos nulos ya están normalizados en el backend.</p>
            {import.meta.env.PROD ? null : (
              <pre className="text-xs text-left bg-slate-900 text-slate-100 rounded-xl p-3 mt-3 overflow-auto max-h-40">{String(this.state.error?.message ?? this.state.error)}</pre>
            )}
            <div className="flex gap-2 justify-center mt-4">
              <button onClick={()=> location.reload()} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">Recargar</button>
              <button onClick={()=> { (this.setState as any)({hasError:false, error:null}); location.href='/'}} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold">Ir al inicio</button>
            </div>
            <p className="text-xs text-slate-400 mt-3">UNDC RSU · Revisa consola para stack · Dashboard KPI vacío ya muestra empty-state, favicon 204.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
