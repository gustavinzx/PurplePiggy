const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca/home_cards_fix';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: '360x780', width: 360, height: 780 },
    { name: '412x915', width: 412, height: 915 },
  ];

  for (const vp of viewports) {
    // -------------------------------------------------------------------------
    // TEST 1: Ana Oliveira (with transactions and goals)
    // -------------------------------------------------------------------------
    const contextAna = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const pageAna = await contextAna.newPage();

    await pageAna.goto('http://localhost:4173/entrar', { waitUntil: 'networkidle' });
    const demoBtn = pageAna.locator('button:has-text("Ver modo demonstração")');
    if (await demoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await demoBtn.click();
      await pageAna.waitForURL('**/inicio', { timeout: 10000 });
    }
    await pageAna.waitForTimeout(1000);
    await pageAna.evaluate(() => {
      document.querySelectorAll('[data-sonner-toaster]').forEach(e => e.remove());
    });

    // Check padding in production build
    const measurements = await pageAna.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.rounded-\\[24px\\]'));
      return cards.map(c => {
        const cs = window.getComputedStyle(c);
        return {
          title: c.innerText.split('\n')[0],
          paddingLeft: cs.paddingLeft,
          paddingRight: cs.paddingRight,
          paddingTop: cs.paddingTop,
          paddingBottom: cs.paddingBottom,
          height: c.getBoundingClientRect().height
        };
      });
    });
    console.log(`[Production ${vp.name} Ana] Measurements:`, measurements);

    // Save Top screenshot
    await pageAna.screenshot({ path: path.join(ARTIFACT_DIR, `after_ana_${vp.name}_top.png`) });

    // Scroll down to cards
    await pageAna.evaluate(() => {
      const scrollEl = document.querySelector('main');
      if (scrollEl) scrollEl.scrollTop = 320;
    });
    await pageAna.waitForTimeout(600);
    await pageAna.screenshot({ path: path.join(ARTIFACT_DIR, `after_ana_${vp.name}_scrolled.png`) });

    // Scroll to very bottom to verify padding-bottom and navigation clearance
    await pageAna.evaluate(() => {
      const scrollEl = document.querySelector('main');
      if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
    });
    await pageAna.waitForTimeout(600);
    await pageAna.screenshot({ path: path.join(ARTIFACT_DIR, `after_ana_${vp.name}_bottom.png`) });

    await contextAna.close();

    // -------------------------------------------------------------------------
    // TEST 2: Empty Account (New user without transactions or goals)
    // -------------------------------------------------------------------------
    const contextEmpty = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const pageEmpty = await contextEmpty.newPage();

    // Register a fresh temporary user
    const randomEmail = `test_empty_${Date.now()}_${Math.floor(Math.random()*1000)}@purplepiggy.app`;
    await pageEmpty.goto('http://localhost:4173/cadastrar', { waitUntil: 'networkidle' });
    await pageEmpty.fill('input[placeholder="Nome completo"]', 'Usuária Nova');
    await pageEmpty.fill('input[placeholder="E-mail"]', randomEmail);
    await pageEmpty.fill('input[placeholder="Senha"]', 'PurplePiggy2026!');
    await pageEmpty.fill('input[placeholder="Confirmar senha"]', 'PurplePiggy2026!');
    await pageEmpty.click('button:has-text("Criar minha conta")');

    // Wait for redirect to diagnostico or skip to inicio
    await pageEmpty.waitForURL('**/{diagnostico,inicio}', { timeout: 10000 }).catch(() => {});
    await pageEmpty.goto('http://localhost:4173/inicio', { waitUntil: 'networkidle' });
    await pageEmpty.waitForTimeout(1200);

    await pageEmpty.evaluate(() => {
      document.querySelectorAll('[data-sonner-toaster]').forEach(e => e.remove());
    });

    await pageEmpty.screenshot({ path: path.join(ARTIFACT_DIR, `after_empty_${vp.name}_top.png`) });

    // Scroll to see empty state cards
    await pageEmpty.evaluate(() => {
      const scrollEl = document.querySelector('main');
      if (scrollEl) scrollEl.scrollTop = 320;
    });
    await pageEmpty.waitForTimeout(600);
    await pageEmpty.screenshot({ path: path.join(ARTIFACT_DIR, `after_empty_${vp.name}_scrolled.png`) });

    await contextEmpty.close();
  }

  await browser.close();
  console.log('All production verification screenshots completed successfully!');
}

run().catch(console.error);
