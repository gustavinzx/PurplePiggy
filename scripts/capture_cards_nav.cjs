const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

async function captureCardsNav() {
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
  await page.waitForTimeout(500)

  // 1. Viewport 1: Cards (Saldo, Vidro Claro, Baby & Lilás)
  await page.screenshot({
    path: path.join(outputDir, 'cards_nav_viewport1.png'),
    fullPage: false,
  })

  // 2. Viewport 2: Progresso (Barra simples, empilhada e anéis SVG)
  await page.evaluate(() => window.scrollBy(0, 520))
  await page.waitForTimeout(300)
  await page.screenshot({
    path: path.join(outputDir, 'cards_nav_viewport2.png'),
    fullPage: false,
  })

  // 3. Viewport 3: Tiles de categorias e 4 chips de topo
  await page.evaluate(() => window.scrollBy(0, 560))
  await page.waitForTimeout(300)
  await page.screenshot({
    path: path.join(outputDir, 'cards_nav_viewport3.png'),
    fullPage: false,
  })

  // 4. Viewport 4: Floating Action Button e Bottom Nav
  await page.evaluate(() => window.scrollBy(0, 520))
  await page.waitForTimeout(300)
  await page.screenshot({
    path: path.join(outputDir, 'cards_nav_viewport4.png'),
    fullPage: false,
  })

  // 5. Viewport 5: Comparação visual com as telas 06, 07, 09, 10
  await page.evaluate(() => window.scrollBy(0, 950))
  await page.waitForTimeout(300)
  await page.screenshot({
    path: path.join(outputDir, 'cards_nav_viewport5_comparison.png'),
    fullPage: false,
  })

  // Full page screenshot
  await page.screenshot({
    path: path.join(outputDir, 'cards_nav_fullpage.png'),
    fullPage: true,
  })

  await browser.close()
  console.log('Screenshots de cards e navegação salvos com sucesso!')
}

captureCardsNav().catch(console.error)
