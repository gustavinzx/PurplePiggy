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
  await page.goto('http://127.0.0.1:5173/entrar', { waitUntil: 'networkidle' });
  const demoBtn = page.locator('text=Ver modo demonstração');
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForTimeout(2500);
  }

  // 2. Capture /inicio
  await page.goto('http://127.0.0.1:5173/inicio', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const homePath = path.join(ARTIFACT_DIR, 'revamp_inicio_390x844.png');
  await page.screenshot({ path: homePath, fullPage: false });

  // Measure pig on card
  const homeMetrics = await page.evaluate(() => {
    const card = document.querySelector('div.bg-gradient-to-br');
    const pig = document.querySelector('img[alt*="Mascote PurplePiggy apoiado"]');
    if (!card || !pig) return null;
    const cr = card.getBoundingClientRect();
    const pr = pig.getBoundingClientRect();
    return {
      cardTop: cr.top,
      cardLeft: cr.left,
      pigBottom: pr.bottom,
      pigTop: pr.top,
      pigRight: pr.right,
      overlap: pr.bottom - cr.top,
    };
  });
  console.log('Home Metrics:', JSON.stringify(homeMetrics, null, 2));

  // 3. Capture /aprender
  await page.goto('http://127.0.0.1:5173/aprender', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const learnPath = path.join(ARTIFACT_DIR, 'revamp_aprender_390x844.png');
  await page.screenshot({ path: learnPath, fullPage: false });

  // 4. Capture /perfil
  await page.goto('http://127.0.0.1:5173/perfil', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const perfilPath = path.join(ARTIFACT_DIR, 'revamp_perfil_390x844.png');
  await page.screenshot({ path: perfilPath, fullPage: false });

  await browser.close();
  console.log('Capturas concluídas com sucesso!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
