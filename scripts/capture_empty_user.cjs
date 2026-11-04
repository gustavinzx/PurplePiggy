const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca/home_cards_fix';

async function testEmpty() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  const email = `empty_${Date.now()}@purplepiggy.app`;
  await page.goto('http://localhost:5175/cadastrar');
  await page.fill('input[placeholder="Nome completo"]', 'Mariana Costa');
  await page.fill('input[placeholder="E-mail"]', email);
  await page.fill('input[placeholder="Senha"]', 'PurplePiggy2026!');
  await page.fill('input[placeholder="Confirmar senha"]', 'PurplePiggy2026!');
  await page.click('button:has-text("Criar minha conta")');
  await page.waitForURL('**/diagnostico', { timeout: 10000 });

  await page.click('button:has-text("Continuar")');
  await page.waitForTimeout(400);
  await page.click('button:has-text("Continuar")');
  await page.waitForTimeout(400);
  await page.click('button:has-text("Concluir")');
  await page.waitForURL('**/inicio', { timeout: 10000 });

  // Wait for confetti to settle
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    document.querySelectorAll('[data-sonner-toaster], canvas').forEach(e => e.remove());
  });

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'after_empty_360x780_top.png') });

  // Scroll to see empty state cards
  await page.evaluate(() => {
    const scrollEl = document.querySelector('main');
    if (scrollEl) scrollEl.scrollTop = 320;
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'after_empty_360x780_scrolled.png') });

  await browser.close();
  console.log('Saved settled empty user screenshots!');
}

testEmpty().catch(console.error);
