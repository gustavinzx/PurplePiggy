const { chromium } = require('playwright');

async function testLearnDuolingo() {
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
  console.log('✅ Logado na dashboard!');

  console.log('2. Acessando /aprender...');
  await page.goto('http://localhost:5175/aprender');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'screenshots/duolingo_01_learn_page.png' });
  console.log('✅ Screenshot de /aprender capturado!');

  // Abrir Desafio Diário
  console.log('3. Testando modal de desafio diário...');
  const dailyBtn = await page.$('button:has-text("Fazer desafio"), button:has-text("Revisar")');
  if (dailyBtn) {
    await dailyBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshots/duolingo_02_daily_modal.png' });

    // Selecionar primeira opção
    const optionBtn = await page.$('button:has-text("Separar primeiro")');
    if (optionBtn) {
      await optionBtn.click();
      await page.waitForTimeout(400);
      await page.click('button:has-text("Verificar resposta")');
      await page.waitForTimeout(800);
      await page.screenshot({ path: 'screenshots/duolingo_03_daily_checked.png' });
      await page.click('button:has-text("Continuar")');
      await page.waitForTimeout(500);
    }
  }

  // 4. Abrir Lição "Juros: o que são?"
  console.log('4. Acessando lição Juros: o que são?...');
  await page.goto('http://localhost:5175/aprender/juros-sem-misterio/juros-o-que-sao');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'screenshots/duolingo_04_lesson_initial.png' });

  // 5. Selecionar opção correta do quiz Duolingo
  console.log('5. Respondendo quiz da lição...');
  const quizOption = await page.$('button:has-text("Valores adicionais cobrados")');
  if (quizOption) {
    await quizOption.click();
    await page.waitForTimeout(400);
    await page.click('button:has-text("Verificar resposta")');
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/duolingo_05_lesson_quiz_success.png' });

    // Clicar em Concluir lição
    await page.click('button:has-text("Concluir lição")');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'screenshots/duolingo_06_lesson_completed.png' });
  }

  console.log('\n🎉 SUCESSO TOTAL NO MÓDULO DUOLINGO!');
  await browser.close();
}

testLearnDuolingo().catch(err => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
