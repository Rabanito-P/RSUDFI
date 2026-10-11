import { useState } from 'react'
import { ImageOff } from 'lucide-react'

// SafeImage: misma URL local actual (/uploads/...) con fallback elegante.
// Cuando se active el driver cloud, la URL vendrá firmada del bucket pero el
// componente no cambia: solo muestra placeholder si la imagen falla.
export default function SafeImage({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`grid place-items-center bg-slate-100 text-slate-400 rounded-xl ${className ?? 'w-full h-32'}`} title={alt ?? 'Imagen no disponible'}>
        <div className="flex flex-col items-center gap-1 p-4 text-center">
          <ImageOff size={20} />
          <span className="text-[11px] font-semibold">Imagen no disponible (storage local MVP)</span>
        </div>
      </div>
    )
  }
  return <img src={src} alt={alt ?? ''} loading="lazy" onError={() => setFailed(true)} className={className} />
}
