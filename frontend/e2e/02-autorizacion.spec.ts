import { test, expect } from '@playwright/test'
import { DEMO, apiLogin, loginDirecto } from './helpers'

// HU-F2-T1 Â· AutorizaciÃ³n en dos capas: un estudiante solo ve SUS proyectos.
// En la interfaz el proyecto ajeno no se renderiza (aviso explÃ­cito) y, por
// la API, responde 404 (sin filtrar datos ni hallar nada).
const PROYECTO_AJENO = '/proyectos/4' // UNDC-RSU-2026-014 (Fiorella GutiÃ©rrez)

test.describe('AutorizaciÃ³n de proyectos', () => {
  test('la UI no muestra el expediente ajeno y lo explica', async ({ page }) => {
    await loginDirecto(page, DEMO.lider)
    await expect(page.getByText('Diego Vargas')).toBeVisible()
    await page.goto(PROYECTO_AJENO)
    // El backend devuelve 404 (no revela el expediente ajeno) y la UI lo
    // comunica con un aviso explÃ­cito, no con una pantalla en blanco.
    await expect(page.getByText('No se pudo cargar el expediente')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.locator('h1')).not.toBeVisible() // nunca renderiza el expediente
  })

  test('la API responde 404 si el estudiante consulta un proyecto ajeno', async ({ request }) => {
    const u = await apiLogin(request, DEMO.lider)
    const res = await request.get('/api/v1/proyectos/4', {
      headers: { Authorization: `Bearer ${u.token}` },
    })
    expect([403, 404]).toContain(res.status())
    const body = await res.json().catch(() => ({}))
    expect(String(body?.message ?? '')).not.toContain('Fiorella') // sin fuga de datos
  })

  // HU-064: la excepciÃ³n legÃ­tima estÃ¡ en los PEP abiertos (vista previa).
  test('un PEP abierto sÃ­ es visible por la API (vista previa)', async ({ request }) => {
    const u = await apiLogin(request, DEMO.lider)
    // Proyecto 2 UNDC-RSU-2026-012 es PEP_FINANCIADO y quedÃ³ abierto.
    const res = await request.get('/api/v1/proyectos/2', {
      headers: { Authorization: `Bearer ${u.token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body?.data?.modalidad).toMatch(/^PEP/)
  })
})
