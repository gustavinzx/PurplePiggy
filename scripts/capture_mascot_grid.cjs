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
  
  // Find the mascot section and scroll to it
  const section = await page.$('section:last-of-type');
  if (section) {
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await section.screenshot({ path: 'screenshots/mascot_grid_showcase.png' });
    console.log('Saved screenshots/mascot_grid_showcase.png');
  }
  
  await browser.close();
})();
