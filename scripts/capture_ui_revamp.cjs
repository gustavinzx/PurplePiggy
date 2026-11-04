const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Authenticate Demo
  console.log('Authenticating demo...');
  await page.goto('http://127.0.0.1:5173/entrar', { waitUntil: 'networkidle' });
  const demoBtn = page.locator('text=Ver modo demonstração');
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForTimeout(2500);
  }

  const routes = [
    { url: '/inicio', name: 'final_01_inicio_390x844.png' },
    { url: '/gastos', name: 'final_02_gastos_390x844.png' },
    { url: '/metas', name: 'final_03_metas_390x844.png' },
    { url: '/aprender', name: 'final_04_aprender_390x844.png' },
    { url: '/perfil', name: 'final_05_perfil_390x844.png' },
  ];

  for (const r of routes) {
    console.log(`Capturing ${r.url}...`);
    await page.goto(`http://127.0.0.1:5173${r.url}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const shotPath = path.join(ARTIFACT_DIR, r.name);
    await page.screenshot({ path: shotPath, fullPage: false });
  }

  await browser.close();
  console.log('All 5 screens captured successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
