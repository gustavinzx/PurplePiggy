// scripts/verify_load_resize.cjs
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIEWPORTS = [
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1024x600', width: 1024, height: 600 },
  { name: '390x844', width: 390, height: 844 },
];

const TIMESTAMPS = [0, 100, 300, 600, 1000];

async function measurePage(page) {
  return await page.evaluate(() => {
    const docEl = document.documentElement;
    const clientWidth = docEl.clientWidth;
    const innerWidth = window.innerWidth;
    const scrollbarWidth = innerWidth - clientWidth;
    const scrollHeight = docEl.scrollHeight;
    const clientHeight = docEl.clientHeight;

    // Elements to measure
    const mainCol = document.querySelector('#app-shell-container') || document.querySelector('main') || document.querySelector('#root > div');
    const loadingWrapper = document.querySelector('[alt="Carregando"]')?.closest('div.flex-col') || null;
    const splashWrapper = document.querySelector('.animate-splash-entrance')?.closest('div') || null;
    const atmosphere = document.querySelector('[aria-hidden="true"]') || document.querySelector('.fixed.inset-0') || null;

    const getBox = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        id: el.id || '',
        tag: el.tagName.toLowerCase(),
        className: el.className ? String(el.className).slice(0, 60) : '',
        width: Math.round(r.width * 100) / 100,
        height: Math.round(r.height * 100) / 100,
        left: Math.round(r.left * 100) / 100,
        top: Math.round(r.top * 100) / 100,
      };
    };

    return {
      clientWidth,
      innerWidth,
      scrollbarWidth,
      scrollHeight,
      clientHeight,
      fontsStatus: document.fonts ? document.fonts.status : 'unknown',
      mainContainer: getBox(mainCol),
      loadingWrapper: getBox(loadingWrapper),
      splashWrapper: getBox(splashWrapper),
      atmosphere: getBox(atmosphere),
    };
  });
}

async function runSession(browser, viewport, route, cacheMode, outDir, metricsLog) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  if (cacheMode === 'cold') {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  }

  // If testing authenticated route /inicio, log in first
  if (route === '/inicio') {
    await page.goto('http://127.0.0.1:5173/entrar', { waitUntil: 'networkidle' });
    const demoBtn = page.locator('text=Ver modo demonstração');
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  const sessionPrefix = `${viewport.name}_${route === '/' ? 'splash' : 'inicio'}_${cacheMode}`;
  console.log(`\n--- Testando ${sessionPrefix} ---`);

  // Navigate to target route
  await page.goto(`http://127.0.0.1:5173${route}`);

  for (const ms of TIMESTAMPS) {
    if (ms > 0) {
      await page.waitForTimeout(ms === 100 ? 100 : ms === 300 ? 200 : ms === 600 ? 300 : 400);
    }

    const metrics = await measurePage(page);
    const filename = `${sessionPrefix}_${ms}ms.png`;
    const filepath = path.join(outDir, filename);
    await page.screenshot({ path: filepath, fullPage: false });

    metricsLog.push({
      session: sessionPrefix,
      viewport: viewport.name,
      route,
      cache: cacheMode,
      timestamp: ms,
      metrics,
      screenshot: filename,
    });

    console.log(
      `[${sessionPrefix} @ ${ms}ms] clientW=${metrics.clientWidth}, innerW=${metrics.innerWidth}, sbW=${metrics.scrollbarWidth}, scrollH=${metrics.scrollHeight}, clientH=${metrics.clientHeight}, mainW=${metrics.mainContainer?.width}, mainLeft=${metrics.mainContainer?.left}, fonts=${metrics.fontsStatus}`
    );
  }

  await context.close();
}

async function main() {
  const outDir = path.resolve(__dirname, '../screenshots/load_resize_after');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const metricsLog = [];

  for (const vp of VIEWPORTS) {
    // 1. Splash (rota /)
    await runSession(browser, vp, '/', 'cold', outDir, metricsLog);
    await runSession(browser, vp, '/', 'warm', outDir, metricsLog);

    // 2. Início (rota /inicio)
    await runSession(browser, vp, '/inicio', 'cold', outDir, metricsLog);
    await runSession(browser, vp, '/inicio', 'warm', outDir, metricsLog);
  }

  await browser.close();

  fs.writeFileSync(
    path.join(outDir, 'metrics_after.json'),
    JSON.stringify(metricsLog, null, 2),
    'utf-8'
  );
  console.log('\nMedições pós-correção concluídas e salvas em screenshots/load_resize_after/metrics_after.json!');
}

main().catch(console.error);
