const { chromium } = require('playwright');
const path = require('path');

const BASELINE_DIR = path.resolve(__dirname, '../docs/baseline-v1');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('Authenticating demo for baseline...');
  await page.goto('http://127.0.0.1:5173/entrar');
  const demoBtn = page.locator('text=Ver modo demonstração');
  await demoBtn.click();
  await page.waitForURL('**/inicio', { timeout: 10000 });
  // Aguarda toast desaparecer
  await page.waitForTimeout(4500);

  // 1. Início
  console.log('Capturing Início baseline...');
  await page.screenshot({ path: path.join(BASELINE_DIR, 'inicio-390x844.png') });

  // 2. Gastos
  console.log('Capturing Gastos baseline...');
  await page.click('nav a:has-text("Gastos")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(BASELINE_DIR, 'gastos-390x844.png') });

  // 3. Metas
  console.log('Capturing Metas baseline...');
  await page.click('nav a:has-text("Metas")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(BASELINE_DIR, 'metas-390x844.png') });

  // 4. Aprender
  console.log('Capturing Aprender baseline...');
  await page.click('nav a:has-text("Aprender")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(BASELINE_DIR, 'aprender-390x844.png') });

  // 5. Perfil
  console.log('Capturing Perfil baseline...');
  await page.click('nav a:has-text("Perfil")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(BASELINE_DIR, 'perfil-390x844.png') });

  await browser.close();
  console.log('All 5 baseline screenshots saved in docs/baseline-v1/ successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
