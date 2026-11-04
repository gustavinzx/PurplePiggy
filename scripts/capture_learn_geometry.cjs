const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIEWPORTS = [
  { width: 360, height: 640, name: '360x640' },
  { width: 360, height: 780, name: '360x780' },
  { width: 412, height: 915, name: '412x915' },
  { width: 1280, height: 800, name: '1280x800' },
];

const ARTIFACT_DIR = path.resolve('C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca');

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  // Set up authenticated context once
  const authContext = await browser.newContext();
  const authPage = await authContext.newPage();
  await authPage.goto('http://127.0.0.1:5173/entrar', { waitUntil: 'networkidle' });
  const demoBtn = authPage.locator('text=Ver modo demonstração');
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await authPage.waitForTimeout(2000);
  }
  const storageState = await authContext.storageState();
  await authContext.close();

  const results = {};

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      storageState,
    });
    const page = await context.newPage();

    // Go to /aprender
    await page.goto('http://127.0.0.1:5173/aprender', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Save screenshot
    const shotPath = path.join(ARTIFACT_DIR, `learn_map_${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });

    // Measure elements
    const measurements = await page.evaluate(() => {
      function getBox(el) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          x: Math.round(r.x),
          y: Math.round(r.y),
          width: Math.round(r.width),
          height: Math.round(r.height),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          left: Math.round(r.left),
          right: Math.round(r.right),
        };
      }

      // Check horizontal overflow
      const docScrollW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const hasHOverflow = docScrollW > winW;

      // Header container
      const headerEl = document.querySelector('header');
      const headerBox = getBox(headerEl);

      // Compact banner
      const bannerH1 = document.querySelector('header h1');
      const bannerEl = bannerH1 ? bannerH1.closest('div.rounded-2xl') : document.querySelector('header div.rounded-2xl');
      const bannerBox = getBox(bannerEl);

      // Chips
      const chipContainer = document.querySelector('header .flex.items-center.gap-2');
      const chipElements = chipContainer ? Array.from(chipContainer.children) : [];
      const chips = chipElements.map((el, i) => ({
        index: i,
        text: el.innerText.replace(/\s+/g, ' ').trim(),
        box: getBox(el)
      }));

      // Map container
      const mapContainer = document.querySelector('main > div.overflow-y-auto, main > div[style*="overflow-y"]');
      const mapBox = getBox(mapContainer);
      const mapScroll = mapContainer ? {
        scrollHeight: mapContainer.scrollHeight,
        clientHeight: mapContainer.clientHeight,
        scrollTop: mapContainer.scrollTop,
        scrolls: mapContainer.scrollHeight > mapContainer.clientHeight,
      } : null;

      // Nodes
      const nodeElements = Array.from(document.querySelectorAll('button[aria-label*="Nível"], button[aria-label*="Baú"], button[aria-label*="Troféu"]'));
      const nodes = nodeElements.map(el => ({
        label: el.getAttribute('aria-label'),
        box: getBox(el)
      }));

      // Balloon
      const allDivs = Array.from(document.querySelectorAll('div'));
      const balloonEl = allDivs.find(el => el.textContent?.trim() === 'Começar!' && el.children.length === 0);
      const balloonWrapper = balloonEl ? balloonEl.closest('.absolute.z-20') || balloonEl.parentElement : null;
      const balloonBox = getBox(balloonWrapper || balloonEl);

      // Mascot
      const mascotImg = document.querySelector('img[src*="mascot"], img[alt*="Mascote"], img[alt*="Piggy"]');
      const mascotBox = getBox(mascotImg);

      // Margins check
      const appShellContainer = document.getElementById('app-shell-container');
      const shellBox = getBox(appShellContainer);

      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        hasHOverflow,
        docScrollW,
        shellBox,
        headerBox,
        bannerBox,
        chips,
        mapScroll,
        mapBox,
        nodes,
        balloonBox,
        mascotBox,
      };
    });

    results[vp.name] = measurements;
    await context.close();
  }

  await browser.close();
  
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'learn_map_measurements.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );
  console.log(JSON.stringify(results, null, 2));
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
