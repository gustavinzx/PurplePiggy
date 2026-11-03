const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

async function captureSplash() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })

  // Garantir que não há sessão para ver a tela Splash neutra
  await context.clearCookies()

  const page = await context.newPage()
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  const outputDir = path.resolve(__dirname, '..', 'screenshots', 'screens')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log('Navegando para http://127.0.0.1:5173/ ...')
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
  // Esperar o fim da animação de entrada
  await page.waitForTimeout(800)

  const outputPath = path.join(outputDir, 'screen_01_splash.png')
  await page.screenshot({
    path: outputPath,
    fullPage: false,
  })

  await browser.close()
  console.log('Screenshot da Splash salvo em:', outputPath)
}

captureSplash().catch(console.error)
