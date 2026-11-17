/* Móvil del /p/login + /login antiguo en contexto anónimo. */
const { chromium } = require('playwright-core')
const BASE = 'http://localhost:5175'

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })

  // /p/login móvil
  const movil = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await movil.goto(BASE + '/p/login', { waitUntil: 'networkidle' })
  await movil.waitForTimeout(1200)
  await movil.screenshot({ path: 'shot_86_login_fi_movil.png' })

  // /login antiguo, anónimo (debe seguir completo, sin redirigir)
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } })
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  console.log('/login anónimo URL:', page.url())
  const txt = await page.textContent('body')
  console.log('Login antiguo conserva ingreso rápido:', txt.includes('Ingreso rápido por rol'))
  await page.screenshot({ path: 'shot_87_login_antiguo_anon.png' })

  await browser.close()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
