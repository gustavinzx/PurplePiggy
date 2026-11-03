const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE_URL = 'http://127.0.0.1:5173'
const OUTPUT_DIR = path.resolve(__dirname, '..', 'test-results', 'flash-verification')

const ROUTES = [
  '/',
  '/boas-vindas',
  '/cadastrar',
  '/entrar',
  '/diagnostico',
  '/inicio',
  '/gastos',
  '/gastos/1',
  '/orcamento',
  '/metas',
  '/aprender',
  '/aprender/basico/o-que-e-reserva',
  '/simulador',
  '/perfil',
  '/open-finance',
]

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function safeScreenshot(page, filepath) {
  try {
    await page.screenshot({ path: filepath, timeout: 5000 })
  } catch (err) {
    try {
      await page.waitForTimeout(100)
      await page.screenshot({ path: filepath, timeout: 5000 })
    } catch (e) {
      console.warn(`  [aviso] screenshot em ${filepath} falhou: ${e.message}`)
    }
  }
}

async function runVerification() {
  console.log('🚀 Iniciando verificação de flash e rotas com Playwright...')
  ensureDir(OUTPUT_DIR)

  const browser = await chromium.launch({ headless: true })

  const results = {
    sem_sessao: [],
    com_sessao: [],
    diagnostico_incompleto: [],
  }

  // ==========================================
  // CENÁRIO 1: Sem Sessão (Deslogada)
  // ==========================================
  console.log('\n--- Cenário 1: Sem Sessão ---')
  const ctx1 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })
  const page1 = await ctx1.newPage()

  for (const r of ROUTES) {
    const routeSlug = r === '/' ? 'splash' : r.replace(/\//g, '_').replace(/^_/, '')
    const dir = path.join(OUTPUT_DIR, 'sem_sessao', routeSlug)
    ensureDir(dir)

    console.log(`  Verificando ${r} (sem sessão)...`)
    await page1.goto(BASE_URL + r, { waitUntil: 'domcontentloaded' })

    // 0ms
    await safeScreenshot(page1, path.join(dir, '00_0ms.png'))

    // 300ms
    await page1.waitForTimeout(300)
    await safeScreenshot(page1, path.join(dir, '01_300ms.png'))

    // 1000ms
    await page1.waitForTimeout(700)
    await safeScreenshot(page1, path.join(dir, '02_1000ms.png'))

    // 2000ms
    await page1.waitForTimeout(1000)
    await safeScreenshot(page1, path.join(dir, '03_2000ms.png'))

    const hasPrivateLeak = await page1.evaluate(() => {
      // Verifica se houve vazamento de dashboard em rota protegida quando sem sessão
      const text = document.body.innerText
      return text.includes('Saldo disponível') || text.includes('Suas metas')
    })

    const finalPath = new URL(page1.url()).pathname
    results.sem_sessao.push({
      route: r,
      finalPath,
      hasPrivateLeak,
      ok: !hasPrivateLeak,
    })
  }
  await ctx1.close()

  // ==========================================
  // CENÁRIO 2: Com Sessão e Diagnóstico Completo
  // ==========================================
  console.log('\n--- Cenário 2: Com Sessão (Diagnóstico Completo) ---')
  const ctx2 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })
  const page2 = await ctx2.newPage()

  // Fazer login demo
  await page2.goto(`${BASE_URL}/entrar`, { waitUntil: 'domcontentloaded' })
  await page2.waitForSelector('text=Ver modo demonstração (Ana Oliveira)')
  await page2.click('text=Ver modo demonstração (Ana Oliveira)')
  await page2.waitForURL('**/inicio', { timeout: 15000 })
  console.log('  Login demo realizado com sucesso!')

  for (const r of ROUTES) {
    const routeSlug = r === '/' ? 'splash' : r.replace(/\//g, '_').replace(/^_/, '')
    const dir = path.join(OUTPUT_DIR, 'com_sessao', routeSlug)
    ensureDir(dir)

    console.log(`  Verificando ${r} (com sessão)...`)
    await page2.goto(BASE_URL + r, { waitUntil: 'domcontentloaded' })

    // 0ms
    await safeScreenshot(page2, path.join(dir, '00_0ms.png'))

    // 300ms
    await page2.waitForTimeout(300)
    await safeScreenshot(page2, path.join(dir, '01_300ms.png'))

    // 1000ms
    await page2.waitForTimeout(700)
    await safeScreenshot(page2, path.join(dir, '02_1000ms.png'))

    // 2000ms
    await page2.waitForTimeout(1000)
    await safeScreenshot(page2, path.join(dir, '03_2000ms.png'))

    // Avaliar se rotas públicas piscaram conteúdo público antes de redirecionar
    let flashedPublicScreen = false
    if (['/', '/boas-vindas', '/entrar', '/cadastrar'].includes(r)) {
      const textAt0 = await page2.evaluate(() => document.body.innerText)
      if (textAt0.includes('Esqueci minha senha') || textAt0.includes('Seu dinheiro, seu ritmo')) {
        flashedPublicScreen = true
      }
    }

    const finalPath = new URL(page2.url()).pathname
    results.com_sessao.push({
      route: r,
      finalPath,
      flashedPublicScreen,
      ok: !flashedPublicScreen,
    })
  }
  await ctx2.close()

  // ==========================================
  // CENÁRIO 3: Com Sessão e Diagnóstico Incompleto
  // ==========================================
  console.log('\n--- Cenário 3: Com Sessão (Diagnóstico Incompleto) ---')
  const ctx3 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })
  const page3 = await ctx3.newPage()

  // Login demo
  await page3.goto(`${BASE_URL}/entrar`, { waitUntil: 'domcontentloaded' })
  await page3.waitForSelector('text=Ver modo demonstração (Ana Oliveira)')
  await page3.click('text=Ver modo demonstração (Ana Oliveira)')
  await page3.waitForURL('**/inicio', { timeout: 15000 })

  // Interceptar perfis para simular diagnostic_done = false
  await page3.route('**/rest/v1/profiles*', async (route) => {
    const response = await route.fetch()
    const json = await response.json()
    if (Array.isArray(json)) {
      json.forEach((p) => {
        p.diagnostic_done = false
      })
    } else if (json && typeof json === 'object') {
      json.diagnostic_done = false
    }
    await route.fulfill({
      response,
      json,
    })
  })

  for (const r of ROUTES) {
    const routeSlug = r === '/' ? 'splash' : r.replace(/\//g, '_').replace(/^_/, '')
    const dir = path.join(OUTPUT_DIR, 'diagnostico_incompleto', routeSlug)
    ensureDir(dir)

    console.log(`  Verificando ${r} (diagnóstico incompleto)...`)
    await page3.goto(BASE_URL + r, { waitUntil: 'domcontentloaded' })

    // 0ms
    await safeScreenshot(page3, path.join(dir, '00_0ms.png'))

    // 300ms
    await page3.waitForTimeout(300)
    await safeScreenshot(page3, path.join(dir, '01_300ms.png'))

    // 1000ms
    await page3.waitForTimeout(700)
    await safeScreenshot(page3, path.join(dir, '02_1000ms.png'))

    // 2000ms
    await page3.waitForTimeout(1000)
    await safeScreenshot(page3, path.join(dir, '03_2000ms.png'))

    const finalPath = new URL(page3.url()).pathname
    results.diagnostico_incompleto.push({
      route: r,
      finalPath,
      ok: finalPath === '/diagnostico',
    })
  }
  await ctx3.close()

  await browser.close()

  // Salvar relatório JSON
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'verification_summary.json'),
    JSON.stringify(results, null, 2)
  )

  console.log('\n📊 Resumo da Verificação:')
  console.log('==========================')
  console.log(`Cenário 1 (Sem Sessão): ${results.sem_sessao.filter((x) => x.ok).length}/${results.sem_sessao.length} rotas corretas`)
  console.log(`Cenário 2 (Com Sessão): ${results.com_sessao.filter((x) => x.ok).length}/${results.com_sessao.length} rotas corretas`)
  console.log(`Cenário 3 (Diagnóstico Incompleto): ${results.diagnostico_incompleto.filter((x) => x.ok).length}/${results.diagnostico_incompleto.length} rotas corretas`)
}

runVerification().catch((err) => {
  console.error('Erro na verificação:', err)
  process.exit(1)
})
