const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

async function captureComponents() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })

  const outputDir = path.resolve(__dirname, '..', 'screenshots', 'components')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log('Navegando para http://127.0.0.1:5173/design-system...')
  await page.goto('http://127.0.0.1:5173/design-system', { waitUntil: 'networkidle' })

  // 1. Screenshot viewport inicial (Botões e Inputs)
  await page.screenshot({
    path: path.join(outputDir, 'design_system_viewport1.png'),
    fullPage: false,
  })

  // 2. Rolar para a seção de Select, Rádio e Chips
  await page.evaluate(() => window.scrollBy(0, 700))
  await page.waitForTimeout(200)
  await page.screenshot({
    path: path.join(outputDir, 'design_system_viewport2.png'),
    fullPage: false,
  })

  // 3. Rolar para a seção de comparação com 03, 04, 05
  await page.evaluate(() => window.scrollBy(0, 800))
  await page.waitForTimeout(200)
  await page.screenshot({
    path: path.join(outputDir, 'design_system_viewport3_comparison.png'),
    fullPage: false,
  })

  // 4. Capturar página completa
  await page.screenshot({
    path: path.join(outputDir, 'design_system_fullpage.png'),
    fullPage: true,
  })

  await browser.close()
  console.log('Screenshots de componentes salvos em:', outputDir)
}

captureComponents().catch(console.error)
