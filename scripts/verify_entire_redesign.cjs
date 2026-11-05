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

async function run() {
  const browser = await chromium.launch({ headless: true });
  const metrics = {};
  const consoleErrors = [];

  for (const vp of VIEWPORTS) {
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

    // Helper to measure CLS, horizontal scroll, and dimensions
    async function auditCurrentPage(screenName) {
      // Check horizontal overflow
      const overflow = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const bodyW = document.body.scrollWidth;
        const winW = window.innerWidth;
        return { docW, bodyW, winW, hasHScroll: docW > winW || bodyW > winW };
      });

      // Get element bounding boxes if available
      const elements = await page.evaluate(() => {
        const res = {};
        // Mascote no card de saldo ou cabeçalho
        const mascot = document.querySelector('img[alt*="Mascot"], img[alt*="Mascote"], img[alt="Avatar"]');
        if (mascot) {
          const r = mascot.getBoundingClientRect();
          res.mascot = { width: Math.round(r.width), height: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left) };
        }
        // Sino de notificação
        const bellBtn = document.querySelector('button[aria-label="Notificações"], button:has(svg.lucide-bell)');
        if (bellBtn) {
          const r = bellBtn.getBoundingClientRect();
          res.bell = { width: Math.round(r.width), height: Math.round(r.height) };
        }
        // Banner no aprender
        const banner = document.querySelector('[data-testid="section-banner"], [class*="degradê"], .relative.w-full.rounded-3xl');
        if (banner) {
          const r = banner.getBoundingClientRect();
          res.banner = { width: Math.round(r.width), height: Math.round(r.height) };
        }
        // Anéis de percentual
        const rings = document.querySelectorAll('svg[class*="rotate"]');
        if (rings.length > 0) {
          const r = rings[0].getBoundingClientRect();
          res.ring = { width: Math.round(r.width), height: Math.round(r.height), count: rings.length };
        }
        // Barras de progresso / gráfico
        const bar = document.querySelector('.h-2, .h-2\\.5, .h-3, .recharts-bar');
        if (bar) {
          const r = bar.getBoundingClientRect();
          res.bar = { width: Math.round(r.width), height: Math.round(r.height) };
        }
        return res;
      });

      metrics[vp.name][screenName] = { overflow, elements };
      await page.screenshot({ path: path.join(OUT_DIR, `${screenName}_${vp.name}.png`) });
    }

    // 1. Authenticate Demo
    console.log(`Authenticating demo for ${vp.name}...`);
    await page.goto('http://127.0.0.1:5173/entrar');
    await page.waitForTimeout(1000);
    const demoBtn = page.locator('text=Ver modo demonstração');
    await demoBtn.click();
    await page.waitForURL('**/inicio', { timeout: 15000 });
    await page.waitForTimeout(4000); // Wait for welcome toast to dismiss

    // 1. Início
    console.log(`Capturing Início ${vp.name}...`);
    await auditCurrentPage('01_inicio');

    // 2. Gastos
    console.log(`Capturing Gastos ${vp.name}...`);
    await page.click('nav a:has-text("Gastos")');
    await page.waitForTimeout(1500);
    await auditCurrentPage('02_gastos');

    // 3. Metas
    console.log(`Capturing Metas ${vp.name}...`);
    await page.click('nav a:has-text("Metas")');
    await page.waitForTimeout(1500);
    await auditCurrentPage('03_metas');

    // 4. Aprender
    console.log(`Capturing Aprender ${vp.name}...`);
    await page.click('nav a:has-text("Aprender")');
    await page.waitForTimeout(1500);
    await auditCurrentPage('04_aprender');

    // 5. Perfil
    console.log(`Capturing Perfil ${vp.name}...`);
    await page.click('nav a:has-text("Perfil")');
    await page.waitForTimeout(1500);
    await auditCurrentPage('05_perfil');

    // 6. Parabéns (Resumo de nível)
    console.log(`Capturing Parabéns ${vp.name}...`);
    // Navigate to a completed lesson or celebration screen directly
    await page.goto('http://127.0.0.1:5173/aprender/licoes/basico/o-que-e-reserva');
    await page.waitForTimeout(1500);
    // Click through or evaluate celebration
    // In LessonPage, celebration is triggered at the end of the lesson. Or we can navigate to celebration state.
    // Let's test if we can complete the quick question or set celebration screen
    await page.evaluate(() => {
      // if quiz engine is present or we can trigger completion state:
      const contBtn = document.querySelector('button');
    });

    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT_DIR, 'audit_metrics.json'), JSON.stringify(metrics, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'console_errors.json'), JSON.stringify(consoleErrors, null, 2));
  console.log('Redesign audit complete! Metrics and screenshots saved.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
