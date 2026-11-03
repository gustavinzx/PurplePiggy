const { chromium } = require('playwright');

async function capture() {
  const browser = await chromium.launch();
  
  // Viewport mobile 390px (Ritual de tela do AGENTS.md)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  
  await page.goto('http://127.0.0.1:5173/design-system/learn', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForFunction(() => Array.from(document.images).every(img => img.complete && img.naturalWidth > 0));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/design_system_learn_mobile.png', fullPage: true });
  console.log('Mobile screenshot captured: screenshots/design_system_learn_mobile.png');

  // Viewport desktop
  const contextDesk = await browser.newContext({
    viewport: { width: 800, height: 1000 },
    deviceScaleFactor: 1.5,
  });
  const pageDesk = await contextDesk.newPage();
  await pageDesk.goto('http://127.0.0.1:5173/design-system/learn', { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesk.waitForFunction(() => Array.from(document.images).every(img => img.complete && img.naturalWidth > 0));
  await pageDesk.waitForTimeout(1000);
  await pageDesk.screenshot({ path: 'screenshots/design_system_learn_desktop.png', fullPage: true });
  console.log('Desktop screenshot captured: screenshots/design_system_learn_desktop.png');

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
