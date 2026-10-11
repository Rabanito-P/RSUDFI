import { createContext, useContext, useState } from 'react'

interface LayoutCtx {
  /** Drawer del menú abierto (sólo en móvil). */
  menuOpen: boolean
  setMenuOpen: (v: boolean) => void
  toggleMenu: () => void
}

const Ctx = createContext<LayoutCtx | null>(null)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <Ctx.Provider
      value={{ menuOpen, setMenuOpen, toggleMenu: () => setMenuOpen(o => !o) }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useLayout() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useLayout debe usarse dentro de LayoutProvider')
  return c
}