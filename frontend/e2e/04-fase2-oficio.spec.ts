import { test, expect } from '@playwright/test'
import { DEMO, apiLogin, apiGet, apiPost, subirDocumento, loginDirecto } from './helpers'

// HU-F2-T1/HU-F2-04 · El oficio de elevacion se genera desde la interfaz
// del Decano (Proyecto > General > Fase 2) y se descarga como PDF real.
//
// Setup por API: se conduce el proyecto 3 (SSU de voluntariado, lider Diego)
// hasta EN_DICTAMEN_CONSEJO siguiendo el BPMN con documento sustento — si ya
// estan avanzados los pasos se reutilizan (la suite es re-ejecutable).
const CODIGO = 'UNDC-RSU-2026-013'
const CODIGOS = ['BORRADOR', 'EN_REVISION_ESCUELA', 'CON_VB_ESCUELA', 'EN_PRIORIZACION_FACULTAD', 'EN_DICTAMEN_CONSEJO']

async function llevarADictamen(request: import('@playwright/test').APIRequestContext) {
  const lider = await apiLogin(request, DEMO.lider)
  const escuela = await apiLogin(request, DEMO.escuela)
  const rsf = await apiLogin(request, DEMO.rsfacultad)
  const decano = await apiLogin(request, DEMO.decano)
  const actores = [
    { token: lider.token, rol: 3 },
    { token: escuela.token, rol: 5 },
    { token: rsf.token, rol: 7 },
    { token: decano.token, rol: 13 },
  ]

  const resP = await apiGet(request, lider.token, '/api/v1/proyectos/3')
  const proy = (await resP.json())?.data
  const estadoActual = proy?.estado_actual?.codigo ?? 'BORRADOR'
  const indice = CODIGOS.indexOf(estadoActual)
  if (indice < 0) return proy // terminado o archivado: nada por hacer

  const docId = indice === 0 ? await subirDocumento(request, lider.token, 3) : (proy.id_documento ?? proy.id_documento_sustento ?? (await subirDocumento(request, lider.token, 3)))

  for (let i = indice; i < CODIGOS.length - 1; i++) {
    const res = await apiPost(request, actores[i].token, '/api/v1/proyectos/3/transicion', {
      estado_destino: CODIGOS[i + 1],
      resultado: 'APROBADO',
      comentarios: 'setup suite Fase 2',
      id_rol_actor: actores[i].rol,
      id_documento_sustento: docId,
    })
    expect(res.ok(), `transicion ${CODIGOS[i]} -> ${CODIGOS[i + 1]}: ${res.status()} ${await res.text()}`).toBeTruthy()
  }
  return proy
}

test('el Decano genera el oficio desde la UI y descarga un PDF valido', async ({ page, request }) => {
  const proyecto = await llevarADictamen(request)

  await loginDirecto(page, DEMO.decano)
  await expect(page.locator('div.font-semibold', { hasText: 'Carlos Alcides' })).toBeVisible()
  await page.goto('/proyectos/3')

  // Gate correcto: el expediente esta en dictamen del Consejo -> boton visible.
  await expect(page.locator('span.font-mono', { hasText: CODIGO })).toBeVisible()
  const finales = ['CERRADO', 'REPORTADO_SUNEDU', 'EVALUACION_VALIDADA', 'ARCHIVADO_VENCIMIENTO']
  test.skip(finales.includes(proyecto?.estado_actual?.codigo), `proyecto en ${proyecto?.estado_actual?.codigo}; no es dictamen — revisa el setup`)

  // El numero de oficio siempre termina en UNDC/FI-DEC (evita dependencias de
  // encoding con el caracter de grado en los comentarios del backend).
  const hayOficio = await page.getByText(/UNDC\/FI-DEC/).isVisible().catch(() => false)

  if (!hayOficio) {
    const botonGenerar = page.getByRole('button', { name: /Generar Oficio/ })
    await expect(botonGenerar).toBeVisible()
    await botonGenerar.click()
  }
  // En ambos casos queda el oficio con numero y la descarga habilitada.
  // El numero se muestra tal como lo emite el backend: OFICIO N.° NNN-AAAA-UNDC/FI-DEC.
  await expect(page.getByText(/\d+-\d{4}-UNDC\/FI-DEC/)).toBeVisible({ timeout: 20_000 })
  const botonDescargar = page.getByRole('button', { name: /Descargar oficio/ })
  await expect(botonDescargar).toBeVisible()

  // La descarga pasa por la API (fetch con Authorization) y dispara el evento
  // download; si ocasionalmente la primera pulsacion no llega (render intermedio
  // tras generar), se reintenta una vez mostrando la respuesta HTTP.
  const respuestaOficio: string[] = []
  page.on('response', async (r) => {
    if (r.url().includes('/fase2/oficio')) {
      respuestaOficio.push(`${r.status()} ${r.url()}`)
    }
  })
  let bytes: Buffer | undefined
  for (let intento = 0; intento < 2 && !bytes; intento++) {
    try {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15_000 }),
        botonDescargar.click(),
      ])
      const ruta = await download.path()
      if (ruta) bytes = await (await import('fs/promises')).readFile(ruta)
    } catch {
      if (intento === 1) throw new Error(`descarga sin evento download; respuestas: ${respuestaOficio.join(' | ') || 'ninguna'}`)
    }
  }
  expect(bytes?.length, 'el oficio tiene contenido').toBeGreaterThan(1000)
  expect(bytes!.subarray(0, 5).toString('ascii')).toBe('%PDF-')
})
