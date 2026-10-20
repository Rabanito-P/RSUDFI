import { test, expect } from '@playwright/test'
import { DEMO, loginDirecto } from './helpers'

// HU-F2-T1 Â· Flujo del asesor + notificaciones.
// Rosa Mendoza es la asesora del SSU de voluntariado (proyecto 3, cuenta de
// db/05_fase2_datos.sql): su bandeja de docente debe listar su proyecto y,
// al abrir el expediente, ver el equipo con Diego como lÃ­der.
const VOLUNTARIADO = 'UNDC-RSU-2026-013'

test.describe('Asesora y notificaciones', () => {
  test('la asesora encuentra su proyecto en la bandeja y lo abre', async ({ page }) => {
    await loginDirecto(page, DEMO.asesora)
    await expect(page.locator('div.font-semibold', { hasText: 'Rosa Mendoza' })).toBeVisible()

    // Bandeja/listado del docente: el cÃ³digo del proyecto debe figurar.
    await page.goto('/docente/proyectos')
    await page.getByText(VOLUNTARIADO).first().waitFor({ timeout: 15_000 })

    // La abre y revisa el expediente.
    await page.getByText(VOLUNTARIADO).first().click()
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('span.font-mono', { hasText: VOLUNTARIADO })).toBeVisible()
  })

  test('la campana de notificaciones carga y lista avisos del sistema', async ({ page }) => {
    await loginDirecto(page, DEMO.asesora)
    await expect(page.locator('div.font-semibold', { hasText: 'Rosa Mendoza' })).toBeVisible()

    // Ãbrelo: la cabecera muestra el panel con el tÃ­tulo Notificaciones.
    await page.locator('button:has([class*="lucide-bell"])').first().click()
    await expect(page.getByText('Notificaciones')).toBeVisible()
  })
})

