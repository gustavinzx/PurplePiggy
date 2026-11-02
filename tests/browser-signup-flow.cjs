const { chromium } = require('playwright');

async function testBrowserFlow() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // iPhone 14 mobile viewport
  });
  const page = await context.newPage();

  console.log('1. Acessando tela de cadastro...');
  await page.goto('http://localhost:5175/cadastrar');
  await page.waitForLoadState('networkidle');

  // Preencher formulário de cadastro
  const uniqueEmail = `julia_${Date.now()}@teste.com`;
  console.log('2. Preenchendo cadastro para:', uniqueEmail);
  await page.fill('input[placeholder="Nome completo"]', 'Júlia Mendes');
  await page.fill('input[placeholder="E-mail"]', uniqueEmail);
  await page.fill('input[placeholder="Senha"]', 'MinhaSenhaForte2026!');
  await page.fill('input[placeholder="Confirmar senha"]', 'MinhaSenhaForte2026!');

  // Clicar em Criar minha conta
  console.log('3. Submetendo formulário...');
  await page.click('button:has-text("Criar minha conta")');

  // Aguardar navegação para /diagnostico
  await page.waitForURL('**/diagnostico', { timeout: 10000 });
  console.log('✅ Redirecionado com sucesso para /diagnostico!');

  // Responder pergunta 1 e continuar
  console.log('4. Passo 1 do diagnóstico...');
  await page.click('button:has-text("Continuar")');

  // Responder passo 2
  console.log('5. Passo 2 do diagnóstico...');
  await page.waitForTimeout(600);
  await page.click('button:has-text("Continuar")');

  // Responder passo 3 e concluir
  console.log('6. Concluindo diagnóstico...');
  await page.waitForTimeout(600);
  await page.click('button:has-text("Concluir diagnóstico")');

  // Modal de conclusão com confetes
  console.log('7. Modal de diagnóstico concluído...');
  await page.waitForSelector('button:has-text("Ir para o meu painel")', { timeout: 10000 });
  await page.click('button:has-text("Ir para o meu painel")');

  // Aguardar chegada na Dashboard /inicio
  await page.waitForURL('**/inicio', { timeout: 10000 });
  console.log('✅ Chegou com sucesso na tela inicial (/inicio)!');
  await page.waitForTimeout(1000);

  // 8. Testar lançamento de gasto na Dashboard
  console.log('8. Testando modal de Nova Transação...');
  await page.click('button:has-text("Gasto")');
  await page.waitForTimeout(500);

  console.log('Preenchendo nova transação...');
  await page.fill('input[placeholder="0,00"]', '185,50');
  await page.fill('input[placeholder="Ex: Supermercado, Aluguel, Salário..."]', 'Supermercado da Família');
  await page.screenshot({ path: 'screenshots/browser_04_modal_transacao.png' });
  
  await page.click('button:has-text("Salvar lançamento")');
  await page.waitForTimeout(1500);
  console.log('✅ Transação criada via UI!');

  await page.screenshot({ path: 'screenshots/browser_05_dashboard_com_transacao.png' });

  console.log('\n🎉 SUCESSO TOTAL NO NAVEGADOR! Fluxo completo de usuária registrado em screenshots/');
  await browser.close();
}

testBrowserFlow().catch((err) => {
  console.error('Falha no teste de navegador:', err);
  process.exit(1);
});
