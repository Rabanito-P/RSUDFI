export default function Placeholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mx-auto">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-xl font-extrabold text-slate-800 mt-4">{title}</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto leading-relaxed">{desc}</p>
    </div>
  )
}
