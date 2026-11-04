const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca/home_cards_fix';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function capture(prefix) {
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: '360x780', width: 360, height: 780 },
    { name: '412x915', width: 412, height: 915 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 1. Ana account
    await page.goto('http://localhost:5175/entrar', { waitUntil: 'networkidle' });
    const demoBtn = page.locator('button:has-text("Ver modo demonstração")');
    if (await demoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await demoBtn.click();
      await page.waitForURL('**/inicio', { timeout: 10000 });
    }
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      document.querySelectorAll('[data-sonner-toaster]').forEach(e => e.remove());
    });

    // Top view
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `${prefix}_ana_${vp.name}_top.png`) });

    // Scroll to see the 4 cards clearly
    await page.evaluate(() => {
      const scrollEl = document.querySelector('main');
      if (scrollEl) scrollEl.scrollTop = 320;
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `${prefix}_ana_${vp.name}_scrolled.png`) });

    await context.close();
  }

  await browser.close();
  console.log(`Saved screenshots with prefix: ${prefix}`);
}

const prefix = process.argv[2] || 'before';
capture(prefix).catch(console.error);
