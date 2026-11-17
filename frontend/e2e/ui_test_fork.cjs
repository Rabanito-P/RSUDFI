/* Captura del landing público del fork (:5175) — escritorio + móvil + login. */
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

  // Landing anónimo (escritorio, página completa)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  console.log('URL anónimo en /:', page.url())
  await page.screenshot({ path: 'shot_80_landing_full.png', fullPage: true })

  // Vista móvil
  const movil = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await movil.goto(BASE, { waitUntil: 'networkidle' })
  await movil.waitForTimeout(1500)
  await movil.screenshot({ path: 'shot_81_landing_movil.png', fullPage: true })

  // Ruta interna anónima → /login
  await page.goto(BASE + '/proyectos', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  console.log('URL anónimo en /proyectos:', page.url())
  await page.screenshot({ path: 'shot_82_login.png' })

  console.log('\n=== ERRORES ===')
  for (const e of errores) console.log(e)
  await browser.close()
}

main().catch((e) => {
  console.error('FALLO SCRIPT:', e.message)
  process.exit(1)
})
