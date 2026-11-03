// scripts/measure_column_width.cjs
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIEWPORTS = [
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '390x844', width: 390, height: 844 },
];

const TIMESTAMPS = [0, 200, 600, 1000, 2500];

async function measureElements(page) {
  return await page.evaluate(() => {
    const getBox = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        className: el.className ? String(el.className).slice(0, 50) : '',
        width: Math.round(r.width * 100) / 100,
        height: Math.round(r.height * 100) / 100,
        left: Math.round(r.left * 100) / 100,
        top: Math.round(r.top * 100) / 100,
      };
    };

    // 1. Contêiner principal da tela
    const mainContainer = document.querySelector('main') || document.querySelector('#app-shell-container');
    // 2. Card de saldo
    const balanceCard = document.querySelector('.shadow-card-saldo') || document.querySelector('div[class*="from-[#8E32D8]"]');
    // 3. Fileira de atalhos (+ Gasto, + Receita, Simulador)
    const shortcutsRow = Array.from(document.querySelectorAll('.grid-cols-3')).find(el => el.textContent.includes('+ Gasto')) || null;
    // 4. Bottom nav
    const bottomNav = document.querySelector('nav');

    return {
      mainContainer: getBox(mainContainer),
      balanceCard: getBox(balanceCard),
      shortcutsRow: getBox(shortcutsRow),
      bottomNav: getBox(bottomNav),
    };
  });
}

async function runSession(browser, viewport, outDir, metricsLog) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // Log in via demo mode first at normal speed
  await page.goto('http://127.0.0.1:5173/entrar', { waitUntil: 'domcontentloaded' });
  const demoBtn = page.locator('text=Ver modo demonstração');
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForTimeout(2000);
  }

  // Now enable CDP and Slow 3G throttling for the test run
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 200, // 200ms
    downloadThroughput: (750 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });

  const sessionPrefix = `${viewport.name}_inicio_slow3g`;
  console.log(`\n=== Medindo ${sessionPrefix} ===`);

  // Navigate to /inicio
  await page.goto('http://127.0.0.1:5173/inicio');

  for (const ms of TIMESTAMPS) {
    if (ms === 0) {
      // immediate
    } else if (ms === 200) {
      await page.waitForTimeout(200);
    } else if (ms === 600) {
      await page.waitForTimeout(400);
    } else if (ms === 1000) {
      await page.waitForTimeout(400);
    } else if (ms === 2500) {
      await page.waitForTimeout(1500);
    }

    const metrics = await measureElements(page);
    const filename = `${sessionPrefix}_${ms}ms.png`;
    const filepath = path.join(outDir, filename);
    await page.screenshot({ path: filepath, fullPage: false });

    metricsLog.push({
      session: sessionPrefix,
      viewport: viewport.name,
      timestamp: ms,
      metrics,
      screenshot: filename,
    });

    console.log(
      `[${sessionPrefix} @ ${ms}ms] ` +
      `main: W=${metrics.mainContainer?.width}, L=${metrics.mainContainer?.left} | ` +
      `cardSaldo: W=${metrics.balanceCard?.width}, L=${metrics.balanceCard?.left} | ` +
      `atalhos: W=${metrics.shortcutsRow?.width}, L=${metrics.shortcutsRow?.left} | ` +
      `bottomNav: W=${metrics.bottomNav?.width}, L=${metrics.bottomNav?.left}`
    );
  }

  await context.close();
}

async function main() {
  const outDir = path.resolve(__dirname, '../screenshots/column_width_before');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const metricsLog = [];

  for (const vp of VIEWPORTS) {
    await runSession(browser, vp, outDir, metricsLog);
  }

  await browser.close();

  fs.writeFileSync(
    path.join(outDir, 'metrics_column_before.json'),
    JSON.stringify(metricsLog, null, 2),
    'utf-8'
  );
  console.log('\nMedições concluídas e salvas em screenshots/column_width_before/metrics_column_before.json!');
}

main().catch(console.error);
