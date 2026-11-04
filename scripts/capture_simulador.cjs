const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173/entrar');
  const demoBtn = page.locator('button:has-text("Ver modo demonstração")');
  if (await demoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await demoBtn.click();
    await page.waitForURL('**/inicio', { timeout: 10000 });
  }
  await page.goto('http://127.0.0.1:5173/simulador');
  await page.waitForTimeout(1500);

  // Click on 'Horas de Trabalho' tab
  const hoursTab = page.locator('button:has-text("Horas de Trabalho")');
  if (await hoursTab.isVisible()) {
    await hoursTab.click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_simulador_horas_390.png') });
  await browser.close();
  console.log('Saved screen_simulador_horas_390.png');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
