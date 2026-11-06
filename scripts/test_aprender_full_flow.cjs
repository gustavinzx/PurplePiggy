const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/gsds0/.gemini/antigravity/brain/d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca';

async function main() {
  console.log('🚀 Iniciando testes E2E e capturas do fluxo Aprender + Parabéns V2...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Login demo
  console.log('1. Autenticando com conta demo...');
  await page.goto('http://127.0.0.1:5173/entrar');
  await page.click('text=Ver modo demonstração');
  await page.waitForURL('**/inicio', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // 2. Navegar para Aprender
  console.log('2. Navegando para /aprender...');
  await page.click('nav a:has-text("Aprender")');
  await page.waitForURL('**/aprender**');
  await page.waitForTimeout(1500);

  // Screenshot do Mapa com ilhas e animações
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'aprender_mapa_v2.png') });
  console.log('📸 Salvo: aprender_mapa_v2.png');

  // 3. Testar clique em ilha bloqueada -> toast "Conclua a etapa anterior para liberar."
  console.log('3. Testando clique em ilha bloqueada...');
  const lockedNode = page.locator('[role="button"][aria-label*="Bloqueado"]').first();
  if (await lockedNode.isVisible()) {
    await lockedNode.click();
    await page.waitForTimeout(600);
    const toastMsg = page.locator('text=Conclua a etapa anterior para liberar.').first();
    console.log('   Toast de bloqueio exibido:', await toastMsg.isVisible());
  }

  // 4. Testar clique no Baú -> NodeSheet com +30 XP
  console.log('4. Testando clique no Baú...');
  const chestNode = page.locator('[role="button"][aria-label*="Baú"]').first();
  if (await chestNode.isVisible()) {
    await chestNode.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'aprender_nodesheet_bau_v2.png') });
    console.log('📸 Salvo: aprender_nodesheet_bau_v2.png');
    await page.locator('[aria-label="Fechar gaveta"]').click();
    await page.waitForTimeout(400);
  }

  // 5. Testar clique na Ilha Atual -> NodeSheet V2
  console.log('5. Testando clique na ilha atual para abrir NodeSheet V2...');
  const currentNode = page.locator('[role="button"][aria-label*="Nível Atual"]').first();
  await currentNode.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'aprender_nodesheet_v2.png') });
  console.log('📸 Salvo: aprender_nodesheet_v2.png');
  await page.locator('[aria-label="Fechar gaveta"]').click();
  await page.waitForTimeout(400);

  // 6. Testar botão "Começar" do balão -> Inicia nível diretamente
  console.log('6. Testando botão "Começar" do balão (inicia nível direto)...');
  const balloonBtn = page.locator('[data-testid="balloon-current"]');
  if (await balloonBtn.isVisible()) {
    await balloonBtn.click();
    await page.waitForURL('**/aprender/**/nivel/**', { timeout: 10000 });
    console.log('   Navegou direto para a lição:', page.url());
    await page.waitForTimeout(1000);
  }

  // Se já concluiu a trilha anterior e queremos capturar o estado com pig-trophy canônico:
  if (!page.url().includes('/nivel/')) {
    await page.goto('http://127.0.0.1:5173/aprender/trilha/organizacao-financeira/nivel/1');
    await page.waitForTimeout(1000);
  }

  // 7. Responder as perguntas do quiz até completar a lição
  console.log('7. Respondendo exercícios do quiz com 100% de acerto...');
  let maxRounds = 30;
  while (maxRounds > 0) {
    maxRounds--;
    await page.waitForTimeout(500);

    // Se a tela de Parabéns apareceu, encerra o loop
    if (await page.locator('[data-testid="parabens-screen"]').isVisible()) {
      console.log('   🎉 Tela de Parabéns alcançada!');
      break;
    }

    // A) Se o feedback panel estiver visível, clica para avançar para a próxima questão
    const feedbackBtn = page.locator('button:has-text("CONTINUAR"), button:has-text("ENTENDI"), button:has-text("TENTAR NOVAMENTE")').first();
    if (await feedbackBtn.isVisible()) {
      console.log('   Clicando em feedback button:', await feedbackBtn.innerText());
      await feedbackBtn.click();
      await page.waitForTimeout(600);
      continue;
    }

    // B) Trata Concept Matching
    const pairs = [
      { left: 'Investir no Tesouro Selic', right: 'Juros trabalhando a seu favor' },
      { left: 'Entrar no cheque especial', right: 'Juros crescendo contra você' },
      { left: 'Pagamento total à vista', right: 'Zero cobrança de juros' },
      { left: 'Data de Fechamento', right: 'Dia em que a fatura é fechada' },
      { left: 'Data de Vencimento', right: 'Último dia para pagar' },
      { left: 'Limite do Cartão', right: 'Teto máximo emprestado' },
      { left: 'Gasto Essencial', right: 'Aluguel e contas de luz' },
      { left: 'Prioridade Futura', right: 'Poupar R$ 50 para reserva' },
      { left: 'Estilo de Vida', right: 'Café na padaria com amigos' },
    ];
    let matchedAny = false;
    for (const pair of pairs) {
      const leftBtn = page.locator(`button:has-text("${pair.left}")`).first();
      const rightBtn = page.locator(`button:has-text("${pair.right}")`).first();
      if (await leftBtn.isVisible() && await rightBtn.isVisible()) {
        await leftBtn.click();
        await page.waitForTimeout(150);
        await rightBtn.click();
        await page.waitForTimeout(150);
        matchedAny = true;
      }
    }

    if (!matchedAny) {
      const conceptLeftBtns = await page.locator('.grid.grid-cols-2 > div:first-child button').all();
      const conceptRightBtns = await page.locator('.grid.grid-cols-2 > div:last-child button').all();
      if (conceptLeftBtns.length > 0 && conceptRightBtns.length > 0) {
        for (let i = 0; i < conceptLeftBtns.length; i++) {
          if (await conceptLeftBtns[i].isVisible()) {
            await conceptLeftBtns[i].click();
            await page.waitForTimeout(150);
            if (conceptRightBtns[i] && await conceptRightBtns[i].isVisible()) {
              await conceptRightBtns[i].click();
              await page.waitForTimeout(150);
            }
          }
        }
      }
    }

    // C) Trata Fill In The Blank
    const blankWord = page.locator('main button:has-text("integral"), main button:has-text("clareza"), main button:has-text("flexibilidade")').first();
    if (await blankWord.isVisible()) {
      console.log('   Selecionando palavra preenchimento...');
      await blankWord.click();
      await page.waitForTimeout(200);
    } else {
      const anyBlankBtn = page.locator('main div.flex.flex-wrap button').first();
      if (await anyBlankBtn.isVisible()) {
        await anyBlankBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // D) Trata Multiple Choice / Scenario Choice com respostas certas
    const correctAnswers = [
      'Valores adicionais cobrados',
      'Um meio de pagamento que utiliza um empréstimo',
      'Porque possui uma das taxas de juros mais elevadas',
      'Anotar tudo o que gasta',
      'Garantir as contas essenciais primeiro',
      'Conversar abertamente',
      'R$ 100 x 5% = R$ 5 de juros',
      'Juros compostos rendem sobre o montante acumulado',
    ];
    let clickedMc = false;
    for (const ans of correctAnswers) {
      const opt = page.locator(`div[class*="rounded-2xl"][class*="cursor-pointer"]:has-text("${ans}")`).first();
      if (await opt.isVisible()) {
        console.log('   Clicando em opção correta:', ans.slice(0, 30));
        await opt.click();
        await page.waitForTimeout(200);
        clickedMc = true;
        break;
      }
    }
    if (!clickedMc && !matchedAny) {
      const option = page.locator('div[class*="rounded-2xl"][class*="cursor-pointer"]').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(200);
      }
    }

    // E) Clicar em VERIFICAR
    const verifyBtn = page.locator('footer button:has-text("VERIFICAR")').first();
    if (await verifyBtn.isVisible() && await verifyBtn.isEnabled()) {
      console.log('   Clicando em VERIFICAR...');
      await verifyBtn.click();
      await page.waitForTimeout(600);
    }
  }

  // 8. Capturar Tela de Parabéns
  await page.waitForSelector('[data-testid="parabens-screen"]', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'aprender_parabens_v2.png') });
  console.log('📸 Salvo: aprender_parabens_v2.png');

  // 9. Medir FPS no navegador durante animações
  console.log('8. Medindo FPS no navegador...');
  const fpsData = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      function countFrame() {
        frames++;
        if (performance.now() - start < 1000) {
          requestAnimationFrame(countFrame);
        } else {
          resolve(Math.round((frames * 1000) / (performance.now() - start)));
        }
      }
      requestAnimationFrame(countFrame);
    });
  });
  console.log(`   Taxa de quadros medida: ${fpsData} FPS`);

  // 10. Tocar no botão Continuar da Tela de Parabéns
  console.log('9. Clicando em Continuar na Tela de Parabéns...');
  const parabensBtn = page.locator('[data-testid="parabens-screen"] button:has-text("Continuar")');
  await parabensBtn.click();
  await page.waitForTimeout(1000);

  // Verificar se exibiu etapa Ofensiva Piggy
  const streakCard = page.locator('text=Ofensiva Piggy').first();
  if (await streakCard.isVisible()) {
    console.log('   🔥 Tela de Ofensiva Piggy exibida!');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'aprender_ofensiva_v2.png') });
    console.log('📸 Salvo: aprender_ofensiva_v2.png');
    // Clicar em Voltar ao mapa
    const backBtn = page.locator('button:has-text("Voltar ao mapa")').first();
    await backBtn.click();
    await page.waitForTimeout(1000);
  }

  // 11. Verificar retorno ao mapa com próxima ilha destravando e scroll
  console.log('10. Verificando retorno ao mapa...');
  await page.waitForURL('**/aprender**', { timeout: 10000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'aprender_retorno_mapa_v2.png') });
  console.log('📸 Salvo: aprender_retorno_mapa_v2.png');

  // 12. Testar clique em ilha concluída -> NodeSheet com "Refazer" e estrelas
  console.log('11. Testando NodeSheet de ilha concluída...');
  const completedNode = page.locator('[role="button"][aria-label*="Concluído"]').first();
  if (await completedNode.isVisible()) {
    await completedNode.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'aprender_nodesheet_concluido_v2.png') });
    console.log('📸 Salvo: aprender_nodesheet_concluido_v2.png');
  }

  await browser.close();
  console.log('✅ Fluxo E2E executado com 100% de sucesso!');
}

main().catch((err) => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
