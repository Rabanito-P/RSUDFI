import { useEffect, useState } from 'react'
import { api, asArray } from '../api/client'
import { Alert } from '../components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from '../components/ui/Card'
import { FileText } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────
// HU-F1-08 — Catálogo de formatos oficiales DRSU (solo descarga)
// Base: rules (3) §6 e info/objetivo.txt §2.1.
//
// Los formatos F-M03.01-RSU-xxx y F-M03-RSU-xxx son modelos oficiales de
// la DRSU Central. El Mini-RSU los CONSUME como plantillas descargables:
// no los genera ni los firma. Este catálogo es INDEPENDIENTE del catálogo
// operativo de 7 formatos, que no se modifica (CA-8.1).
// ─────────────────────────────────────────────────────────────────

export default function FormatosDRSU() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    api.get('/api/v1/formatos/drsu')
      .then((r: any) => setItems(asArray(r.data)))
      .catch((ex: any) => setErr(ex?.message || 'No se pudo cargar el catálogo DRSU'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-black text-lg flex items-center gap-2">
          <FileText size={18} /> Formatos oficiales DRSU
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Modelos oficiales de la Dirección de Responsabilidad Social Universitaria (DRSU Central).
          El sistema los ofrece solo como plantillas descargables: no los genera ni los firma.
        </p>
      </div>

      {err && <Alert variant="error">{err}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando catálogo…</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map(f => (
            <Card key={f.codigo}>
              <CardHeader>
                <CardTitle className="text-sm">{f.codigo}</CardTitle>
                <CardDesc className="text-xs">{f.nombre}</CardDesc>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div><b>Modalidad:</b> {f.modalidad}</div>
                <div>
                  <b>Equivalente interno:</b>{' '}
                  {f.codigo_equivalente
                    ? f.codigo_equivalente
                    : 'plantilla propia (sin equivalente en el catálogo operativo)'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}