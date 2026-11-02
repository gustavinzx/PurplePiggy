const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  const screenshotDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile standard iPhone 14
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log('1. Navegando para Splash (/)...');
  await page.goto('http://localhost:5175/');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, '01_splash.png') });

  console.log('2. Navegando para Boas-vindas (/boas-vindas)...');
  await page.goto('http://localhost:5175/boas-vindas');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, '02_welcome.png') });

  console.log('3. Navegando para Cadastro (/cadastrar)...');
  await page.goto('http://localhost:5175/cadastrar');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, '03_register.png') });

  console.log('4. Navegando para Login (/entrar)...');
  await page.goto('http://localhost:5175/entrar');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, '04_login.png') });

  console.log('5. Clicando em modo demonstração...');
  const demoBtn = await page.getByRole('button', { name: /modo demonstração/i });
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    console.log('Aguardando redirecionamento para o dashboard...');
    await page.waitForURL('**/inicio', { timeout: 15000 }).catch(() => console.log('Timeout URL'));
    await page.waitForTimeout(3000);
  } else {
    await page.goto('http://localhost:5175/inicio');
    await page.waitForTimeout(3000);
  }

  console.log('6. Screenshot Dashboard (/inicio)...');
  await page.screenshot({ path: path.join(screenshotDir, '06_dashboard.png'), fullPage: true });

  console.log('7. Navegando para Gastos (/gastos)...');
  await page.goto('http://localhost:5175/gastos');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '07_gastos.png'), fullPage: true });

  console.log('8. Navegando para Orçamento (/orcamento)...');
  await page.goto('http://localhost:5175/orcamento');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '09_orcamento.png'), fullPage: true });

  console.log('9. Navegando para Metas (/metas)...');
  await page.goto('http://localhost:5175/metas');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '10_metas.png'), fullPage: true });

  console.log('10. Navegando para Aprender (/aprender)...');
  await page.goto('http://localhost:5175/aprender');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '11_aprender.png'), fullPage: true });

  console.log('11. Navegando para Lição (/aprender/organizacao-financeira/para-onde-vai-meu-dinheiro)...');
  await page.goto('http://localhost:5175/aprender/organizacao-financeira/para-onde-vai-meu-dinheiro');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '12_licao.png'), fullPage: true });

  console.log('12. Navegando para Simulador (/simulador)...');
  await page.goto('http://localhost:5175/simulador');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '13_simulador.png'), fullPage: true });

  console.log('13. Navegando para Perfil (/perfil)...');
  await page.goto('http://localhost:5175/perfil');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '14_perfil.png'), fullPage: true });

  console.log('14. Navegando para Open Finance (/open-finance)...');
  await page.goto('http://localhost:5175/open-finance');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '15_open_finance.png'), fullPage: true });

  console.log('15. Testando visão Desktop (1280px)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5175/inicio');
  await desktopPage.waitForTimeout(2000);
  await desktopPage.screenshot({ path: path.join(screenshotDir, '16_desktop_view.png') });

  await browser.close();
  console.log('✅ Todos os screenshots capturados com sucesso!');
}

run().catch((err) => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
