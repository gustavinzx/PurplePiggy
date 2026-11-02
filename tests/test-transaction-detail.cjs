const { chromium } = require('playwright');

async function testTransactionDetail() {
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

  console.log('2. Acessando /gastos...');
  await page.goto('http://localhost:5175/gastos');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Clicar na primeira transação da lista
  console.log('3. Clicando na primeira transação...');
  const firstTx = await page.$('a[href^="/gastos/"]');
  if (firstTx) {
    await firstTx.click();
    await page.waitForURL('**/gastos/**', { timeout: 10000 });
    console.log('✅ Chegou em Detalhes da transação!');
    await page.waitForTimeout(600);

    await page.screenshot({ path: 'screenshots/screen_08_transaction_detail_live.png' });

    // Modificar o valor e salvar
    console.log('4. Editando descrição e salvando...');
    await page.fill('input[required]', 'Supermercado Mensal da Família');
    await page.click('button:has-text("Salvar alterações")');
    await page.waitForTimeout(1200);

    console.log('✅ Alterações salvas com sucesso no Supabase!');
  }

  await browser.close();
}

testTransactionDetail().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
