const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

async function captureAtmosphere() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })

  const outputDir = path.resolve(__dirname, '..', 'screenshots', 'atmosphere')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log('Navegando para http://127.0.0.1:5173/design-system/atmosphere...')
  await page.goto('http://127.0.0.1:5173/design-system/atmosphere', { waitUntil: 'networkidle' })

  // 1. Capturar variante ativa inicial (splash)
  console.log('Capturando variante splash...')
  await page.screenshot({ path: path.join(outputDir, 'atmosphere_splash.png'), fullPage: false })

  // 2. Clicar na variante auth
  console.log('Capturando variante auth...')
  await page.click('text=Cadastro & Login')
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outputDir, 'atmosphere_auth.png'), fullPage: false })

  // 3. Clicar na variante app
  console.log('Capturando variante app...')
  await page.click('text=Interna do App')
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outputDir, 'atmosphere_app.png'), fullPage: false })

  // 4. Capturar página completa com a seção comparativa
  console.log('Capturando fullPage...')
  await page.screenshot({ path: path.join(outputDir, 'atmosphere_fullpage.png'), fullPage: true })

  await browser.close()
  console.log('Screenshots capturados com sucesso em:', outputDir)
}

captureAtmosphere().catch(console.error)
