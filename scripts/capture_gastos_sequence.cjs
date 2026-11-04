const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://127.0.0.1:5173/entrar', { waitUntil: 'networkidle' });
  const demoBtn = page.locator('button:has-text("Ver modo demonstração")');
  if (await demoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await demoBtn.click();
    await page.waitForURL('**/inicio', { timeout: 10000 });
  }

  // Navigate to /gastos
  await page.goto('http://127.0.0.1:5173/gastos', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Capture 3-filter sequence
  console.log('Capturing screen_gastos_sequence_390.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen_gastos_sequence_390.png'),
    fullPage: false,
  });

  // 2. Open Category dropdown to verify 3D icons for all categories
  const catBtn = page.locator('button:has-text("Todas")').first();
  if (await catBtn.isVisible().catch(() => false)) {
    await catBtn.click();
    await page.waitForTimeout(500);
    console.log('Capturing screen_gastos_cat_icons_390.png...');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'screen_gastos_cat_icons_390.png'),
      fullPage: false,
    });
    // Click outside to close
    await page.mouse.click(10, 10);
    await page.waitForTimeout(300);
  }

  // 3. Open Type dropdown to verify symbols for each type
  const typeBtn = page.locator('button:has-text("Todos")').first();
  if (await typeBtn.isVisible().catch(() => false)) {
    await typeBtn.click();
    await page.waitForTimeout(500);
    console.log('Capturing screen_gastos_type_icons_390.png...');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'screen_gastos_type_icons_390.png'),
      fullPage: false,
    });
    // Click outside to close
    await page.mouse.click(10, 10);
    await page.waitForTimeout(300);
  }

  // 4. Select Moradia and verify pill has 3D Moradia icon
  const catBtn2 = page.locator('button:has-text("Todas")').first();
  if (await catBtn2.isVisible().catch(() => false)) {
    await catBtn2.click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("Moradia")').first().click();
    await page.waitForTimeout(500);
    console.log('Capturing screen_gastos_selected_cat_390.png...');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'screen_gastos_selected_cat_390.png'),
      fullPage: false,
    });
  }

  await browser.close();
  console.log('Done capturing!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
