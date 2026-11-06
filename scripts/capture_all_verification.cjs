const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve('docs/v2-verification');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '360x780', width: 360, height: 780 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
];

async function solveQuizToParabens(page) {
  let maxRounds = 35;
  while (maxRounds > 0) {
    maxRounds--;
    await page.waitForTimeout(400);

    // If celebration screen reached
    if (await page.locator('[data-testid="parabens-screen"]').isVisible()) {
      return true;
    }

    // Feedback panel button
    const feedbackBtn = page.locator('button:has-text("CONTINUAR"), button:has-text("ENTENDI"), button:has-text("TENTAR NOVAMENTE")').first();
    if (await feedbackBtn.isVisible()) {
      await feedbackBtn.click();
      await page.waitForTimeout(500);
      continue;
    }

    // Concept Matching
    const pairs = [
      { left: 'Investir no Tesouro Selic', right: 'Juros trabalhando a seu favor' },
      { left: 'Entrar no cheque especial', right: 'Juros crescendo contra você' },
      { left: 'Pagamento total à vista', right: 'Zero cobrança de juros' },
      { left: 'Data de Fechamento', right: 'Dia em que a fatura é fechada' },
      { left: 'Data de Vencimento', right: 'Último dia para pagar' },
      { left: 'Limite do Cartão', right: 'Teto máximo emprestado' },
      { left: 'Gasto Essencial', right: 'Aluguel e contas de luz' },
      { left: 'Prioridade Futura', right: 'Poupar R$ 50 para reserva' },
      { left: 'Estilo de Vida', right: 'Café na padaria com amigos' },
    ];
    let matchedAny = false;
    for (const pair of pairs) {
      const leftBtn = page.locator(`button:has-text("${pair.left}")`).first();
      const rightBtn = page.locator(`button:has-text("${pair.right}")`).first();
      if (await leftBtn.isVisible() && await rightBtn.isVisible()) {
        await leftBtn.click();
        await page.waitForTimeout(100);
        await rightBtn.click();
        await page.waitForTimeout(100);
        matchedAny = true;
      }
    }

    // Fill in the blank
    const blankWord = page.locator('main button:has-text("integral"), main button:has-text("clareza"), main button:has-text("flexibilidade")').first();
    if (await blankWord.isVisible()) {
      await blankWord.click();
      await page.waitForTimeout(200);
    }

    // Multiple choice
    const correctAnswers = [
      'Valores adicionais cobrados',
      'Um meio de pagamento que utiliza um empréstimo',
      'Porque possui uma das taxas de juros mais elevadas',
      'Anotar tudo o que gasta',
      'Garantir as contas essenciais primeiro',
      'Conversar abertamente',
      'R$ 100 x 5% = R$ 5 de juros',
      'Juros compostos rendem sobre o montante acumulado',
    ];
    for (const ans of correctAnswers) {
      const opt = page.locator(`div[class*="rounded-2xl"][class*="cursor-pointer"]:has-text("${ans}")`).first();
      if (await opt.isVisible()) {
        await opt.click();
        await page.waitForTimeout(200);
        break;
      }
    }

    // Click VERIFICAR if enabled
    const verifyBtn = page.locator('button:has-text("VERIFICAR")').first();
    if (await verifyBtn.isVisible() && await verifyBtn.isEnabled()) {
      await verifyBtn.click();
      await page.waitForTimeout(400);
    }
  }
  return await page.locator('[data-testid="parabens-screen"]').isVisible();
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const metrics = {};
  const consoleErrors = [];

  // 1. Audit 6 Redesigned screens across 3 viewports
  for (const vp of VIEWPORTS) {
    console.log(`\n=== Auditing Viewport ${vp.name} ===`);
    metrics[vp.name] = {};
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[${vp.name}] ${page.url()}: ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(`[${vp.name}] ${page.url()}: ${err.message}`);
    });

    // Helper
    async function auditScreen(key) {
      await page.waitForTimeout(600);
      const data = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const bodyW = document.body.scrollWidth;
        const winW = window.innerWidth;
        const hScroll = docW > winW || bodyW > winW;

        const res = { docW, bodyW, winW, hScroll };

        // Mascote
        const mascot = document.querySelector('img[alt*="Mascot"], img[alt*="Mascote"], img[alt="Avatar"]');
        if (mascot) {
          const r = mascot.getBoundingClientRect();
          res.mascot = { width: Math.round(r.width), height: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left) };
        }

        // Sino / Notificações
        const bell = document.querySelector('button[aria-label="Notificações"], button:has(svg.lucide-bell)');
        if (bell) {
          const r = bell.getBoundingClientRect();
          res.bell = { width: Math.round(r.width), height: Math.round(r.height) };
        }

        // Banner
        const banner = document.querySelector('[data-testid="section-banner"]');
        if (banner) {
          const r = banner.getBoundingClientRect();
          res.banner = { width: Math.round(r.width), height: Math.round(r.height) };
        }

        // Anéis
        const rings = document.querySelectorAll('svg[class*="rotate"]');
        if (rings.length > 0) {
          const r = rings[0].getBoundingClientRect();
          res.ring = { width: Math.round(r.width), height: Math.round(r.height), count: rings.length };
        }

        // Nós / Ilhas
        const islands = document.querySelectorAll('[data-testid^="level-node-"]');
        if (islands.length > 0) {
          const r = islands[0].getBoundingClientRect();
          res.island = { width: Math.round(r.width), height: Math.round(r.height), count: islands.length };
        }

        return res;
      });

      metrics[vp.name][key] = data;
      const shotPath = path.join(OUT_DIR, `${key}_${vp.name}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`   Captured ${key}_${vp.name}.png (hScroll: ${data.hScroll})`);
    }

    // Authenticate demo
    await page.goto('http://127.0.0.1:5173/entrar');
    await page.click('text=Ver modo demonstração');
    await page.waitForURL('**/inicio', { timeout: 15000 });
    await page.waitForTimeout(4000); // wait for welcome toast to dismiss

    // 01 Início
    await auditScreen('01_inicio');

    // 02 Gastos
    await page.click('nav a:has-text("Gastos")');
    await page.waitForTimeout(1500);
    await auditScreen('02_gastos');

    // 03 Metas
    await page.click('nav a:has-text("Metas")');
    await page.waitForTimeout(1500);
    await auditScreen('03_metas');

    // 04 Aprender
    await page.click('nav a:has-text("Aprender")');
    await page.waitForTimeout(1500);
    await auditScreen('04_aprender');

    // 05 Perfil
    await page.click('nav a:has-text("Perfil")');
    await page.waitForTimeout(1500);
    await auditScreen('05_perfil');

    // 06 Parabéns
    console.log(`   Completing lesson for Parabéns ${vp.name}...`);
    await page.goto('http://127.0.0.1:5173/aprender/trilha/organizacao-financeira/nivel/1');
    await page.waitForTimeout(1500);
    const reachedCelebration = await solveQuizToParabens(page);
    if (reachedCelebration) {
      console.log(`   Celebration reached for ${vp.name}!`);
      await auditScreen('06_parabens');
    } else {
      console.log(`   Fallback celebration capture for ${vp.name}`);
      await page.screenshot({ path: path.join(OUT_DIR, `06_parabens_${vp.name}.png`) });
    }

    await context.close();
  }

  // 2. Audit 9 Non-Redesigned Screens (at 390x844)
  console.log('\n=== Auditing 9 Non-Redesigned Screens ===');
  const nonRedesigned = [
    { key: 'splash', url: 'http://127.0.0.1:5173/', auth: false },
    { key: 'boas-vindas', url: 'http://127.0.0.1:5173/boas-vindas', auth: false },
    { key: 'cadastrar', url: 'http://127.0.0.1:5173/cadastrar', auth: false },
    { key: 'entrar', url: 'http://127.0.0.1:5173/entrar', auth: false },
    { key: 'diagnostico', url: 'http://127.0.0.1:5173/diagnostico', auth: true },
    { key: 'orcamento', url: 'http://127.0.0.1:5173/orcamento', auth: true },
    { key: 'simulador', url: 'http://127.0.0.1:5173/simulador', auth: true },
    { key: 'open-finance', url: 'http://127.0.0.1:5173/open-finance', auth: true },
  ];

  const ctxNoAuth = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const pNoAuth = await ctxNoAuth.newPage();

  for (const s of nonRedesigned.filter(x => !x.auth)) {
    await pNoAuth.goto(s.url);
    await pNoAuth.waitForTimeout(1500);
    const p = path.join(OUT_DIR, `non_redesigned_${s.key}_390x844.png`);
    await pNoAuth.screenshot({ path: p });
    console.log(`   Captured non_redesigned_${s.key}_390x844.png`);
  }
  await ctxNoAuth.close();

  const ctxAuth = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const pAuth = await ctxAuth.newPage();
  await pAuth.goto('http://127.0.0.1:5173/entrar');
  await pAuth.click('text=Ver modo demonstração');
  await pAuth.waitForURL('**/inicio', { timeout: 15000 });
  await pAuth.waitForTimeout(4000);

  for (const s of nonRedesigned.filter(x => x.auth)) {
    await pAuth.goto(s.url);
    await pAuth.waitForTimeout(1500);
    const p = path.join(OUT_DIR, `non_redesigned_${s.key}_390x844.png`);
    await pAuth.screenshot({ path: p });
    console.log(`   Captured non_redesigned_${s.key}_390x844.png`);
  }

  // Also capture transaction detail (/gastos/1)
  await pAuth.goto('http://127.0.0.1:5173/gastos/1');
  await pAuth.waitForTimeout(1500);
  await pAuth.screenshot({ path: path.join(OUT_DIR, 'non_redesigned_gastos_id_390x844.png') });
  console.log('   Captured non_redesigned_gastos_id_390x844.png');

  await ctxAuth.close();
  await browser.close();

  fs.writeFileSync(path.join(OUT_DIR, 'audit_metrics.json'), JSON.stringify(metrics, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'console_errors.json'), JSON.stringify(consoleErrors, null, 2));
  console.log('\n=== Full Audit Suite Completed! ===');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
