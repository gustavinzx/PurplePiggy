const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 420, height: 950 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5175/design-system', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Capture full page screenshot of design system showing all 12 mascots
  await page.screenshot({ path: 'screenshots/design_system_mascots.png', fullPage: true });
  console.log('Saved screenshots/design_system_mascots.png');
  
  await browser.close();
})();
