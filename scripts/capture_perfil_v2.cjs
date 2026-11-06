const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve('C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca');

async function capture() {
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: '390x844', width: 390, height: 844 },
    { name: '360x780', width: 360, height: 780 },
    { name: '412x915', width: 412, height: 915 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    console.log(`Authenticating demo for ${vp.name}...`);
    await page.goto('http://127.0.0.1:5173/entrar');
    const demoBtn = page.locator('text=Ver modo demonstração');
    await demoBtn.click();
    await page.waitForURL('**/inicio', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Go to Perfil
    console.log(`Navigating to Perfil for ${vp.name}...`);
    await page.click('nav a:has-text("Perfil")');
    await page.waitForTimeout(1500);

    // Top view
    await page.screenshot({ path: path.join(OUT_DIR, `perfil_${vp.name}.png`) });
    console.log(`Captured perfil_${vp.name}.png`);

    // If 390x844, also capture scrolled view and modal views
    if (vp.name === '390x844') {
      // Scroll down
      await page.evaluate(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTop = main.scrollHeight;
      });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT_DIR, `perfil_scrolled_390x844.png`) });
      console.log(`Captured perfil_scrolled_390x844.png`);

      // Scroll back up
      await page.evaluate(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTop = 0;
      });
      await page.waitForTimeout(300);

      // Open Preferências modal
      await page.click('button:has-text("Preferências")');
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(OUT_DIR, `perfil_preferencias_modal_390x844.png`) });
      console.log(`Captured perfil_preferencias_modal_390x844.png`);

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    await context.close();
  }

  await browser.close();
  console.log('All Perfil V2 screenshots successfully captured!');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
