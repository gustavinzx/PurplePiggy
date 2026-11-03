const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca';

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Mobile viewport 390x844
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileCtx.newPage();

  console.log('Navigating to login...');
  await mobilePage.goto('http://127.0.0.1:5173/entrar', { waitUntil: 'networkidle' });
  
  // Click Demo Mode
  const demoBtn = mobilePage.locator('button:has-text("Ver modo demonstração")');
  if (await demoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Clicking demo mode button...');
    await demoBtn.click();
    await mobilePage.waitForURL('**/inicio', { timeout: 10000 });
  } else {
    await mobilePage.goto('http://127.0.0.1:5173/inicio', { waitUntil: 'networkidle' });
  }

  // Wait for any toast to disappear
  await mobilePage.waitForTimeout(4500);
  console.log('Capturing mobile /inicio...');
  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen_inicio_390.png'),
    fullPage: false,
  });

  // Scroll to see recent transactions on /inicio
  await mobilePage.evaluate(() => window.scrollBy(0, 450));
  await mobilePage.waitForTimeout(500);
  console.log('Capturing mobile /inicio scrolled...');
  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen_inicio_scrolled_390.png'),
    fullPage: false,
  });

  // Navigate to /gastos
  console.log('Navigating to /gastos...');
  await mobilePage.goto('http://127.0.0.1:5173/gastos', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);
  console.log('Capturing mobile /gastos...');
  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen_gastos_390.png'),
    fullPage: false,
  });

  // Open category dropdown to verify custom menu
  const catBtn = mobilePage.locator('button:has-text("Todas")').first();
  if (await catBtn.isVisible().catch(() => false)) {
    await catBtn.click();
    await mobilePage.waitForTimeout(500);
    console.log('Capturing mobile /gastos with dropdown open...');
    await mobilePage.screenshot({
      path: path.join(ARTIFACT_DIR, 'screen_gastos_dropdown_390.png'),
      fullPage: false,
    });
  }

  // 2. Desktop viewport 1280x800
  const desktopCtx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktopCtx.newPage();
  await desktopPage.goto('http://127.0.0.1:5173/entrar', { waitUntil: 'networkidle' });
  const desktopDemoBtn = desktopPage.locator('button:has-text("Ver modo demonstração")');
  if (await desktopDemoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await desktopDemoBtn.click();
    await desktopPage.waitForURL('**/inicio', { timeout: 10000 });
  } else {
    await desktopPage.goto('http://127.0.0.1:5173/inicio', { waitUntil: 'networkidle' });
  }

  await desktopPage.waitForTimeout(2000);
  console.log('Capturing desktop /inicio...');
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen_inicio_desktop.png'),
    fullPage: false,
  });

  console.log('Capturing desktop /gastos...');
  await desktopPage.goto('http://127.0.0.1:5173/gastos', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(2000);
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen_gastos_desktop.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('Finished capturing all screenshots successfully!');
}

main().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
