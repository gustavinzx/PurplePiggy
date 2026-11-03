const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

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
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  page.on('response', (resp) => {
    if (resp.status() >= 400) {
      network404s.push({ url: resp.url(), status: resp.status() });
    }
  });

  const outDir = path.resolve('screenshots/flash_diagnosis');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('1. Navigating to /entrar and clicking Demo button...');
  await page.goto('http://127.0.0.1:5173/entrar', { waitUntil: 'networkidle' });
  
  const demoBtn = await page.$('button:has-text("Ver modo demonstração")');
  if (demoBtn) {
    await demoBtn.click();
    console.log('Clicked demo button. Waiting for navigation...');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(e => console.log('Nav timeout/handled:', e.message));
  }
  
  console.log('Current URL after login:', page.url());

  const routes = ['/', '/inicio', '/gastos', '/metas', '/aprender', '/perfil', '/diagnostico'];

  for (const route of routes) {
    const slug = route.replace(/\//g, '_') || 'root';
    console.log(`\nTesting reload on: ${route}`);
    
    // Direct goto / reload
    await page.goto(`http://127.0.0.1:5173${route}`, { waitUntil: 'commit' });
    
    // 0ms snapshot
    const shot0 = path.join(outDir, `auth_${slug}_0ms.png`);
    await page.screenshot({ path: shot0 });
    const u0 = page.url();

    // 300ms snapshot
    await page.waitForTimeout(300);
    const shot300 = path.join(outDir, `auth_${slug}_300ms.png`);
    await page.screenshot({ path: shot300 });
    const u300 = page.url();

    // 1000ms snapshot
    await page.waitForTimeout(700);
    const shot1000 = path.join(outDir, `auth_${slug}_1000ms.png`);
    await page.screenshot({ path: shot1000 });
    const u1000 = page.url();

    // 2000ms snapshot
    await page.waitForTimeout(1000);
    const shot2000 = path.join(outDir, `auth_${slug}_2000ms.png`);
    await page.screenshot({ path: shot2000 });
    const u2000 = page.url();

    console.log(`Route ${route}:`);
    console.log(`  0ms:    ${u0}`);
    console.log(`  300ms:  ${u300}`);
    console.log(`  1000ms: ${u1000}`);
    console.log(`  2000ms: ${u2000}`);
  }

  fs.writeFileSync('screenshots/flash_diagnosis/console_and_network.json', JSON.stringify({ consoleLogs, network404s }, null, 2));

  await browser.close();
})();
