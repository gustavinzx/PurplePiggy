const { chromium } = require('playwright');

async function testGoalsDeposit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // iPhone 14
  });
  const page = await context.newPage();

  console.log('1. Fazendo login com Ana Oliveira...');
  await page.goto('http://localhost:5175/entrar');
  await page.waitForLoadState('networkidle');
  await page.click('button:has-text("Ver modo demonstração")');
  await page.waitForURL('**/inicio', { timeout: 10000 });

  console.log('2. Acessando /metas...');
  await page.goto('http://localhost:5175/metas');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'screenshots/screen_10_metas_initial.png' });

  // 3. Clicar no primeiro card de meta
  console.log('3. Clicando na meta Reserva de emergência...');
  await page.click('div:has-text("Reserva de emergência")');
  await page.waitForTimeout(600);

  // 4. Clicar em Adicionar dinheiro
  console.log('4. Abrindo modal de aporte...');
  await page.click('button:has-text("Adicionar dinheiro")');
  await page.waitForTimeout(600);

  await page.screenshot({ path: 'screenshots/screen_10_modal_aporte.png' });

  // Preencher valor
  console.log('5. Depositando R$ 500...');
  await page.fill('input[placeholder="50,00"]', '500');
  await page.click('button:has-text("Confirmar")');
  await page.waitForTimeout(1500);

  await page.screenshot({ path: 'screenshots/screen_10_metas_apos_aporte.png' });
  console.log('✅ Aporte de R$ 500 realizado com sucesso no Supabase!');

  await browser.close();
}

testGoalsDeposit().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
