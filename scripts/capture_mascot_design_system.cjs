const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 900, height: 1600 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log('Navigating to http://127.0.0.1:5173/design-system/mascot...');
  await page.goto('http://127.0.0.1:5173/design-system/mascot', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Wait for images to load
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve();
            else {
              img.onload = resolve;
              img.onerror = resolve;
            }
          })
      )
    );
  });

  await new Promise((r) => setTimeout(r, 1200));

  const outDir = path.resolve('screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'design_system_mascot.png');
  await page.screenshot({ path: outPath, fullPage: true });

  const artifactPath = path.resolve('C:\\Users\\gsds0\\.gemini\\antigravity\\brain\\d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca\\design_system_mascot.png');
  fs.copyFileSync(outPath, artifactPath);

  console.log('Screenshot saved to:', outPath);
  console.log('Artifact copied to:', artifactPath);

  await browser.close();
})();
