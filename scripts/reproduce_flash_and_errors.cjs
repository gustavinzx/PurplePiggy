const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROUTES_TO_TEST = [
  '/',
  '/inicio',
  '/gastos',
  '/metas',
  '/aprender',
  '/perfil',
  '/boas-vindas',
  '/entrar',
  '/diagnostico',
  '/simulador',
  '/orcamento',
  '/open-finance'
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  const consoleLogs = [];
  const network404s = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleLogs.push({ type: msg.type(), text: msg.text(), location: msg.location() });
    }
  });

  page.on('response', (resp) => {
    if (resp.status() >= 400) {
      network404s.push({ url: resp.url(), status: resp.status() });
    }
  });

  const outDir = path.resolve('screenshots/flash_diagnosis');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // First, let's test as an authenticated demo user so we can see internal screens behavior
  console.log('Logging in with Demo user to test authenticated routes...');
  await page.goto('http://127.0.0.1:5173/entrar', { waitUntil: 'networkidle' });
  
  // Click demo button or fill credentials
  const demoBtn = await page.$('button:has-text("Entrar com Modo Demo")');
  if (demoBtn) {
    await demoBtn.click();
    await page.waitForTimeout(1500);
  }

  console.log('Current URL after login attempt:', page.url());

  const results = [];

  for (const route of ROUTES_TO_TEST) {
    console.log(`\n--- Testing Route: ${route} ---`);
    const routeSlug = route.replace(/\//g, '_') || 'root';
    
    // Start navigation
    const navPromise = page.goto(`http://127.0.0.1:5173${route}`, { waitUntil: 'commit' });
    
    // 0ms (immediate after commit)
    await navPromise;
    const shot0Path = path.join(outDir, `${routeSlug}_0ms.png`);
    await page.screenshot({ path: shot0Path });
    const url0 = page.url();

    // ~300ms
    await page.waitForTimeout(300);
    const shot300Path = path.join(outDir, `${routeSlug}_300ms.png`);
    await page.screenshot({ path: shot300Path });
    const url300 = page.url();

    // ~1000ms (700ms more)
    await page.waitForTimeout(700);
    const shot1000Path = path.join(outDir, `${routeSlug}_1000ms.png`);
    await page.screenshot({ path: shot1000Path });
    const url1000 = page.url();

    // ~2000ms (1000ms more)
    await page.waitForTimeout(1000);
    const shot2000Path = path.join(outDir, `${routeSlug}_2000ms.png`);
    await page.screenshot({ path: shot2000Path });
    const url2000 = page.url();

    results.push({
      route,
      url0,
      url300,
      url1000,
      url2000,
      hasUrlChange: url0 !== url2000,
    });

    console.log(`Route ${route}: 0ms=${url0} -> 300ms=${url300} -> 1s=${url1000} -> 2s=${url2000}`);
  }

  // Save report JSON
  fs.writeFileSync(
    'screenshots/flash_diagnosis/diagnosis_report.json',
    JSON.stringify({ results, consoleLogs, network404s }, null, 2),
    'utf-8'
  );

  console.log('\n=== DIAGNOSIS CAPTURE COMPLETE ===');
  console.log('Console Errors/Warnings count:', consoleLogs.length);
  console.log('Network 404/Error count:', network404s.length);

  await browser.close();
})();
