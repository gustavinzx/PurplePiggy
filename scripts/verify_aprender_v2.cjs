const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca';

const viewports = [
  { name: '360x780', width: 360, height: 780 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
];

async function main() {
  const browser = await chromium.launch({ headless: true });

  const measurements = {};

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    console.log(`Authenticating demo for ${vp.name}...`);
    await page.goto('http://127.0.0.1:5173/entrar');
    const demoBtn = page.locator('text=Ver modo demonstração');
    await demoBtn.click();
    await page.waitForURL('**/inicio', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Ir para Aprender
    await page.click('nav a:has-text("Aprender")');
    await page.waitForTimeout(2000);

    // Capturar screenshot
    const shotPath = path.join(ARTIFACT_DIR, `aprender_${vp.name}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot ${shotPath}`);

    // Medir bounding boxes dos elementos chave
    const boxes = await page.evaluate(() => {
      // Banner
      const banner = document.querySelector('header') || document.querySelector('[class*="rounded-[24px]"]');
      const bannerRect = banner ? banner.getBoundingClientRect() : null;

      // Nós
      const nodes = Array.from(document.querySelectorAll('[role="button"][aria-label*="Nível"]')).map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          ariaLabel: el.getAttribute('aria-label'),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });

      // Balão exato
      const balloon = document.querySelector('[data-testid="balloon-current"]');
      const balloonRect = balloon ? balloon.getBoundingClientRect() : null;

      return {
        banner: bannerRect ? {
          x: Math.round(bannerRect.x),
          y: Math.round(bannerRect.y),
          width: Math.round(bannerRect.width),
          height: Math.round(bannerRect.height),
        } : null,
        nodes,
        balloon: balloonRect ? {
          x: Math.round(balloonRect.x),
          y: Math.round(balloonRect.y),
          width: Math.round(balloonRect.width),
          height: Math.round(balloonRect.height),
        } : null,
      };
    });

    measurements[vp.name] = boxes;
    await context.close();
  }

  await browser.close();

  fs.writeFileSync(
    path.join(__dirname, '../scratch/measurements_aprender.json'),
    JSON.stringify(measurements, null, 2)
  );
  console.log('Measurements saved to scratch/measurements_aprender.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
