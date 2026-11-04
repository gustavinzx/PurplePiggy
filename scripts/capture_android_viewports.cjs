const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca/android_shell';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '360x640', width: 360, height: 640 },
  { name: '360x780', width: 360, height: 780 },
  { name: '412x915', width: 412, height: 915 },
  { name: '600x960', width: 600, height: 960 },
];

const SCREENS = [
  { name: 'inicio', path: '/inicio' },
  { name: 'gastos', path: '/gastos' },
  { name: 'metas', path: '/metas' },
  { name: 'aprender', path: '/aprender' },
  { name: 'perfil', path: '/perfil' },
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

    // Login once
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

    // Wait for settle
    await page.waitForTimeout(1000);

    for (const sc of SCREENS) {
      await page.goto(`http://localhost:5175${sc.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      
      // Hide any toasts
      await page.evaluate(() => {
        document.querySelectorAll('[data-sonner-toaster]').forEach(e => e.remove());
      });

      const outPath = path.join(ARTIFACT_DIR, `${prefix}_${sc.name}_${vp.name}.png`);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`Saved: ${outPath}`);
    }

    await context.close();
  }

  await browser.close();
  console.log(`Finished capture: ${prefix}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
