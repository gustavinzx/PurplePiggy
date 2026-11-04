const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca/ui_polish';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '360x780', width: 360, height: 780 },
  { name: '412x915', width: 412, height: 915 },
];

const SCREENS = [
  { name: 'perfil', path: '/perfil' },
  { name: 'gastos', path: '/gastos' },
  { name: 'metas', path: '/metas' },
];

async function main() {
  const prefix = process.argv[2] || 'before';
  console.log(`Starting capture: ${prefix}`);

  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // Login as Ana Oliveira
    await page.goto('http://localhost:5175/entrar', { waitUntil: 'networkidle' });
    const demoBtn = page.locator('button:has-text("Ver modo demonstração")');
    if (await demoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await demoBtn.click();
      await page.waitForURL('**/inicio', { timeout: 10000 });
    } else {
      await page.fill('input[type="email"]', 'ana@email.com');
      await page.fill('input[type="password"]', 'PurplePiggy2026!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/inicio', { timeout: 10000 });
    }

    await page.waitForTimeout(1000);

    for (const sc of SCREENS) {
      await page.goto(`http://localhost:5175${sc.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);

      // Hide toasts
      await page.evaluate(() => {
        document.querySelectorAll('[data-sonner-toaster]').forEach((e) => e.remove());
      });

      // Capture top
      const filePathTop = path.join(ARTIFACT_DIR, `${prefix}_${sc.name}_${vp.name}_top.png`);
      await page.screenshot({ path: filePathTop });
      console.log(`Captured: ${filePathTop}`);

      // If page can scroll, scroll to bottom and capture bottom as well
      await page.evaluate(() => {
        const scroller = document.querySelector('main') || window;
        if (scroller.scrollTo) {
          scroller.scrollTo(0, 9999);
        } else {
          window.scrollTo(0, 9999);
        }
      });
      await page.waitForTimeout(400);

      const filePathBottom = path.join(ARTIFACT_DIR, `${prefix}_${sc.name}_${vp.name}_bottom.png`);
      await page.screenshot({ path: filePathBottom });
      console.log(`Captured: ${filePathBottom}`);
    }

    await context.close();
  }

  await browser.close();
  console.log(`Capture complete for ${prefix}!`);
}

main().catch(console.error);
