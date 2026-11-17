/* Sonda: estado real del img del decano en móvil y desktop. */
const { chromium } = require('playwright-core')

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  for (const [nombre, w, h] of [['movil', 390, 844], ['desktop', 1400, 950]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } })
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    const info = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')]
      const dec = imgs.find((i) => (i.alt || '').includes('Almidón'))
      const logos = imgs.map((i) => ({
        alt: (i.alt || '').slice(0, 30),
        ok: i.complete && i.naturalWidth > 0,
        src: (i.currentSrc || i.src || '').slice(0, 60),
      }))
      return { decano: dec ? { ok: dec.complete && dec.naturalWidth > 0 } : 'no-encontrado', todos: logos }
    })
    console.log(`--- ${nombre} ---`)
    console.log(JSON.stringify(info, null, 1))
    await page.close()
  }
  await browser.close()
}

main().catch((e) => { console.error(e.message); process.exit(1) })
