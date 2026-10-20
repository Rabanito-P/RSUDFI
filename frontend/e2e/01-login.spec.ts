import { test, expect } from '@playwright/test'
import { DEMO, loginPorFormulario } from './helpers'

// HU-F2-T1 · Acceso por rol: las tarjetas de acceso rapido del login
// (con las tres cuentas de datos demo) entran y muestran el nombre del
// usuario en la cabecera.
const HEADING_LOGIN = /Ingreso r.pido por rol/

test.describe('Pantalla de ingreso', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: HEADING_LOGIN })).toBeVisible()
  })

  test('muestra las tarjetas de las cuentas demo de la Fase 2', async ({ page }) => {
    for (const correo of [DEMO.lider, DEMO.publicacion, DEMO.asesora]) {
      await expect(page.getByText(correo)).toBeVisible()
    }
    await expect(page.locator('label', { hasText: 'Contra' })).toBeVisible()
  })

  // CA-T1.1: un clic en la tarjeta inicia sesion por todo el sistema.
  test('tarjeta del Líder de voluntariado entra y muestra su nombre', async ({ page }) => {
    const card = page.locator('button', { hasText: DEMO.lider }).first()
    await card.click()
    await expect(page.locator('div.font-semibold', { hasText: 'Diego Vargas' }).first()).toBeVisible()
  })

  test('tarjeta de la asesora entra y ve la bandeja de docente', async ({ page }) => {
    const card = page.locator('button', { hasText: DEMO.asesora }).first()
    await card.click()
    // El docente es llevado a /docente/carga (RUTA_INICIO).
    await page.waitForURL(/docente\/carga/)
    await expect(page.locator('div.font-semibold', { hasText: 'Rosa Mendoza' }).first()).toBeVisible()
  })

  // CA-T1.5: el fallo es visible en pantalla, no silencioso.
  test('contraseña incorrecta muestra un error visible', async ({ page }) => {
    await page.locator('form input').nth(1).fill('clave-errada')
    await page.getByRole('button', { name: 'Entrar al sistema RSU' }).click()
    await expect(page.getByText('No se pudo ingresar:')).toBeVisible({
      timeout: 15_000,
    })
  })
})
