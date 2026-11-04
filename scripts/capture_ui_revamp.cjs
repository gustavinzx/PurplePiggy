const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('Authenticating demo...');
  await page.goto('http://127.0.0.1:5173/entrar');
  const demoBtn = page.locator('text=Ver modo demonstração');
  await demoBtn.click();
  await page.waitForURL('**/inicio', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Início
  console.log('Capturing Início...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'final_01_inicio_390x844.png') });

  // Gastos
  console.log('Capturing Gastos...');
  await page.click('nav a:has-text("Gastos")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'final_02_gastos_390x844.png') });

  // Metas
  console.log('Capturing Metas...');
  await page.click('nav a:has-text("Metas")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'final_03_metas_390x844.png') });

  // Aprender
  console.log('Capturing Aprender...');
  await page.click('nav a:has-text("Aprender")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'final_04_aprender_390x844.png') });

  // Perfil
  console.log('Capturing Perfil...');
  await page.click('nav a:has-text("Perfil")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'final_05_perfil_390x844.png') });

  await browser.close();
  console.log('All 5 screens captured successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
