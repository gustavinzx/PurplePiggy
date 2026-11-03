const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  
  // Go to login page
  await page.goto('http://localhost:5175/entrar', { waitUntil: 'networkidle' });
  
  // Fill credentials
  await page.fill('input[type="email"]', 'ana@email.com');
  await page.fill('input[type="password"]', 'PurplePiggy2026!');
  
  // Click submit
  await page.click('button[type="submit"]');
  
  // Wait for navigation to /inicio
  await page.waitForURL('**/inicio', { timeout: 15000 }).catch(() => console.log('Current URL:', page.url()));
  
  // Wait for page to settle
  await page.waitForTimeout(1500);
  
  // Remove any toast from view
  await page.evaluate(() => {
    document.querySelectorAll('[data-sonner-toaster]').forEach(e => e.remove());
  });
  
  // Capture screenshot of /inicio
  await page.screenshot({ path: 'screenshots/screen_06_home.png' });
  console.log('Saved clean screenshots/screen_06_home.png');
  
  await browser.close();
})();
