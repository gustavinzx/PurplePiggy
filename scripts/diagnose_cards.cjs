const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  await page.goto('http://localhost:5175/entrar', { waitUntil: 'networkidle' });
  const demoBtn = page.locator('button:has-text("Ver modo demonstração")');
  if (await demoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await demoBtn.click();
    await page.waitForURL('**/inicio', { timeout: 10000 });
  }

  await page.waitForTimeout(1000);

  // Measure cards
  const measurements = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.rounded-\\[24px\\]'));
    return cards.map((card, idx) => {
      const rect = card.getBoundingClientRect();
      const computed = window.getComputedStyle(card);
      
      // Calculate total height of children
      let childrenHeight = 0;
      let minChildTop = Infinity;
      let maxChildBottom = -Infinity;
      Array.from(card.children).forEach(ch => {
        const cRect = ch.getBoundingClientRect();
        if (cRect.top < minChildTop) minChildTop = cRect.top;
        if (cRect.bottom > maxChildBottom) maxChildBottom = cRect.bottom;
      });
      const contentHeight = maxChildBottom - minChildTop;

      return {
        idx,
        className: card.className,
        paddingTop: computed.paddingTop,
        paddingLeft: computed.paddingLeft,
        paddingBottom: computed.paddingBottom,
        paddingRight: computed.paddingRight,
        cardHeight: rect.height,
        contentHeight: contentHeight,
        overflow: computed.overflow,
        firstText: card.innerText.split('\n')[0]
      };
    });
  });

  console.log(JSON.stringify(measurements, null, 2));
  await browser.close();
}

main().catch(console.error);
