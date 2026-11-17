/* Prueba del nuevo login /p/login + lluvia binaria más notoria. */
const { chromium } = require('playwright-core')

const BASE = 'http://localhost:5175'

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } })
  const errores = []
  page.on('pageerror', (e) => errores.push(`[pageerror] ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(`[console] ${m.text()}`)
  })

  // 1) Landing: lluvia más notoria
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'shot_83_landing_rain.png', clip: { x: 0, y: 0, width: 1400, height: 900 } })

  // 2) Botón del header → debe ir a /p/login
  await page.click('text=Plataforma RSUFI')
  await page.waitForTimeout(1200)
  console.log('URL tras botón Plataforma RSUFI:', page.url())
  await page.screenshot({ path: 'shot_84_login_fi.png' })

  // 3) Google OAuth (vista): debe mostrar aviso, no romper
  await page.click('text=Continuar con Google')
  await page.waitForTimeout(600)
  const aviso = await page.textContent('body')
  console.log('Aviso Google visible:', aviso.includes('próximamente'))

  // 4) Login real: estudiante@undc.edu.pe / undc2026
  await page.fill('#correo', 'estudiante@undc.edu.pe')
  await page.fill('#clave', 'undc2026')
  await page.click('button:has-text("Ingresar")')
  await page.waitForTimeout(2500)
  console.log('URL tras login real:', page.url())

  // 5) Cerrar sesión (si hay botón) y verificar /login antiguo intacto
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  console.log('URL /login antiguo:', page.url())
  await page.screenshot({ path: 'shot_85_login_antiguo.png' })

  // 6) Ruta interna anónima → /p/login
  const anon = await browser.newPage({ viewport: { width: 1400, height: 950 } })
  await anon.goto(BASE + '/proyectos', { waitUntil: 'networkidle' })
  await anon.waitForTimeout(1200)
  console.log('Anónimo en /proyectos →', anon.url())

  console.log('\n=== ERRORES ===')
  for (const e of errores) console.log(e)
  await browser.close()
}

main().catch((e) => {
  console.error('FALLO SCRIPT:', e.message)
  process.exit(1)
})
