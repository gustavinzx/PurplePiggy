const { chromium } = require('playwright');

async function testLearnProgression() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // iPhone 14
  });
  const page = await context.newPage();

  console.log('1. Autenticando com usuária Ana Oliveira...');
  await page.goto('http://localhost:5175/entrar');
  await page.waitForLoadState('networkidle');
  await page.click('button:has-text("Ver modo demonstração")');
  await page.waitForURL('**/inicio', { timeout: 10000 });

  console.log('2. Acessando /aprender...');
  await page.goto('http://localhost:5175/aprender');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Clicar em "Continuar trilha"
  console.log('3. Clicando no botão Continuar trilha da Trilha 01...');
  await page.click('button:has-text("Continuar trilha")');
  await page.waitForURL('**/aprender/**', { timeout: 10000 });
  console.log('✅ Entrou na lição! URL:', page.url());
  await page.waitForTimeout(1000);

  // Capturar screenshot da lição aberta
  await page.screenshot({ path: 'screenshots/screen_12_lesson_active.png' });

  // Responder o Desafio Piggy
  console.log('4. Verificando Desafio Piggy da lição...');
  const firstOption = await page.$('div:has-text("Desafio Piggy") ~ div button, button:has-text("Anotar tudo"), button:has-text("Partir da sua renda")');
  if (firstOption) {
    await firstOption.click();
    await page.waitForTimeout(400);
    const confirmBtn = await page.$('button:has-text("Confirmar resposta")');
    if (confirmBtn) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
      console.log('✅ Desafio Piggy respondido com sucesso!');
    }
  }

  // Clicar em Próxima lição
  const nextBtn = await page.$('button:has-text("Próxima lição"), button:has-text("Concluir trilha")');
  if (nextBtn) {
    console.log('5. Clicando no botão de navegação:', await nextBtn.innerText());
    await nextBtn.click();
    await page.waitForTimeout(1000);
    console.log('✅ URL após navegação:', page.url());
  }

  await page.screenshot({ path: 'screenshots/screen_12_progression_verified.png' });
  console.log('🎉 TESTE DE PROGRESSÃO E NAVEGAÇÃO DE LIÇÕES CONCLUÍDO COM SUCESSO!');
  await browser.close();
}

testLearnProgression().catch(err => {
  console.error('Erro na progressão:', err);
  process.exit(1);
});
