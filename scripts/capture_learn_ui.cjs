// scripts/capture_learn_ui.cjs
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const outDir = path.resolve(__dirname, '../screenshots/learn_ui');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Autenticação via modo demonstração na rota /entrar
  console.log('Autenticando via modo demonstração...');
  await page.goto('http://127.0.0.1:5173/entrar', { waitUntil: 'networkidle' });
  const demoBtn = page.locator('text=Ver modo demonstração');
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForTimeout(3000);
  }

  // 1. Tela Aprender (Mapa Sinuoso / N9B)
  console.log('Capturando /aprender...');
  await page.goto('http://127.0.0.1:5173/aprender', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1b. Tela Aprender com Drawer de Trocar Trilha Aberto (Mockup 10b)
  console.log('Capturando gaveta de trocar trilha...');
  const bannerBtn = page.locator('button:has-text("TRILHA")').first();
  if (await bannerBtn.isVisible()) {
    await bannerBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '01b_trocar_trilha_sheet.png'), fullPage: false });
    // fecha a sheet
    const closeBtn = page.locator('button[aria-label="Fechar"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 2b. Lição Interativa com Resposta Selecionada e Validada (FeedbackPanel)
  console.log('Capturando FeedbackPanel...');
  await page.goto('http://127.0.0.1:5173/aprender/trilha/organizacao-financeira/nivel/1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const optionCard = page.locator('button:has-text("Anotar tudo o que gasta")').first();
  if (await optionCard.isVisible()) {
    await optionCard.click();
    await page.waitForTimeout(400);
    const verifyBtn = page.locator('button:has-text("VERIFICAR")');
    if (await verifyBtn.isVisible()) {
      await verifyBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, '02b_feedback_panel.png'), fullPage: false });
    }
  }

  // 4b. Aba Glossário da Central de Guias (N12)
  console.log('Capturando aba Glossário...');
  await page.goto('http://127.0.0.1:5173/aprender/guias', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const glossaryTab = page.locator('button:has-text("Glossário")');
  if (await glossaryTab.isVisible()) {
    await glossaryTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '04b_glossario_tab.png'), fullPage: false });
  }

  await browser.close();
  console.log('Capturas complementares concluídas!');
}

main().catch(console.error);
