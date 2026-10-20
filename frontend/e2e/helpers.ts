import { expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Page, APIRequestContext } from '@playwright/test'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')

export const PASSWORD = 'undc2026'

/** Cuentas demo de db/05_fase2_datos.sql (usuario → nombre visible). */
export const DEMO = {
  lider: 'lider.voluntariado@undc.edu.pe',
  publicacion: 'publicacion@undc.edu.pe',
  asesora: 'rosa.mendoza@undc.edu.pe',
  escuela: 'escuela@undc.edu.pe',
  rsfacultad: 'rsfacultad@undc.edu.pe',
  decano: 'decano@undc.edu.pe',
  consejo: 'consejo@undc.edu.pe',
  admin: 'admin@undc.edu.pe',
}

/**
 * Inicia sesión por la pantalla de ingreso: rellena el formulario manual
 * (los selectores de acción siguen siendo reales, no mocks).
 * Nota: los <label> no están vinculados al input (sin htmlFor), así que
 * se seleccionan los dos inputs del formulario por posición.
 * Si el backend aplica el tope de 10 logins/min, espera y reintenta.
 */
export async function loginPorFormulario(page: Page, correo: string, password = PASSWORD) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Ingreso rápido por rol' })).toBeVisible()
  for (let intento = 0; intento < 3; intento++) {
    const inputs = page.locator('form input')
    await inputs.first().fill(correo)
    if (password !== PASSWORD) await inputs.nth(1).fill(password)
    await page.getByRole('button', { name: 'Entrar al sistema RSU' }).click()
    try {
      // El usuario quedó dentro si desapareció el formulario del login.
      await page.locator('form input').first().waitFor({ state: 'detached', timeout: 12_000 })
      return
    } catch {
      // Si el aviso es el tope de intentos, espera y reintenta.
      const aviso = page.getByText(/Demasiados intentos|429/).isVisible().catch(() => false)
      if (!(await aviso)) throw new Error(`login UI ${correo} no ingresó (ver captura)`)
      await new Promise(r => setTimeout(r, 20_000))
    }
  }
  throw new Error(`login UI ${correo}: tope de intentos persistente`)
}

/**
 * Sesión directa (sin pasar por el formulario): login por la API con cache
 * por cuenta y siembra de la sesión en localStorage como lo haría la UI.
 * Cada test la usa para no agotar el tope de logins del backend.
 */
export async function loginDirecto(page: Page, correo: string) {
  const u = await apiLogin(page.request, correo)
  await page.addInitScript((usuario) => {
    try { localStorage.setItem('undc_user', JSON.stringify(usuario)) } catch { /* noop */ }
  }, u)
  await page.goto('/')
  return u
}

/** Cache de tokens: el backend limita el login a 20/min por IP y la suite
 * inicia sesión con las mismas cuentas repetidamente. */
const tokens = new Map<string, { token: string; [k: string]: any }>()

/** Hace login por la API y devuelve { token, data } para el setup del spec.
 * Si el backend devuelve 429 (máx. 20 logins/min por IP) espera y reintenta. */
export async function apiLogin(request: APIRequestContext, correo: string, password = PASSWORD) {
  const cache = tokens.get(correo)
  if (cache) return cache
  for (let intento = 0; intento < 4; intento++) {
    const res = await request.post('/api/v1/auth/login', {
      data: { correo, password },
    })
    if (res.ok()) {
      const body = await res.json()
      tokens.set(correo, body.data)
      return body.data as { token: string; [k: string]: any }
    }
    if (res.status() !== 429) {
      expect(false, `login ${correo} falló: ${res.status()} ${await res.text()}`).toBeTruthy()
      return { token: '' }
    }
    await new Promise(r => setTimeout(r, 15_000 * (intento + 1)))
  }
  expect(false, `login ${correo}: rate limit persistente (429)`).toBeTruthy()
  return { token: '' }
}

/** GET con token por la API (usa el proxy del frontend). */
export async function apiGet(request: APIRequestContext, token: string, path: string) {
  const res = await request.get(path, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res
}

/** POST con token por la API. */
export async function apiPost(request: APIRequestContext, token: string, path: string, data: any) {
  const res = await request.post(path, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  })
  return res
}

/** Sube un documento real (PDF fixture) y devuelve su id. */
export async function subirDocumento(
  request: APIRequestContext,
  token: string,
  idProyecto: number,
  archivo = 'acta-demo.pdf',
): Promise<number> {
  const res = await request.post('/api/v1/documentos/upload', {
    headers: { Authorization: `Bearer ${token}` },
    multipart: {
      id_proyecto: String(idProyecto),
      id_tipo_doc: '3',
      archivo: {
        name: archivo,
        mimeType: 'application/pdf',
        buffer: fs.readFileSync(path.join(FIXTURES, archivo)),
      },
    },
  })
  const body = await res.json().catch(() => ({}))
  expect(res.ok(), `subida falló: ${res.status()} ${JSON.stringify(body)}`).toBeTruthy()
  const doc = (body?.data?.documento ?? body?.data) as any
  const id = Number(doc?.id_documento ?? doc?.id)
  expect(id, 'la subida no devolvió id_documento').toBeGreaterThan(0)
  return id
}
