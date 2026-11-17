/**
 * Lluvia binaria decorativa: columnas de dígitos 0/1 que caen en bucle,
 * usadas en las esquinas del hero de la portada y en el panel del login.
 * No captura eventos ni aparece en lectores de pantalla.
 */

/** Secuencia determinista de 0/1: igual en cada render, sin parpadeos. */
export function binarios(semilla: number, largo: number): string {
  let x = semilla >>> 0
  let out = ''
  for (let i = 0; i < largo; i++) {
    x = (x * 1664525 + 1013904223) >>> 0
    out += (x >>> 16) & 1 ? '1' : '0'
  }
  return out
}

/**
 * Columna de dígitos que cae sin salto: el contenido son DOS copias
 * idénticas de la misma secuencia y el keyframe `bin-fall` (translateY
 * -50% → 0) se repite en bucle perfecto.
 */
export function ColumnaBin({
  semilla,
  alto,
  duracion,
  retraso,
  color = 'text-slate-500/50',
}: {
  semilla: number
  alto: number
  duracion: number
  retraso: number
  /** Clase de color/opacity Tailwind según el fondo donde cae. */
  color?: string
}) {
  const porCopia = Math.ceil(alto / 18)
  const seq = binarios(semilla, porCopia)
  return (
    <div className="relative w-3 shrink-0 overflow-hidden" style={{ height: alto }}>
      <div
        className={`absolute inset-x-0 top-0 flex flex-col items-center font-mono text-[11px] leading-[18px] animate-bin-fall ${color}`}
        style={{
          animationDuration: `${duracion}s`,
          animationDelay: `-${retraso}s`,
        }}
      >
        {[...seq, ...seq].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
    </div>
  )
}

/**
 * Lluvia binaria en las 4 esquinas: "montones" de dígitos, más densos
 * abajo y toques cortos arriba. `color` adapta el tono al fondo.
 */
export function LluviaBinaria({
  color,
  className = '',
}: {
  color?: string
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 hidden select-none overflow-hidden md:block ${className}`}
    >
      {/* Montón inferior izquierdo */}
      <div className="absolute bottom-0 left-0 flex gap-5 pl-2">
        <ColumnaBin semilla={11} alto={208} duracion={26} retraso={2} color={color} />
        <ColumnaBin semilla={29} alto={128} duracion={33} retraso={9} color={color} />
        <ColumnaBin semilla={47} alto={176} duracion={21} retraso={5} color={color} />
        <ColumnaBin semilla={73} alto={96} duracion={38} retraso={14} color={color} />
      </div>
      {/* Montón inferior derecho */}
      <div className="absolute right-0 bottom-0 flex gap-5 pr-2">
        <ColumnaBin semilla={91} alto={96} duracion={36} retraso={7} color={color} />
        <ColumnaBin semilla={113} alto={176} duracion={23} retraso={3} color={color} />
        <ColumnaBin semilla={131} alto={128} duracion={31} retraso={12} color={color} />
        <ColumnaBin semilla={157} alto={208} duracion={27} retraso={18} color={color} />
      </div>
      {/* Esquinas superiores, más cortas */}
      <div className="absolute top-0 left-0 flex gap-6 pl-6">
        <ColumnaBin semilla={173} alto={112} duracion={34} retraso={6} color={color} />
        <ColumnaBin semilla={191} alto={72} duracion={41} retraso={16} color={color} />
      </div>
      <div className="absolute top-0 right-0 flex gap-6 pr-6">
        <ColumnaBin semilla={211} alto={72} duracion={43} retraso={10} color={color} />
        <ColumnaBin semilla={229} alto={112} duracion={35} retraso={1} color={color} />
      </div>
    </div>
  )
}
