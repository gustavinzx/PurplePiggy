const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../docs/v2-gastos');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function verifyGastos(browser, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log(`\n========================================`);
  console.log(`Testando /gastos em viewport: ${width}x${height}`);
  console.log(`========================================`);

  await page.goto('http://127.0.0.1:5173/entrar');
  const demoBtn = page.locator('text=Ver modo demonstração');
  await demoBtn.click();
  await page.waitForURL('**/inicio', { timeout: 10000 });

  // Navegar para /gastos via link da bottom nav
  await page.click('nav a:has-text("Gastos")');
  await page.waitForURL('**/gastos*', { timeout: 10000 });

  // Esperar o toast da demo sumir completamente (~5s)
  await page.waitForTimeout(5000);

  // 1. Screenshot da tela inicial de Gastos
  const screenshotMain = path.join(OUT_DIR, `gastos-${width}x${height}.png`);
  await page.screenshot({ path: screenshotMain });
  console.log(`Screenshot principal salvo: ${screenshotMain}`);

  // 2. Testar troca de período para "Últimos 3 meses" e verificar URL
  if (width === 390) {
    console.log('Testando clique em "Últimos 3 meses"...');
    await page.click('button:has-text("Últimos 3 meses")');
    await page.waitForTimeout(500);
    const currentUrl = page.url();
    console.log('URL após troca de período:', currentUrl);
    if (!currentUrl.includes('periodo=3m')) {
      throw new Error(`URL não contém ?periodo=3m! URL: ${currentUrl}`);
    }
    console.log('✅ URL sincronizada com ?periodo=3m com sucesso!');

    // Volta para "Este mês"
    await page.click('button:has-text("Este mês")');
    await page.waitForTimeout(500);

    // 3. Testar abertura de "Ver todas"
    console.log('Testando abertura da modal "Ver todas"...');
    await page.click('button:has-text("Ver todas")');
    await page.waitForTimeout(600);
    const screenshotAll = path.join(OUT_DIR, `gastos-ver-todas-${width}x${height}.png`);
    await page.screenshot({ path: screenshotAll });
    console.log(`Screenshot "Ver todas" salvo: ${screenshotAll}`);
  }

  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  await verifyGastos(browser, 390, 844);
  await verifyGastos(browser, 360, 780);

  await browser.close();
  console.log('\nTodas as verificações de /gastos concluídas com sucesso!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
